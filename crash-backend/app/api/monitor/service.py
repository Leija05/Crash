import asyncio
import random
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId

from app.core.database import get_db
from app.core.config import settings
from app.infrastructure.simulator import simulator
from app.infrastructure.mobile_bridge import bridge
from app.infrastructure.ai_providers import generate_ai_diagnosis
from app.infrastructure.whatsapp_client import send_emergency_alerts


def _source():
    return simulator if settings.DEMO_MODE else bridge


def _company_driver_ids(company_id: str | None) -> set | None:
    """En producción devuelve el conjunto de driver_id de la empresa del
    monitorista. En DEMO o sin company_id devuelve None (sin filtrar)."""
    if settings.DEMO_MODE or not company_id:
        return None
    ids: set = set()
    for d in bridge.list_drivers():
        did = d.get("id") or d.get("user_id")
        if d.get("company_id") == company_id and did:
            ids.add(did)
    return ids or None


async def list_drivers(company_id: str | None = None):
    drivers = _source().list_drivers()
    if not settings.DEMO_MODE and company_id:
        drivers = [d for d in drivers if d.get("company_id") == company_id]
    return {"drivers": drivers, "demo": settings.DEMO_MODE}


async def get_driver(driver_id: str) -> dict:
    src = _source()
    d = src.drivers.get(driver_id)

    if settings.DEMO_MODE:
        db = await get_db()
        profile = await db.drivers.find_one({"id": driver_id}, {"_id": 0})
        if not d and not profile:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Driver not found")
        driver = d or {"id": driver_id, "status": "offline"}
        return {"driver": driver, "profile": profile or {}, "offline": d is None}

    profile = await bridge.driver_profile(driver_id)
    if not d:
        # Conductor de la empresa que no está en línea: mostramos su perfil médico.
        db = await get_db()
        try:
            user = await db.users.find_one(
                {"_id": ObjectId(driver_id)}, {"name": 1, "email": 1, "company_id": 1}
            )
        except Exception:
            user = await db.users.find_one(
                {"id": driver_id}, {"_id": 0, "name": 1, "email": 1, "company_id": 1}
            )
        if not user and not profile:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Driver not found")
        driver = {
            "id": driver_id,
            "name": (user or {}).get("name") or (profile or {}).get("full_name"),
            "email": (user or {}).get("email"),
            "status": "offline",
        }
        return {"driver": driver, "profile": profile or {}, "offline": True}

    return {"driver": d, "profile": profile}


async def driver_history(driver_id: str, limit: int = 200) -> dict:
    if settings.DEMO_MODE:
        db = await get_db()
        cursor = db.telemetry.find({"driver_id": driver_id}, {"_id": 0}).sort("ts", -1).limit(limit)
        points = await cursor.to_list(length=limit)
        points.reverse()
    else:
        points = await bridge.driver_history(driver_id, limit)
    return {"driver_id": driver_id, "points": points}


async def driver_events(driver_id: str, limit: int = 100) -> dict:
    if settings.DEMO_MODE:
        db = await get_db()
        cursor = db.events.find({"driver_id": driver_id}, {"_id": 0}).sort("ts", -1).limit(limit)
        events = await cursor.to_list(length=limit)
    else:
        events = await bridge.driver_events(driver_id, limit)
    return {"driver_id": driver_id, "events": events}


async def list_alerts(company_id: str | None = None):
    alerts = _source().list_alerts()
    ids = _company_driver_ids(company_id)
    if ids is not None:
        alerts = [a for a in alerts if (a.get("driver_id") or a.get("user_id")) in ids]
    return {"alerts": alerts}


async def acknowledge_alert(alert_id: str, user: dict) -> dict:
    a = await _source().acknowledge(alert_id, user)
    if not a:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found or already handled")
    return {"alert": a}


async def false_alarm(alert_id: str, user: dict) -> dict:
    a = await _source().false_alarm(alert_id, user)
    if not a:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"alert": a}


async def list_users():
    db = await get_db()
    users = await db.monitor_operators.find(
        {}, {"_id": 0, "password_hash": 0}
    ).to_list(100)
    return {"users": users}


async def get_system_mode():
    return {
        "demo": settings.DEMO_MODE,
        "source": "simulator" if settings.DEMO_MODE else "mobile_bridge",
        "db_name": settings.DB_NAME,
    }


async def incident_log(incident_id: str) -> dict:
    db = await get_db()
    entries = await db.monitor_incident_logs.find(
        {"incident_id": incident_id}, {"_id": 0}
    ).sort("created_at", -1).limit(200).to_list(200)
    return {"incident_id": incident_id, "entries": entries}


async def add_incident_log(incident_id: str, note: str, user: dict) -> dict:
    db = await get_db()
    note = note.strip()
    if not note:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="La nota no puede estar vacía")
    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": f"log-{uuid.uuid4().hex[:10]}",
        "incident_id": incident_id,
        "note": note[:1200],
        "author_id": user.get("id"),
        "author_email": user.get("email"),
        "author_name": user.get("name") or user.get("email"),
        "created_at": now,
    }
    await db.monitor_incident_logs.insert_one(entry.copy())
    return {"entry": entry}


async def query_impacts(
    q: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    days: Optional[int] = None,
    limit: int = 500,
    company_id: str | None = None,
) -> dict:
    if settings.DEMO_MODE:
        rows = []
        cutoff = None
        if days and days > 0:
            cutoff = (datetime.now(timezone.utc) - __import__("datetime").timedelta(days=days)).isoformat()
        for a in simulator.list_alerts():
            if cutoff and (a.get("created_at") or "") < cutoff:
                continue
            if severity and (a.get("severity") or "").lower() != severity.lower():
                continue
            if status and status != "all" and a.get("status") != status:
                continue
            if q:
                ql = q.strip().lower()
                if ql and ql not in (a.get("driver_name") or "").lower():
                    continue
            rows.append(a)
        return {"impacts": rows[: max(1, min(int(limit), 1000))], "demo": True}

    rows = await bridge.query_impacts(
        q=q, severity=severity, status=status,
        date_from=date_from, date_to=date_to, days=days, limit=limit,
    )
    ids = _company_driver_ids(company_id)
    if ids is not None:
        rows = [r for r in rows if (r.get("driver_id") or r.get("user_id")) in ids]
    return {"impacts": rows, "demo": False}


