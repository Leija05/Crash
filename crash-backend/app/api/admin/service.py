import csv
import io
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.infrastructure.simulator import simulator
from app.infrastructure.mobile_bridge import bridge

logger = logging.getLogger("crash.admin")


def _source():
    return simulator if settings.DEMO_MODE else bridge


async def get_dashboard_stats() -> dict:
    db = await get_db()
    src = _source()
    drivers = src.list_drivers()
    alerts = src.list_alerts()

    active = sum(1 for d in drivers if d.get("status") == "active")
    critical = sum(1 for a in alerts if a.get("severity") in ("critical", "high") and a.get("status") == "pending")
    pending = sum(1 for a in alerts if a.get("status") == "pending")

    if settings.DEMO_MODE:
        total_impacts = await db.events.count_documents({"type": "impact"})
        last_24h = await db.events.count_documents({
            "type": "impact",
            "ts": {"$gte": (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()},
        })
    else:
        total_impacts = await db.impact_events.count_documents({})
        last_24h = await db.impact_events.count_documents({
            "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()},
        })

    return {
        "total_drivers": len(drivers),
        "active_drivers": active,
        "total_alerts": len(alerts),
        "critical_alerts": critical,
        "pending_alerts": pending,
        "total_impacts": total_impacts,
        "impacts_last_24h": last_24h,
        "demo_mode": settings.DEMO_MODE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def export_impacts_csv(days: int = 30) -> str:
    db = await get_db()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    if settings.DEMO_MODE:
        rows = [a for a in simulator.list_alerts() if (a.get("created_at") or "") >= cutoff]
    else:
        rows = await db.impact_events.find(
            {"created_at": {"$gte": cutoff}},
            {"_id": 0},
        ).sort("created_at", -1).to_list(500)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Fecha", "Conductor", "Severidad", "G-Force",
        "Velocidad", "Latitud", "Longitud", "Estado", "Diagnóstico IA",
    ])
    for r in rows:
        writer.writerow([
            r.get("id", ""),
            r.get("created_at", r.get("ts", "")),
            r.get("driver_name", r.get("user_id", "")),
            r.get("severity", ""),
            r.get("g_force", r.get("gforce", "")),
            r.get("speed", ""),
            r.get("latitude", r.get("lat", "")),
            r.get("longitude", r.get("lng", "")),
            r.get("status", ""),
            (r.get("ai_diagnosis") or {}).get("summary", "") if isinstance(r.get("ai_diagnosis"), dict) else "",
        ])
    return output.getvalue()


async def get_system_analytics(days: int = 7) -> dict:
    db = await get_db()
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=days)).isoformat()

    if settings.DEMO_MODE:
        impacts = [a for a in simulator.list_alerts() if (a.get("created_at") or "") >= cutoff]
    else:
        impacts = await db.impact_events.find(
            {"created_at": {"$gte": cutoff}},
            {"_id": 0, "severity": 1, "g_force": 1, "created_at": 1},
        ).to_list(500)

    severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for i in impacts:
        sev = i.get("severity", "low")
        if sev in severity_counts:
            severity_counts[sev] += 1

    by_day: dict[str, int] = {}
    for i in impacts:
        day = (i.get("created_at") or "")[:10]
        by_day[day] = by_day.get(day, 0) + 1

    return {
        "period_days": days,
        "total_impacts": len(impacts),
        "severity_distribution": severity_counts,
        "impacts_by_day": by_day,
        "timestamp": now.isoformat(),
    }


async def send_email_report(recipient: str) -> dict:
    if not settings.SMTP_HOST:
        return {"status": "error", "message": "SMTP no configurado. Reporte guardado para env\u00edo manual."}
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        stats = await get_dashboard_stats()
        analytics = await get_system_analytics()

        body = f"""
        <h2>C.R.A.S.H. - Reporte del Sistema</h2>
        <p><strong>Fecha:</strong> {stats['timestamp']}</p>
        <hr>
        <h3>Resumen</h3>
        <ul>
            <li>Conductores activos: {stats['active_drivers']}/{stats['total_drivers']}</li>
            <li>Alertas cr\u00edticas: {stats['critical_alerts']}</li>
            <li>Impactos totales: {stats['total_impacts']}</li>
            <li>Impactos \u00faltimas 24h: {stats['impacts_last_24h']}</li>
        </ul>
        <h3>Distribuci\u00f3n por severidad ({analytics['period_days']} d\u00edas)</h3>
        <ul>
            <li>Bajo: {analytics['severity_distribution']['low']}</li>
            <li>Medio: {analytics['severity_distribution']['medium']}</li>
            <li>Alto: {analytics['severity_distribution']['high']}</li>
            <li>Cr\u00edtico: {analytics['severity_distribution']['critical']}</li>
        </ul>
        <p style="color:#666;font-size:11px;">Generado autom\u00e1ticamente por C.R.A.S.H. API</p>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"C.R.A.S.H. Report - {stats['timestamp'][:10]}"
        msg["From"] = settings.SMTP_FROM
        msg["To"] = recipient
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [recipient], msg.as_string())

        return {"status": "sent", "recipient": recipient}
    except Exception as e:
        logger.error(f"Failed to send email report: {e}")
        return {"status": "error", "message": str(e)}