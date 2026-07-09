import time
from datetime import datetime, timezone

import uuid
from bson import ObjectId
from fastapi import HTTPException
from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)

_login_attempts: dict[str, list[float]] = {}


def _check_bruteforce(identifier: str) -> None:
    now = time.monotonic()
    attempts = _login_attempts.get(identifier, [])
    cutoff = now - settings.LOGIN_LOCKOUT_MINUTES * 60
    attempts = [t for t in attempts if t > cutoff]
    if len(attempts) >= settings.LOGIN_MAX_ATTEMPTS:
        remaining = int(cutoff + settings.LOGIN_LOCKOUT_MINUTES * 60 - now)
        raise HTTPException(
            status_code=429,
            detail=f"Demasiados intentos. Intenta de nuevo en {max(1, remaining // 60)} minuto(s).",
        )
    attempts.append(now)
    _login_attempts[identifier] = attempts


def _reset_bruteforce(identifier: str) -> None:
    _login_attempts.pop(identifier, None)


async def register_rider(email: str, password: str, name: str, company_id: str = "") -> dict:
    db = await get_db()
    email = email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    company_name = ""
    if company_id:
        try:
            company = await db.companies.find_one({"_id": ObjectId(company_id)})
            if company:
                company_name = company.get("name", "")
                await db.companies.update_one(
                    {"_id": ObjectId(company_id)},
                    {"$inc": {"driver_count": 1}},
                )
        except:
            company_id = ""

    user_doc = {
        "email": email,
        "name": name.strip(),
        "password_hash": hash_password(password),
        "role": "user",
        "company_id": company_id,
        "company_name": company_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    await db.user_profiles.insert_one({
        "user_id": user_id,
        "full_name": name.strip(),
        "blood_type": "",
        "allergies": [],
        "medical_conditions": [],
        "disabilities": [],
        "emergency_notes": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.user_settings.insert_one({
        "user_id": user_id,
        "alert_threshold": 5.0,
        "auto_call": True,
        "auto_whatsapp": True,
        "location_tracking_enabled": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "user": {
            "id": user_id, "email": email, "name": name.strip(),
            "role": "user", "created_at": user_doc["created_at"],
        },
    }


async def login_rider(email: str, password: str) -> dict:
    db = await get_db()
    email = email.strip().lower()
    _check_bruteforce(f"rider:{email}")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    _reset_bruteforce(f"rider:{email}")
    user_id = str(user["_id"])
    token_version = user.get("token_version", 1)
    access = create_access_token(user_id, email, user.get("role", "user"), token_version)
    refresh = create_refresh_token(user_id, token_version)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "user": {
            "id": user_id, "email": user["email"], "name": user["name"],
            "role": user["role"], "created_at": user.get("created_at", ""),
        },
    }


async def login_monitor(email: str, password: str) -> dict:
    db = await get_db()
    email = email.lower()
    _check_bruteforce(f"monitor:{email}")
    user = await db.monitor_operators.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    _reset_bruteforce(f"monitor:{email}")

    access = create_access_token(user["id"], user["email"], user["role"])
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "role": user["role"], "access_token": access,
        "company_id": user.get("company_id", ""),
        "company_name": user.get("company_name", ""),
    }


async def verify_site_token(token: str) -> dict:
    from app.api.tokens.service import verify_token
    try:
        tok = await verify_token(token)
    except HTTPException as exc:
        if exc.status_code != 404:
            raise
        # Fall back to SuperAdmin personal token
        db = await get_db()
        user = await db.users.find_one({"site_token": token.upper(), "role": "superadmin"})
        if not user:
            raise HTTPException(404, "Token inválido")
        return {"role": "superadmin", "email": user["email"]}

    return {
        "role": tok["role"],
        "company_id": tok["company_id"],
        "company_name": tok["name"],
        "plan_name": tok.get("plan_name"),
        "max_uses": tok.get("max_uses"),
        "use_count": tok.get("use_count", 0),
        "token_type": tok["role"],
    }

async def register_monitor_with_token(token: str, email: str, password: str, name: str) -> dict:
    from app.api.tokens.service import verify_token, consume_token
    tok = await verify_token(token)
    if tok["role"] != "monitorista":
        raise HTTPException(status_code=400, detail="Este token no corresponde a un monitorista")

    db = await get_db()
    company_id = tok["company_id"]
    company_name = tok["name"]

    email = email.strip().lower()
    existing = await db.monitor_operators.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado como monitorista")

    from app.core.security import hash_password, create_access_token
    import uuid

    now = datetime.now(timezone.utc).isoformat()
    monitor_doc = {
        "id": f"mon-{uuid.uuid4().hex[:10]}",
        "email": email,
        "password_hash": hash_password(password),
        "name": name.strip(),
        "role": "monitor",
        "company_id": company_id,
        "company_name": company_name,
        "created_at": now,
        "updated_at": now,
    }
    await db.monitor_operators.insert_one(monitor_doc)
    try:
        company_query = {"_id": ObjectId(company_id)}
    except Exception:
        company_query = {"id": company_id}
    await db.companies.update_one(
        company_query,
        {"$inc": {"monitor_count": 1}},
    )
    await consume_token(token)

    access = create_access_token(monitor_doc["id"], email, "monitor")
    return {
        "access_token": access,
        "user": {"id": monitor_doc["id"], "email": email, "name": name.strip(), "role": "monitor", "company_id": company_id, "company_name": company_name},
    }


async def link_driver_company(user_id: str, token: str) -> dict:
    from app.api.tokens.service import verify_token, consume_token
    tok = await verify_token(token)
    if tok["role"] != "empresa":
        raise HTTPException(status_code=400, detail="Este token no corresponde a una empresa")

    db = await get_db()
    company_id = tok["company_id"]
    try:
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
    except Exception:
        company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    company_name = company.get("name", "")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"company_id": company_id, "company_name": company_name}},
    )
    await consume_token(token)
    return {"company_id": company_id, "company_name": company_name, "message": f"Vinculado a {company_name}"}

async def assign_driver_company(user_id: str, token: str) -> dict:
    db = await get_db()
    token = token.strip().upper()
    doc = await db.driver_tokens.find_one({"token": token, "active": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Token de conductor inválido o expirado")
    if doc.get("used") and doc.get("used_by") != user_id:
        raise HTTPException(status_code=400, detail="Este token ya fue usado por otro conductor")
    company_id = doc["company_id"]
    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    company_name = company.get("name", "")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"company_id": company_id, "company_name": company_name}}
    )
    await db.driver_tokens.update_one(
        {"token": token},
        {"$set": {"used": True, "used_by": user_id, "used_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"company_id": company_id, "company_name": company_name, "message": f"Vinculado a {company_name}"}


async def remove_driver_company(user_id: str) -> dict:
    db = await get_db()
    rider = await db.users.find_one({"_id": ObjectId(user_id)}, {"company_id": 1})
    if rider and rider.get("company_id"):
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$unset": {"company_id": "", "company_name": ""}}
        )
        return {"message": "Vinculación con empresa eliminada"}
    return {"message": "No había empresa vinculada"}


async def refresh_rider_token(refresh_token: str) -> dict:
    from app.core.security import decode_token
    from bson import ObjectId

    db = await get_db()
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        access = create_access_token(user_id, user["email"])
        return {"access_token": access}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