async def trigger_simulation(company_id: str | None = None, driver_id: Optional[str] = None) -> dict:
    """Trigger a simulated impact event with full pipeline: G-force calculation, AI diagnosis, emergency alerts."""
    if not settings.DEMO_MODE:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Simulation only available in DEMO mode")

    # Step 1: Select a driver
    drivers = simulator.list_drivers()
    active_drivers = [d for d in drivers if d["status"] == "active"]
    if not active_drivers:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No active drivers available for simulation")

    if driver_id:
        target_driver = next((d for d in active_drivers if d["id"] == driver_id), None)
        if not target_driver:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Driver not found or not active")
    else:
        target_driver = random.choice(active_drivers)

    # Step 2: Calculate G-force (simulate accelerometer/gyroscope)
    gforce = round(random.uniform(4.5, 8.5), 2)
    speed = round(target_driver["speed"], 1)

    # Update driver status to critical
    target_driver["status"] = "critical"
    target_driver["gforce"] = gforce

    # Step 3: Create alert
    alert = {
        "id": f"alt-{uuid.uuid4().hex[:8]}",
        "driver_id": target_driver["id"],
        "driver_name": target_driver["name"],
        "type": "impact",
        "severity": "critical" if gforce >= 6 else "high",
        "lat": target_driver["lat"],
        "lng": target_driver["lng"],
        "gforce": gforce,
        "speed": speed,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "severity_label": "Crítico" if gforce >= 6 else "Alto",
        "ai_diagnosis": None,
        "alerts_sent": False,
        "ack_by": None,
        "ack_at": None,
        "simulated": True,
    }
    simulator.alerts[alert["id"]] = alert

    # Save to database
    db = await get_db()
    await db.alerts.insert_one(alert.copy())
    await db.events.insert_one({
        "id": f"evt-{uuid.uuid4().hex[:8]}",
        "driver_id": target_driver["id"],
        "type": "impact",
        "severity": alert["severity"],
        "lat": alert["lat"],
        "lng": alert["lng"],
        "gforce": gforce,
        "speed": speed,
        "ts": alert["created_at"],
    })

    # Step 4: Generate AI diagnosis
    profile = await db.user_profiles.find_one({"user_id": target_driver["id"]}, {"_id": 0})
    diagnosis = None
    try:
        diagnosis = await generate_ai_diagnosis({
            "id": alert["id"],
            "g_force": gforce,
            "speed_kmh": speed,
            "severity": alert["severity"],
            "location": {"latitude": target_driver["lat"], "longitude": target_driver["lng"]},
            "driver_name": target_driver["name"],
        }, profile)
        await db.alerts.update_one({"id": alert["id"]}, {"$set": {"ai_diagnosis": diagnosis}})
        alert["ai_diagnosis"] = diagnosis
    except Exception as e:
        import logging
        logging.getLogger("crash.monitor").error(f"AI diagnosis failed: {e}")

    # Step 5: Send emergency alerts
    contact_count = await db.emergency_contacts.count_documents({"user_id": target_driver["id"], "verified": True})
    alerted_contacts = []
    if contact_count > 0:
        try:
            alerted_contacts = await send_emergency_alerts(
                {"id": target_driver["id"], "name": target_driver["name"], "email": target_driver.get("email", "")},
                alert,
                profile,
                diagnosis
            )
            await db.alerts.update_one(
                {"id": alert["id"]},
                {"$set": {"alerts_sent": True, "alerted_contacts": alerted_contacts}}
            )
            alert["alerts_sent"] = True
            alert["alerted_contacts"] = alerted_contacts
        except Exception as e:
            import logging
            logging.getLogger("crash.monitor").error(f"Alert sending failed: {e}")
            await db.alerts.update_one(
                {"id": alert["id"]},
                {"$set": {"alerts_sent": False, "alerted_contacts": [], "alert_error": str(e)}}
            )
            alert["alerts_sent"] = False
            alert["alert_error"] = str(e)
    else:
        await db.alerts.update_one(
            {"id": alert["id"]},
            {"$set": {"alerts_sent": False, "alerted_contacts": [], "alert_error": "No verified emergency contacts"}}
        )
        alert["alerts_sent"] = False
        alert["alert_error"] = "No verified emergency contacts"

    # Broadcast the new alert via websocket
    from app.api.monitor.websockets import manager
    await manager.broadcast({"type": "alert", "alert": alert})

    # Return the full simulation result
    return {
        "alert": alert,
        "gforce": gforce,
        "severity": alert["severity"],
        "severity_label": alert["severity_label"],
        "driver": {
            "id": target_driver["id"],
            "name": target_driver["name"],
            "vehicle": target_driver["vehicle"],
        },
        "diagnosis": diagnosis,
        "contacts_notified": len(alerted_contacts) if alerted_contacts else 0,
        "steps_completed": [
            {"step": "gforce", "completed": True, "data": {"gforce": gforce}},
            {"step": "report", "completed": True, "data": {"diagnosis": diagnosis is not None}},
            {"step": "sending", "completed": True, "data": {"contacts_notified": len(alerted_contacts) if alerted_contacts else 0}},
            {"step": "complete", "completed": True, "data": {}},
        ]
    }
