import hashlib
import hmac
import json
import logging

import httpx
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger("crash.whatsapp")


async def send_whatsapp_message(phone: str, message: str, template_params: list[str] | None = None):
    url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message},
    }
    using_template = bool(settings.WHATSAPP_COLLISION_TEMPLATE_NAME)
    if using_template:
        components = []
        if template_params:
            components = [{
                "type": "body",
                "parameters": [{"type": "text", "text": str(p)} for p in template_params],
            }]
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "template",
            "template": {
                "name": settings.WHATSAPP_COLLISION_TEMPLATE_NAME,
                "language": {"code": settings.WHATSAPP_TEMPLATE_LANGUAGE},
                **({"components": components} if components else {}),
            },
        }

    async with httpx.AsyncClient() as http_client:
        resp = await http_client.post(url, json=payload, headers=headers)
        logger.info(f"WhatsApp response: {resp.status_code} - {resp.text}")
        if resp.status_code >= 400 and using_template and settings.WHATSAPP_TEMPLATE_FALLBACK_ON_24H:
            fallback_payload = {
                "messaging_product": "whatsapp",
                "to": phone,
                "type": "text",
                "text": {"body": message},
            }
            fallback_resp = await http_client.post(url, json=fallback_payload, headers=headers)
            logger.info(f"WhatsApp fallback response: {fallback_resp.status_code} - {fallback_resp.text}")
            if fallback_resp.status_code < 400:
                return fallback_resp.json()

        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=f"WhatsApp API error: {resp.text}")
        return resp.json()


async def validate_whatsapp_contact(phone: str) -> dict:
    url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/contacts"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {"blocking": "wait", "contacts": [phone], "force_check": True}
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.post(url, json=payload, headers=headers)
        if resp.status_code >= 400:
            return {
                "checked": False,
                "is_whatsapp_user": False,
                "can_receive_in_dev_mode": False,
                "reason": f"No se pudo validar en WhatsApp API: {resp.text}",
            }
        data = resp.json() if resp.text else {}
        first = ((data.get("contacts") or [{}])[0]) if isinstance(data, dict) else {}
        status = first.get("status")
        is_valid = status == "valid"
        return {
            "checked": True,
            "is_whatsapp_user": is_valid,
            "can_receive_in_dev_mode": False,
            "status": status or "unknown",
            "wa_id": first.get("wa_id"),
            "reason": (
                "Número válido en WhatsApp, pero en modo desarrollo debes agregarlo manualmente en "
                "Meta Dashboard > WhatsApp > API Setup > Add recipient phone number."
            ),
        }


def build_diagnosis_summary(diagnosis: dict | None) -> str:
    if not diagnosis:
        return "Sin diagnóstico IA disponible."

    severity = diagnosis.get("severity_assessment", "N/A")
    priority = diagnosis.get("priority_level", "N/A")
    injuries = diagnosis.get("possible_injuries") or []
    recommendation = (diagnosis.get("emergency_recommendations") or ["Contactar servicios de emergencia"])[0]
    injuries_text = ", ".join(injuries[:2]) if injuries else "No especificadas"

    return (
        f"Severidad: {severity}. "
        f"Prioridad: {priority}. "
        f"Lesiones posibles: {injuries_text}. "
        f"Acción recomendada: {recommendation}."
    )


async def send_emergency_alerts(user: dict, impact: dict, profile: dict | None, diagnosis: dict | None):
    from app.core.database import get_db

    db = await get_db()
    contacts = await db.emergency_contacts.find(
        {"user_id": user["id"], "verified": True}
    ).to_list(50)

    if not contacts:
        logger.warning("No verified contacts to alert")
        return []

    location_str = ""
    if impact.get("location") and impact["location"].get("latitude"):
        lat = impact["location"]["latitude"]
        lon = impact["location"]["longitude"]
        location_str = f"Ubicación: https://maps.google.com/?q={lat},{lon}\n"

    diagnosis_summary = build_diagnosis_summary(diagnosis)
    diagnosis_str = f"Diagnóstico IA (resumen):\n{diagnosis_summary}\n"

    message = (
        f"ALERTA DE EMERGENCIA C.R.A.S.H.\n\n"
        f"Se ha detectado un impacto de {impact['g_force']:.1f}G ({impact['severity_label']})\n"
        f"Fecha: {impact['created_at']}\n\n"
        f"{location_str}"
        f"{diagnosis_str}\n"
        f"Por favor, contacte a {user.get('name', 'el usuario')} inmediatamente."
    )

    unique_contacts = []
    seen_phones = set()
    for contact in contacts:
        phone = (contact.get("phone") or "").strip()
        if not phone or phone in seen_phones:
            continue
        seen_phones.add(phone)
        unique_contacts.append(contact)

    alerted_contacts = []
    template_values = [
        impact.get("severity_label", "N/A"),
        diagnosis_summary,
        (diagnosis.get("emergency_recommendations") or ["Contactar servicios de emergencia"])[0] if diagnosis else "Contactar servicios de emergencia",
        f"https://maps.google.com/?q={impact['location']['latitude']},{impact['location']['longitude']}" if impact.get("location") and impact["location"].get("latitude") else "Ubicación no disponible",
    ]
    for contact in unique_contacts:
        try:
            await send_whatsapp_message(contact["phone"], message, template_params=template_values)
            logger.info(f"Alert sent to {contact['name']} ({contact['phone']})")
            alerted_contacts.append({"id": contact.get("id"), "name": contact.get("name"), "phone": contact.get("phone")})
        except Exception as e:
            logger.error(f"Failed to alert {contact['name']}: {e}")
    return alerted_contacts


def verify_webhook_signature(raw_body: bytes, signature: str) -> bool:
    if not settings.WHATSAPP_APP_SECRET or not signature.startswith("sha256="):
        return False
    expected_hash = hmac.new(
        settings.WHATSAPP_APP_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature[7:], expected_hash)
