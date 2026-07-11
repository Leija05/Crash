import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from bson import ObjectId
from app.core.database import get_db
from app.api.tokens import service as tokens_service


async def _resolve_plan(db, plan_id: str = None) -> dict:
    if plan_id:
        try:
            plan = await db.plans.find_one({"_id": ObjectId(plan_id)})
        except Exception:
            plan = None
        if plan:
            return plan
    return await db.plans.find_one({"name": "Basic"})


async def create_company(name: str, email: str, phone: str = "", plan_id: str = None, cycle: str = "Mensual") -> dict:
    db = await get_db()
    existing = await db.companies.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Ya existe una empresa con ese email")

    plan = await _resolve_plan(db, plan_id)
    max_drivers = plan.get("max_drivers", 3) if plan else 3
    max_monitors = plan.get("max_monitors", 1) if plan else 1

    doc = {
        "name": name, "email": email, "phone": phone,
        "plan_id": str(plan["_id"]) if plan else None,
        "plan_name": plan.get("name", "Basic") if plan else "Basic",
        "max_drivers": max_drivers,
        "max_monitors": max_monitors,
        "has_token": False,
        "status": "active",
        "monitor_count": 0, "driver_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.companies.insert_one(doc)
    company_id = str(result.inserted_id)
    from app.api.admin.service import log_admin_action
    await log_admin_action("create_company", f"Empresa {name} ({plan.get('name','Basic') if plan else 'Basic'})")
    doc["id"] = company_id

    if plan:
        await tokens_service.create_company_token(doc, plan, cycle)
        await tokens_service.create_monitor_token(doc, plan, cycle)
        await db.companies.update_one(
            {"_id": result.inserted_id},
            {"$set": {
                "has_token": True,
                "cycle": cycle,
                "subscription_expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            }},
        )
        doc["has_token"] = True
        doc["cycle"] = cycle
    doc.pop("_id", None)
    return doc


async def list_companies() -> list:
    db = await get_db()
    cursor = db.companies.find({})
    docs = await cursor.to_list(100)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


async def get_company(company_id: str) -> dict:
    db = await get_db()
    try:
        doc = await db.companies.find_one({"_id": ObjectId(company_id)})
    except Exception:
        doc = await db.companies.find_one({"id": company_id})
    if not doc:
        doc = await db.companies.find_one({"site_token": company_id})
    if not doc:
        raise HTTPException(404, "Empresa no encontrada")
    doc["id"] = str(doc.get("_id", ""))
    doc.pop("_id", None)
    return doc


async def update_company(company_id: str, data: dict) -> dict:
    db = await get_db()
    allowed = {"name", "email", "phone", "plan_id", "plan_name", "status", "max_drivers", "max_monitors"}
    update = {k: v for k, v in data.items() if k in allowed}
    if not update:
        raise HTTPException(400, "No fields to update")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.companies.update_one({"_id": ObjectId(company_id)}, {"$set": update})
    if r.modified_count == 0:
        raise HTTPException(404, "Empresa no encontrada")
    return {"ok": True}


async def delete_company(company_id: str) -> dict:
    db = await get_db()
    try:
        company_query = {"_id": ObjectId(company_id)}
        company = await db.companies.find_one(company_query, {"name": 1})
    except Exception:
        company_query = {"id": company_id}
        company = await db.companies.find_one(company_query, {"name": 1})
    if not company:
        raise HTTPException(404, "Empresa no encontrada")

    company_name = company.get("name", company_id)
    # Eliminar tokens asociados (empresa, monitorista y de conductor) para no dejar
    # credenciales colgadas tras borrar la empresa.
    await db.site_tokens.delete_many({"company_id": company_id})
    await db.driver_tokens.delete_many({"company_id": company_id})
    await db.monitor_operators.delete_many({"company_id": company_id})
    await db.users.update_many(
        {"company_id": company_id},
        {"$set": {
            "company_id": None,
            "company_name": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    r = await db.companies.delete_one(company_query)
    from app.api.admin.service import log_admin_action
    await log_admin_action("delete_company", f"Empresa {company_name} ({company_id}) y sus tokens")
    return {"ok": True, "deleted_company": company_name}


async def buy_package(company_id: str, plan_id: str, cycle: str = "Mensual") -> dict:
    db = await get_db()
    company = await get_company(company_id)
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    plan = await db.plans.find_one({"_id": ObjectId(plan_id)})
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    result = await tokens_service.regenerate_tokens(company_id, plan, cycle)
    from app.api.admin.service import log_admin_action
    await log_admin_action("buy_package", f"Empresa {company_id} · plan {plan.get('name', '')}")
    return result


async def get_company_tokens(company_id: str) -> list:
    return await tokens_service.list_company_tokens(company_id)


async def get_company_drivers(company_id: str) -> list:
    db = await get_db()
    try:
        company_query = {"_id": ObjectId(company_id)}
    except Exception:
        company_query = {"id": company_id}
    company = await db.companies.find_one(company_query)
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    cid = str(company.get("_id", ""))
    cursor = db.users.find(
        {"company_id": cid},
        {"password_hash": 0},
    ).sort("created_at", -1)
    docs = await cursor.to_list(200)
    for d in docs:
        # id estable = _id de Mongo (coincide con los conductores en vivo del bridge)
        d["id"] = str(d.pop("_id")) if d.get("_id") is not None else d.get("id")
    return docs


async def create_support_request(
    company_id: str, rtype: str, message: str, requested_by: dict = None
) -> dict:
    db = await get_db()
    try:
        company_query = {"_id": ObjectId(company_id)}
    except Exception:
        company_query = {"id": company_id}
    company = await db.companies.find_one(company_query, {"name": 1})
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    requester = requested_by or {}
    doc = {
        "company_id": str(company.get("_id", "")),
        "company_name": company.get("name", ""),
        "type": rtype or "otro",
        "message": (message or "").strip(),
        "status": "open",
        "forwarded": False,
        "requested_by_id": requester.get("id", ""),
        "requested_by_email": (requester.get("email") or "").strip().lower(),
        "requested_by_name": requester.get("name", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.support_requests.insert_one(doc)
    from app.api.admin.service import log_admin_action
    await log_admin_action("support_request", f"{company.get('name','')}: {rtype}")
    doc["id"] = str(doc.pop("_id", ""))
    return doc


async def list_support_requests() -> list:
    db = await get_db()
    cursor = db.support_requests.find({}).sort("created_at", -1)
    docs = await cursor.to_list(200)
    for d in docs:
        d["id"] = str(d.get("_id", ""))
        d.pop("_id", None)
    return docs


async def forward_support_request(req_id: str) -> dict:
    db = await get_db()
    req = await db.support_requests.find_one({"_id": ObjectId(req_id)})
    if not req:
        raise HTTPException(404, "Solicitud no encontrada")
    await db.support_requests.update_one(
        {"_id": ObjectId(req_id)},
        {"$set": {"forwarded": True, "status": "forwarded",
         "forwarded_at": datetime.now(timezone.utc).isoformat()}},
    )
    # Notificar al equipo de soporte por los canales globales configurados.
    try:
        from app.infrastructure.notifications import notify_support_team
        await notify_support_team(
            "C.R.A.S.H. SOPORTE",
            f"Empresa: {req.get('company_name','')}\nTipo: {req.get('type','')}\n{req.get('message','')}",
        )
    except Exception:
        pass
    return {"ok": True}


async def resolve_support_request(req_id: str, note: str = "") -> dict:
    db = await get_db()
    r = await db.support_requests.update_one(
        {"_id": ObjectId(req_id)},
        {"$set": {
            "status": "resolved",
            "resolution_note": (note or "").strip(),
            "resolved_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Solicitud no encontrada")
    return {"ok": True}


async def get_company_webhooks(company_id: str) -> dict:
    company = await get_company(company_id)
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    cfg = company.get("webhooks") or {}
    return {
        "slack_webhook_url": cfg.get("slack_webhook_url", ""),
        "whatsapp_number": cfg.get("whatsapp_number", ""),
        "enabled": bool(cfg.get("enabled", False)),
        "events": cfg.get("events") or ["impact", "token_low", "subscription_expiring"],
    }


async def set_company_webhooks(company_id: str, data: dict) -> dict:
    from app.infrastructure.notifications import KNOWN_EVENTS
    db = await get_db()
    try:
        company_query = {"_id": ObjectId(company_id)}
    except Exception:
        company_query = {"id": company_id}
    events = data.get("events")
    if not isinstance(events, list) or not events:
        events = ["impact", "token_low", "subscription_expiring"]
    events = [e for e in events if e in KNOWN_EVENTS]
    cfg = {
        "slack_webhook_url": (data.get("slack_webhook_url") or "").strip(),
        "whatsapp_number": (data.get("whatsapp_number") or "").strip(),
        "enabled": bool(data.get("enabled", False)),
        "events": events,
    }
    r = await db.companies.update_one(
        company_query,
        {"$set": {"webhooks": cfg, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Empresa no encontrada")
    return cfg


async def test_company_webhook(company_id: str) -> dict:
    company = await get_company(company_id)
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    cfg = company.get("webhooks") or {}
    if not cfg.get("enabled"):
        raise HTTPException(400, "Los webhooks de esta empresa están deshabilitados")
    from app.infrastructure.notifications import send_slack_message
    result = {"slack": False, "whatsapp": False}
    slack_url = (cfg.get("slack_webhook_url") or "").strip()
    if slack_url:
        result["slack"] = await send_slack_message(
            slack_url,
            f"*C.R.A.S.H. · Prueba de webhook*\nConexión correcta para *{company.get('name','')}*.",
        )
    wa_number = (cfg.get("whatsapp_number") or "").strip()
    if wa_number:
        try:
            from app.infrastructure.whatsapp_client import send_whatsapp_message
            await send_whatsapp_message(
                wa_number,
                f"C.R.A.S.H. · Prueba de webhook\nConexión correcta para {company.get('name','')}.",
            )
            result["whatsapp"] = True
        except Exception:
            pass
    return result


async def set_report_schedule(company_id: str, data: dict) -> dict:
    db = await get_db()
    try:
        company_query = {"_id": ObjectId(company_id)}
    except Exception:
        company_query = {"id": company_id}
    freq = (data.get("frequency") or "off").lower()
    if freq not in ("off", "daily", "weekly"):
        freq = "off"
    channel = (data.get("channel") or "email").lower()
    if channel not in ("email", "whatsapp", "slack"):
        channel = "email"
    cfg = {
        "frequency": freq,
        "channel": channel,
        "recipient": (data.get("recipient") or "").strip(),
        "enabled": freq != "off",
    }
    r = await db.companies.update_one(
        company_query,
        {"$set": {"report_schedule": cfg, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Empresa no encontrada")
    return cfg


async def extend_subscription(company_id: str, days: int = 30) -> dict:
    db = await get_db()
    try:
        company_query = {"_id": ObjectId(company_id)}
    except Exception:
        company_query = {"id": company_id}
    company = await db.companies.find_one(company_query)
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    current = company.get("subscription_expires_at")
    from datetime import timedelta
    base = datetime.now(timezone.utc)
    if current:
        try:
            base = datetime.fromisoformat(current)
            if base.tzinfo is None:
                base = base.replace(tzinfo=timezone.utc)
        except Exception:
            base = datetime.now(timezone.utc)
    new_exp = (base + timedelta(days=days)).isoformat()
    await db.companies.update_one(company_query, {"$set": {"subscription_expires_at": new_exp}})
    return {"subscription_expires_at": new_exp}


# ── Acciones reales del Centro de Ayudas (superadmin) ─────────────
def _generate_temp_password(length: int = 12) -> str:
    """Genera una contraseña temporal robusta (mayús, minús, dígito)."""
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.isupper() for c in pwd)
                and any(c.islower() for c in pwd)
                and any(c.isdigit() for c in pwd)):
            return pwd


async def _get_support_request(db, req_id: str) -> dict:
    req = await db.support_requests.find_one({"_id": ObjectId(req_id)})
    if not req:
        raise HTTPException(404, "Solicitud no encontrada")
    return req


async def reset_support_password(req_id: str, target_email: str = None) -> dict:
    """Reinicia la contraseña de la cuenta asociada a una solicitud de soporte.

    Busca primero en monitor_operators (monitorista) y luego en users (conductor).
    Devuelve una contraseña temporal para entregar al usuario.
    """
    from app.core.security import hash_password
    db = await get_db()
    req = await _get_support_request(db, req_id)
    email = (target_email or req.get("requested_by_email") or "").strip().lower()
    if not email:
        raise HTTPException(400, "No hay una cuenta objetivo. Indica el correo de la cuenta a reiniciar.")

    temp = _generate_temp_password()
    ph = hash_password(temp)
    now = datetime.now(timezone.utc).isoformat()

    acct = await db.monitor_operators.find_one({"email": email})
    if acct:
        await db.monitor_operators.update_one(
            {"_id": acct["_id"]},
            {"$set": {"password_hash": ph, "updated_at": now, "must_change_password": True}},
        )
        target_type = "monitorista"
        target_name = acct.get("name", "")
    else:
        u = await db.users.find_one({"email": email})
        if not u:
            raise HTTPException(404, f"No se encontró ninguna cuenta con el correo {email}")
        await db.users.update_one(
            {"_id": u["_id"]},
            {"$set": {"password_hash": ph, "updated_at": now, "must_change_password": True}},
        )
        target_type = "conductor"
        target_name = u.get("name", "")

    await db.support_requests.update_one(
        {"_id": ObjectId(req_id)},
        {"$set": {
            "status": "resolved",
            "resolution_note": f"Contraseña reiniciada para {email} ({target_type})",
            "resolved_at": now,
            "action_taken": "password_reset",
        }},
    )
    try:
        from app.api.admin.service import log_admin_action
        await log_admin_action("support_password_reset", f"{email} ({target_type})")
    except Exception:
        pass
    return {
        "ok": True,
        "email": email,
        "target_type": target_type,
        "target_name": target_name,
        "temp_password": temp,
    }


async def revoke_support_token(req_id: str, token: str = None) -> dict:
    """Desactiva el/los token(s) de la empresa asociada a la solicitud.

    Por defecto desactiva el token de monitorista activo de la empresa;
    si se indica un token específico, desactiva ese.
    """
    db = await get_db()
    req = await _get_support_request(db, req_id)
    company_id = req.get("company_id")
    now = datetime.now(timezone.utc).isoformat()

    if token:
        query = {"token": token.strip().upper(), "active": True}
    else:
        query = {"company_id": company_id, "role": "monitorista", "active": True}

    result = await db.site_tokens.update_many(
        query,
        {"$set": {"active": False, "deactivated_at": now}},
    )
    if result.modified_count == 0:
        raise HTTPException(404, "No se encontró ningún token activo para desactivar")

    await db.support_requests.update_one(
        {"_id": ObjectId(req_id)},
        {"$set": {
            "status": "resolved",
            "resolution_note": f"{result.modified_count} token(s) desactivado(s)",
            "resolved_at": now,
            "action_taken": "revoke_token",
        }},
    )
    try:
        from app.api.admin.service import log_admin_action
        await log_admin_action("support_revoke_token", f"company={company_id} · {result.modified_count} token(s)")
    except Exception:
        pass
    return {"ok": True, "deactivated": result.modified_count}
