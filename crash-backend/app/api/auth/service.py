from datetime import datetime, timezone

import uuid
from fastapi import HTTPException
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)


async def register_rider(email: str, password: str, name: str) -> dict:
    db = await get_db()
    email = email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user_doc = {
        "email": email,
        "name": name.strip(),
        "password_hash": hash_password(password),
        "role": "user",
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
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
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
    user = await db.monitor_operators.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    access = create_access_token(user["id"], user["email"], user["role"])
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "role": user["role"], "access_token": access,
    }


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
