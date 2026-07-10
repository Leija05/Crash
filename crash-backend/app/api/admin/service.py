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


async def log_admin_action(action: str, detail: str = "", actor: str = "") -> None:
    """Registra una acción de administración (auditoría). No falla nunca."""
    try:
        db = await get_db()
        await db.admin_logs.insert_one({
            "action": action,
            "detail": detail,
            "actor": actor or "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        pass


async def get_audit_log(limit: int = 100) -> list:
    db = await get_db()
    cursor = db.admin_logs.find({}).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(limit)
    for d in docs:
        d["id"] = str(d.get("_id", ""))
        d.pop("_id", None)
    return docs


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


_SEVERITY_WEIGHT = {"low": 1, "medium": 2, "high": 3, "critical": 4}


async def get_token_alerts(threshold: float = None) -> dict:
    """Tokens por agotarse (use_count/max_uses) o suscripciones por expirar."""
    db = await get_db()
    threshold = settings.TOKEN_ALERT_THRESHOLD if threshold is None else threshold
    now = datetime.now(timezone.utc)
    expiry_cutoff = now + timedelta(days=settings.EXPIRY_ALERT_DAYS)

    cursor = db.site_tokens.find({"active": True}, {"_id": 0})
    tokens = await cursor.to_list(500)

    exhaustion = []
    expiring = []
    for t in tokens:
        max_uses = t.get("max_uses", 0) or 0
        use_count = t.get("use_count", 0) or 0
        ratio = (use_count / max_uses) if max_uses > 0 else 0
        remaining = max(0, max_uses - use_count)
        if max_uses > 0 and ratio >= threshold:
            exhaustion.append({
                "company_id": t.get("company_id"),
                "company_name": t.get("name", ""),
                "role": t.get("role", ""),
                "use_count": use_count,
                "max_uses": max_uses,
                "remaining": remaining,
                "usage_ratio": round(ratio, 2),
                "plan_name": t.get("plan_name", ""),
            })
        exp = t.get("expires_at")
        if exp:
            try:
                exp_dt = datetime.fromisoformat(exp)
                if exp_dt.tzinfo is None:
                    exp_dt = exp_dt.replace(tzinfo=timezone.utc)
                if exp_dt <= expiry_cutoff:
                    days_left = (exp_dt - now).days
                    expiring.append({
                        "company_id": t.get("company_id"),
                        "company_name": t.get("name", ""),
                        "role": t.get("role", ""),
                        "expires_at": exp,
                        "days_left": days_left,
                        "expired": exp_dt < now,
                    })
            except (ValueError, TypeError):
                pass

    exhaustion.sort(key=lambda x: x["usage_ratio"], reverse=True)
    expiring.sort(key=lambda x: x["days_left"])

    # Suscripciones de empresa por expirar (campo propio de la empresa).
    subscriptions = []
    try:
        comp_cursor = db.companies.find(
            {"subscription_expires_at": {"$ne": None}},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "subscription_expires_at": 1},
        )
        async for c in comp_cursor:
            exp = c.get("subscription_expires_at")
            if not exp:
                continue
            try:
                exp_dt = datetime.fromisoformat(exp)
                if exp_dt.tzinfo is None:
                    exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            except (ValueError, TypeError):
                continue
            if exp_dt <= expiry_cutoff:
                days_left = (exp_dt - now).days
                subscriptions.append({
                    "company_id": c.get("id") or c.get("_id"),
                    "company_name": c.get("name", ""),
                    "company_email": c.get("email", ""),
                    "subscription_expires_at": exp,
                    "days_left": days_left,
                    "expired": exp_dt < now,
                })
        subscriptions.sort(key=lambda x: x["days_left"])
    except Exception:
        subscriptions = []

    return {
        "threshold": threshold,
        "exhaustion": exhaustion,
        "expiring": expiring,
        "subscriptions": subscriptions,
        "total_alerts": len(exhaustion) + len(expiring) + len(subscriptions),
        "timestamp": now.isoformat(),
    }


async def get_impact_heatmap(company_id: str = None, days: int = 30) -> dict:
    """Puntos de impacto con lat/lng para el mapa de calor, con scope opcional por empresa."""
    db = await get_db()
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=days)).isoformat()

    points = []
    if settings.DEMO_MODE:
        for a in simulator.list_alerts():
            if (a.get("created_at") or "") < cutoff:
                continue
            lat = a.get("latitude", a.get("lat"))
            lng = a.get("longitude", a.get("lng"))
            if lat is None or lng is None:
                continue
            sev = (a.get("severity") or "low").lower()
            points.append({
                "lat": float(lat), "lng": float(lng),
                "severity": sev, "weight": _SEVERITY_WEIGHT.get(sev, 1),
                "g_force": a.get("g_force", a.get("gforce")),
                "company_id": None,
                "company_name": a.get("driver_name", ""),
                "created_at": a.get("created_at", ""),
            })
    else:
        # Mapa user_id -> empresa
        user_company = {}
        async for u in db.users.find(
            {"company_id": {"$ne": None}},
            {"company_id": 1, "company_name": 1},
        ):
            user_company[str(u["_id"])] = {
                "company_id": u.get("company_id"),
                "company_name": u.get("company_name", ""),
            }

        cursor = db.impact_events.find(
            {"created_at": {"$gte": cutoff}, "location": {"$ne": None}},
            {"_id": 0, "user_id": 1, "location": 1, "severity": 1, "g_force": 1, "created_at": 1},
        ).sort("created_at", -1)
        rows = await cursor.to_list(2000)
        for r in rows:
            loc = r.get("location") or {}
            lat = loc.get("latitude")
            lng = loc.get("longitude")
            if lat is None or lng is None:
                continue
            comp = user_company.get(r.get("user_id"), {})
            if company_id and comp.get("company_id") != company_id:
                continue
            sev = (r.get("severity") or "low").lower()
            points.append({
                "lat": float(lat), "lng": float(lng),
                "severity": sev, "weight": _SEVERITY_WEIGHT.get(sev, 1),
                "g_force": r.get("g_force"),
                "company_id": comp.get("company_id"),
                "company_name": comp.get("company_name", ""),
                "created_at": r.get("created_at", ""),
            })

    # Agregación por zona (cuadrícula ~1.1km redondeando a 2 decimales)
    zones: dict[str, dict] = {}
    for p in points:
        key = f"{round(p['lat'], 2)},{round(p['lng'], 2)}"
        z = zones.setdefault(key, {
            "lat": round(p["lat"], 2), "lng": round(p["lng"], 2),
            "count": 0, "risk": 0, "max_severity": "low",
        })
        z["count"] += 1
        z["risk"] += p["weight"]
        if _SEVERITY_WEIGHT.get(p["severity"], 1) > _SEVERITY_WEIGHT.get(z["max_severity"], 1):
            z["max_severity"] = p["severity"]

    return {
        "period_days": days,
        "company_id": company_id,
        "total_points": len(points),
        "points": points,
        "zones": sorted(zones.values(), key=lambda z: z["risk"], reverse=True),
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