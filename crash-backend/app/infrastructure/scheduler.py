"""Scheduler ligero en asyncio para reportes programados y alertas automáticas.

No requiere infra externa (cron/celery). Corre un loop en segundo plano que:
  - Envía reportes programados por empresa (email/WhatsApp/Slack).
  - Notifica a las empresas cuando sus tokens están por agotarse o su
    suscripción está por expirar (a través de sus webhooks).

Todo el trabajo está protegido con try/except para no tumbar el servicio.
"""
import asyncio
import logging
from datetime import datetime, timezone, timedelta

from app.core.config import settings

logger = logging.getLogger("crash.scheduler")


class ReportScheduler:
    def __init__(self):
        self._task: asyncio.Task | None = None
        self._running = False

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("ReportScheduler iniciado (intervalo %s min)", settings.SCHEDULER_INTERVAL_MINUTES)

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self):
        # Pequeña espera inicial para no competir con el arranque.
        await asyncio.sleep(30)
        interval = max(1, settings.SCHEDULER_INTERVAL_MINUTES) * 60
        while self._running:
            try:
                await self._tick()
            except Exception as e:  # noqa: BLE001
                logger.error("Scheduler tick error: %s", e)
            await asyncio.sleep(interval)

    async def _tick(self):
        await self._run_scheduled_reports()
        await self._run_token_alerts()

    # ── Reportes programados ──────────────────────────────────────
    async def _run_scheduled_reports(self):
        from app.core.database import get_db

        db = await get_db()
        now = datetime.now(timezone.utc)
        cursor = db.companies.find({"report_schedule.enabled": True})
        async for company in cursor:
            try:
                sched = company.get("report_schedule") or {}
                freq = sched.get("frequency", "off")
                if freq not in ("daily", "weekly"):
                    continue
                interval_days = 1 if freq == "daily" else 7
                last = company.get("last_report_sent_at")
                if last:
                    try:
                        last_dt = datetime.fromisoformat(last)
                        if last_dt.tzinfo is None:
                            last_dt = last_dt.replace(tzinfo=timezone.utc)
                        if now - last_dt < timedelta(days=interval_days):
                            continue
                    except (ValueError, TypeError):
                        pass
                await self._send_company_report(company, sched, interval_days)
                await db.companies.update_one(
                    {"_id": company["_id"]},
                    {"$set": {"last_report_sent_at": now.isoformat()}},
                )
            except Exception as e:  # noqa: BLE001
                logger.error("Reporte programado falló para %s: %s", company.get("name"), e)

    async def _send_company_report(self, company: dict, sched: dict, days: int):
        report = await self._build_company_report(company, days)
        channel = sched.get("channel", "email")
        recipient = (sched.get("recipient") or "").strip()

        if channel == "email":
            from app.api.admin.service import send_email_report
            if recipient:
                await send_email_report(recipient)
        elif channel == "whatsapp":
            if recipient:
                from app.infrastructure.whatsapp_client import send_whatsapp_message
                await send_whatsapp_message(recipient, report)
        elif channel == "slack":
            cfg = company.get("webhooks") or {}
            from app.infrastructure.notifications import send_slack_message
            if cfg.get("slack_webhook_url"):
                await send_slack_message(cfg["slack_webhook_url"], report)

    async def _build_company_report(self, company: dict, days: int) -> str:
        from app.core.database import get_db

        db = await get_db()
        cid = str(company.get("_id", ""))
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        user_ids = [str(u["_id"]) async for u in db.users.find({"company_id": cid}, {"_id": 1})]
        impacts = 0
        if user_ids:
            impacts = await db.impact_events.count_documents(
                {"user_id": {"$in": user_ids}, "created_at": {"$gte": cutoff}}
            )
        return (
            f"C.R.A.S.H. · Reporte {'diario' if days == 1 else 'semanal'}\n"
            f"Empresa: {company.get('name', '')}\n"
            f"Plan: {company.get('plan_name', '')}\n"
            f"Conductores: {len(user_ids)}\n"
            f"Impactos últimos {days} día(s): {impacts}\n"
            f"Suscripción hasta: {company.get('subscription_expires_at', 'N/D')}"
        )

    # ── Alertas de tokens / suscripción ───────────────────────────
    async def _run_token_alerts(self):
        from app.core.database import get_db
        from app.api.admin.service import get_token_alerts
        from app.infrastructure.notifications import notify_company

        db = await get_db()
        now = datetime.now(timezone.utc)
        alerts = await get_token_alerts()

        # Agrupar por empresa para no duplicar notificaciones.
        by_company: dict[str, list[str]] = {}
        for a in alerts.get("exhaustion", []):
            cid = a.get("company_id")
            if cid:
                by_company.setdefault(cid, []).append(
                    (a.get("company_id"), "token_low",
                     f"Token {a.get('role','')} al {int(a.get('usage_ratio',0)*100)}% "
                     f"({a.get('use_count')}/{a.get('max_uses')} usos)")
                )
        for a in alerts.get("expiring", []):
            cid = a.get("company_id")
            if cid:
                estado = "expiró" if a.get("expired") else f"expira en {a.get('days_left')} día(s)"
                by_company.setdefault(cid, []).append(
                    (a.get("company_id"), "subscription_expiring",
                     f"Suscripción {a.get('role','')} {estado}")
                )

        for cid, items in by_company.items():
            try:
                company = None
                from bson import ObjectId
                try:
                    company = await db.companies.find_one({"_id": ObjectId(cid)})
                except Exception:
                    company = await db.companies.find_one({"id": cid})
                if not company:
                    continue
                # Máximo una notificación por día por empresa.
                last = company.get("last_token_alert_at")
                if last:
                    try:
                        last_dt = datetime.fromisoformat(last)
                        if last_dt.tzinfo is None:
                            last_dt = last_dt.replace(tzinfo=timezone.utc)
                        if now - last_dt < timedelta(days=1):
                            continue
                    except (ValueError, TypeError):
                        pass
                for _cid, event, msg in items:
                    await notify_company(cid, event, "Alerta de suscripción", msg)
                await db.companies.update_one(
                    {"_id": company["_id"]},
                    {"$set": {"last_token_alert_at": now.isoformat()}},
                )
            except Exception as e:  # noqa: BLE001
                logger.error("Alerta de token falló para %s: %s", cid, e)


scheduler = ReportScheduler()
