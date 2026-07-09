"""Canal unificado de notificaciones salientes (Slack + WhatsApp) por empresa.

La infraestructura de WhatsApp ya existe (whatsapp_client). Aquí añadimos Slack
(vía Incoming Webhooks) y un dispatcher que lee la configuración de webhooks de
cada empresa y envía el mensaje por los canales habilitados.

Formato de configuración de webhooks guardado en el documento de la empresa,
campo `webhooks`:
    {
        "slack_webhook_url": "https://hooks.slack.com/services/...",
        "whatsapp_number": "5215512345678",
        "enabled": true,
        "events": ["impact", "token_low", "subscription_expiring"]
    }
"""
import logging

import httpx

from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger("crash.notifications")

# Eventos que un webhook de empresa puede recibir.
KNOWN_EVENTS = ["impact", "token_low", "subscription_expiring", "report"]


async def send_slack_message(webhook_url: str, text: str, blocks: list | None = None) -> bool:
    """Envía un mensaje a un Incoming Webhook de Slack. No lanza excepciones."""
    if not webhook_url:
        return False
    payload: dict = {"text": text}
    if blocks:
        payload["blocks"] = blocks
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(webhook_url, json=payload)
            if resp.status_code >= 400:
                logger.warning("Slack webhook error %s: %s", resp.status_code, resp.text)
                return False
            return True
    except Exception as e:  # noqa: BLE001
        logger.error("Slack webhook failed: %s", e)
        return False


async def _get_company(company_id: str) -> dict | None:
    from bson import ObjectId

    db = await get_db()
    try:
        doc = await db.companies.find_one({"_id": ObjectId(company_id)})
    except Exception:
        doc = await db.companies.find_one({"id": company_id})
    return doc


async def notify_company(
    company_id: str,
    event: str,
    title: str,
    message: str,
) -> dict:
    """Envía una notificación a los canales configurados de una empresa.

    Devuelve un resumen de qué canales recibieron el mensaje. Nunca lanza.
    """
    result = {"slack": False, "whatsapp": False, "skipped": True}
    if not company_id:
        return result

    company = await _get_company(company_id)
    if not company:
        return result

    cfg = company.get("webhooks") or {}
    if not cfg.get("enabled"):
        return result

    events = cfg.get("events") or KNOWN_EVENTS
    if event not in events:
        return result

    result["skipped"] = False
    full_text = f"*{title}*\n{message}" if title else message

    slack_url = (cfg.get("slack_webhook_url") or "").strip()
    if slack_url:
        result["slack"] = await send_slack_message(slack_url, full_text)

    wa_number = (cfg.get("whatsapp_number") or "").strip()
    if wa_number:
        try:
            from app.infrastructure.whatsapp_client import send_whatsapp_message

            plain = f"C.R.A.S.H. — {title}\n{message}" if title else message
            await send_whatsapp_message(wa_number, plain)
            result["whatsapp"] = True
        except Exception as e:  # noqa: BLE001
            logger.error("WhatsApp company notify failed: %s", e)

    return result


async def notify_support_team(title: str, message: str) -> dict:
    """Notifica al equipo de soporte (superadmin) por los canales globales."""
    result = {"slack": False, "whatsapp": False}
    if settings.SUPPORT_SLACK_WEBHOOK:
        result["slack"] = await send_slack_message(
            settings.SUPPORT_SLACK_WEBHOOK, f"*{title}*\n{message}"
        )
    if settings.SUPPORT_PHONE:
        try:
            from app.infrastructure.whatsapp_client import send_whatsapp_message

            await send_whatsapp_message(settings.SUPPORT_PHONE, f"{title}\n{message}")
            result["whatsapp"] = True
        except Exception as e:  # noqa: BLE001
            logger.error("WhatsApp support notify failed: %s", e)
    return result
