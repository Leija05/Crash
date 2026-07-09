import secrets
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from bson import ObjectId
from app.core.database import get_db

CYCLE_OPTIONS = ["Semanal", "Mensual", "Bimestral", "Trimestral", "Anual"]
CYCLE_DAYS = {"Semanal": 7, "Mensual": 30, "Bimestral": 60, "Trimestral": 90, "Anual": 365}


def _expires_in(cycle: str) -> str:
    days = CYCLE_DAYS.get(cycle, 30)
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def _is_expired(tok: dict) -> bool:
    exp = tok.get("expires_at")
    if not exp:
        return False
    try:
        return datetime.fromisoformat(exp) < datetime.now(timezone.utc)
    except (ValueError, TypeError):
        return False


def _gen_token() -> str:
    return secrets.token_hex(16).upper()


def _plan_limits(plan: dict) -> dict:
    return {
        "plan_id": str(plan.get("_id")) if plan and plan.get("_id") else (plan.get("id") if plan else None),
        "plan_name": plan.get("name", "Sin plan") if plan else "Sin plan",
        "max_drivers": plan.get("max_drivers", 3) if plan else 3,
        "max_monitors": plan.get("max_monitors", 1) if plan else 1,
    }


async def create_company_token(company: dict, plan: dict, cycle: str = "Mensual") -> dict:
    db = await get_db()
    limits = _plan_limits(plan)
    raw = _gen_token()
    doc = {
        "token": raw,
        "name": company.get("name"),
        "role": "empresa",
        "company_id": company.get("id") or (str(company.get("_id")) if company.get("_id") else None),
        "active": True,
        "use_count": 0,
        "max_uses": limits["max_drivers"],
        "plan_id": limits["plan_id"],
        "plan_name": limits["plan_name"],
        "max_drivers": limits["max_drivers"],
        "max_monitors": limits["max_monitors"],
        "cycle": cycle,
        "expires_at": _expires_in(cycle),
        "created_by": "system",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_used_at": None,
    }
    await db.site_tokens.insert_one(doc)
    return doc


async def create_monitor_token(company: dict, plan: dict, cycle: str = "Mensual") -> dict:
    db = await get_db()
    limits = _plan_limits(plan)
    company_id = company.get("id") or (str(company.get("_id")) if company.get("_id") else None)
    # Only one active monitorista token per company
    await db.site_tokens.update_many(
        {"company_id": company_id, "role": "monitorista"},
        {"$set": {"active": False, "deactivated_at": datetime.now(timezone.utc).isoformat()}},
    )
    raw = _gen_token()
    doc = {
        "token": raw,
        "name": company.get("name"),
        "role": "monitorista",
        "company_id": company_id,
        "active": True,
        "use_count": 0,
        "max_uses": limits["max_monitors"],
        "plan_id": limits["plan_id"],
        "plan_name": limits["plan_name"],
        "max_drivers": limits["max_drivers"],
        "max_monitors": limits["max_monitors"],
        "cycle": cycle,
        "expires_at": _expires_in(cycle),
        "created_by": "system",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_used_at": None,
    }
    await db.site_tokens.insert_one(doc)
    return doc


async def verify_token(token: str) -> dict:
    db = await get_db()
    tok = await db.site_tokens.find_one({"token": token.upper()})
    if not tok:
        raise HTTPException(404, "Token de acceso inválido")
    if not tok.get("active", True):
        raise HTTPException(403, "Este token ha sido desactivado")
    if _is_expired(tok):
        raise HTTPException(403, "La suscripción asociada a este token ha expirado")
    if (tok.get("use_count", 0) or 0) >= (tok.get("max_uses", 0) or 0):
        raise HTTPException(403, "Este token ya alcanzó su límite de usos")
    return tok


async def consume_token(token: str, amount: int = 1) -> None:
    db = await get_db()
    await db.site_tokens.update_one(
        {"token": token.upper()},
        {"$inc": {"use_count": amount}, "$set": {"last_used_at": datetime.now(timezone.utc).isoformat()}},
    )


async def list_company_tokens(company_id: str) -> list:
    db = await get_db()
    cursor = db.site_tokens.find({"company_id": company_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)


async def get_company(company_id: str) -> dict:
    db = await get_db()
    try:
        doc = await db.companies.find_one({"_id": ObjectId(company_id)})
    except Exception:
        doc = await db.companies.find_one({"id": company_id})
    if not doc:
        doc = await db.companies.find_one({"site_token": company_id})
    if not doc:
        return None
    doc["id"] = str(doc.get("_id", ""))
    doc.pop("_id", None)
    return doc


async def regenerate_tokens(company_id: str, plan: dict, cycle: str = "Mensual") -> dict:
    company = await get_company(company_id)
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    company_token = await create_company_token(company, plan, cycle)
    monitor_token = await create_monitor_token(company, plan, cycle)
    db = await get_db()
    limits = _plan_limits(plan)
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {
            "has_token": True,
            "plan_id": limits["plan_id"],
            "plan_name": limits["plan_name"],
            "max_drivers": limits["max_drivers"],
            "max_monitors": limits["max_monitors"],
            "cycle": cycle,
            "subscription_expires_at": monitor_token["expires_at"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"company_token": company_token["token"], "monitor_token": monitor_token["token"]}
