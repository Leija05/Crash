import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId

from app.core.database import get_db
from app.core.config import settings
from app.infrastructure.simulator import simulator
from app.infrastructure.mobile_bridge import bridge


def _source():
    return simulator if settings.DEMO_MODE else bridge


async def list_drivers():
    return {"drivers": _source().list_drivers(), "demo": settings.DEMO_MODE}


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


async def list_alerts():
    return {"alerts": _source().list_alerts()}


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
    return {"impacts": rows, "demo": False}
