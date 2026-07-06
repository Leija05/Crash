import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from app.core.database import get_db
from app.infrastructure.ai_providers import generate_ai_diagnosis
from app.infrastructure.whatsapp_client import send_emergency_alerts

logger = logging.getLogger("crash.impacts")

impact_alert_locks: dict[str, asyncio.Lock] = {}
last_alert_sent_at: dict[str, datetime] = {}
ALERT_COOLDOWN_SECONDS = 25


def classify_severity(g_force: float) -> str:
    if g_force < 5:
        return "low"
    elif g_force < 10:
        return "medium"
    elif g_force < 15:
        return "high"
    return "critical"


def severity_label(sev: str) -> str:
    return {"low": "Bajo", "medium": "Medio", "high": "Alto", "critical": "Crítico"}.get(sev, sev)


async def create_impact(user: dict, body) -> dict:
    db = await get_db()
    severity = classify_severity(body.g_force)
    impact_id = str(uuid.uuid4())
    impact_doc = {
        "id": impact_id,
        "user_id": user["id"],
        "acceleration": {"x": body.acceleration_x, "y": body.acceleration_y, "z": body.acceleration_z},
        "gyroscope": {"x": body.gyroscope_x, "y": body.gyroscope_y, "z": body.gyroscope_z},
        "g_force": body.g_force,
        "severity": severity,
        "severity_label": severity_label(severity),
        "location": {"latitude": body.latitude, "longitude": body.longitude} if body.latitude else None,
        "ai_diagnosis": None,
        "alerts_sent": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.impact_events.insert_one(impact_doc)

    profile = await db.user_profiles.find_one({"user_id": user["id"]}, {"_id": 0})

    diagnosis = None
    try:
        diagnosis = await generate_ai_diagnosis(impact_doc, profile)
        await db.impact_events.update_one(
            {"id": impact_id},
            {"$set": {"ai_diagnosis": diagnosis}},
        )
        impact_doc["ai_diagnosis"] = diagnosis
    except Exception as e:
        logger.error(f"AI diagnosis failed: {e}")

    contact_count = await db.emergency_contacts.count_documents({"user_id": user["id"], "verified": True})
    if contact_count == 0:
        msg = "No tienes contactos de emergencia verificados"
        logger.warning(msg)
        await db.impact_events.update_one(
            {"id": impact_id},
            {"$set": {"alerts_sent": False, "alert_error": msg, "alerted_contacts": []}},
        )
        impact_doc["alerts_sent"] = False
        impact_doc["alerted_contacts"] = []
        impact_doc["alert_error"] = msg
        impact_doc.pop("_id", None)
        return impact_doc

    user_id = user["id"]
    lock = impact_alert_locks.setdefault(user_id, asyncio.Lock())
    async with lock:
        last_sent = last_alert_sent_at.get(user_id)
        now = datetime.now(timezone.utc)
        if last_sent and (now - last_sent).total_seconds() < ALERT_COOLDOWN_SECONDS:
            msg = f"Alerta duplicada suprimida: ya se notificó un impacto en los últimos {ALERT_COOLDOWN_SECONDS} segundos."
            await db.impact_events.delete_one({"id": impact_id, "user_id": user_id})
            impact_doc["alerts_sent"] = True
            impact_doc["alerted_contacts"] = []
            impact_doc["alert_error"] = None
            impact_doc["deduplicated"] = True
            impact_doc["deduplication_reason"] = msg
            impact_doc.pop("_id", None)
            return impact_doc

        try:
            alerted_contacts = await send_emergency_alerts(user, impact_doc, profile, diagnosis)
            if alerted_contacts:
                last_alert_sent_at[user_id] = now
                await db.impact_events.update_one(
                    {"id": impact_id},
                    {"$set": {"alerts_sent": True, "alerted_contacts": alerted_contacts}},
                )
                impact_doc["alerts_sent"] = True
                impact_doc["alerted_contacts"] = alerted_contacts
            else:
                msg = "No hubo contactos notificados en esta ejecución."
                await db.impact_events.update_one(
                    {"id": impact_id},
                    {"$set": {"alerts_sent": False, "alerted_contacts": [], "alert_error": None, "delivery_note": msg}},
                )
                impact_doc["alerts_sent"] = False
                impact_doc["alerted_contacts"] = []
                impact_doc["alert_error"] = None
                impact_doc["delivery_note"] = msg
        except Exception as e:
            msg = f"Error al enviar alertas WhatsApp: {e}"
            logger.error(f"Alert sending failed: {e}")
            await db.impact_events.update_one(
                {"id": impact_id},
                {"$set": {"alerts_sent": False, "alerted_contacts": [], "alert_error": msg}},
            )
            impact_doc["alerts_sent"] = False
            impact_doc["alerted_contacts"] = []
            impact_doc["alert_error"] = msg

    impact_doc.pop("_id", None)
    return impact_doc


async def get_user_impacts(user_id: str) -> list:
    db = await get_db()
    impacts = await db.impact_events.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return impacts


async def get_user_impact(user_id: str, impact_id: str) -> dict | None:
    db = await get_db()
    impact = await db.impact_events.find_one({"id": impact_id, "user_id": user_id}, {"_id": 0})
    return impact


async def false_alarm_from_mobile(user_id: str, payload: dict) -> dict:
    from app.core.database import get_db
    db = await get_db()
    alert_id = payload.get("alert_id")
    reason = payload.get("reason", "cancelled_from_notification")

    if not alert_id:
        raise HTTPException(status_code=400, detail="alert_id requerido")

    impact = await db.impact_events.find_one({"id": alert_id, "user_id": user_id}, {"_id": 0})
    if not impact:
        raise HTTPException(status_code=404, detail="Impacto no encontrado")

    await db.monitor_acks.update_one(
        {"impact_id": alert_id},
        {"$set": {
            "impact_id": alert_id,
            "status": "false_alarm",
            "ack_by": user_id,
            "ack_by_name": "Rider (app móvil)",
            "ack_at": datetime.now(timezone.utc).isoformat(),
            "reason": reason,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    return {"status": "false_alarm_registered", "impact_id": alert_id, "reason": reason}
