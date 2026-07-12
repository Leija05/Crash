import asyncio
import re
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import HTTPException, Request, Depends, status
from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def validate_password_strength(password: str) -> Optional[str]:
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return f"La contrase\u00f1a debe tener al menos {settings.PASSWORD_MIN_LENGTH} caracteres"
    if not re.search(r"[A-Z]", password):
        return "La contrase\u00f1a debe contener al menos una may\u00fascula"
    if not re.search(r"[a-z]", password):
        return "La contrase\u00f1a debe contener al menos una min\u00fascula"
    if not re.search(r"\d", password):
        return "La contrase\u00f1a debe contener al menos un n\u00famero"
    return None


def create_access_token(
    sub: str, email: str, role: str = "user",
    token_version: int = 1,
) -> str:
    payload = {
        "sub": sub,
        "email": email,
        "role": role,
        "type": "access",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "ver": token_version,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(sub: str, token_version: int = 1) -> str:
    payload = {
        "sub": sub,
        "type": "refresh",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "ver": token_version,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
        options={"verify_aud": False, "verify_iss": False},
    )
    if "iss" in payload and payload["iss"] != settings.JWT_ISSUER:
        raise jwt.InvalidTokenError("Invalid issuer")
    if "aud" in payload and payload["aud"] != settings.JWT_AUDIENCE:
        raise jwt.InvalidTokenError("Invalid audience")
    return payload


def _extract_token(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


async def get_current_monitor_user(request: Request) -> dict:
    from app.core.database import get_db

    db = await get_db()
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user = await db.monitor_operators.find_one(
        {"id": payload["sub"]}, {"_id": 0, "password_hash": 0}
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user["token_version"] = payload.get("ver", 1)
    return user


async def get_current_rider(request: Request) -> dict:
    from app.core.database import get_db

    db = await get_db()
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    user["id"] = str(user["_id"])
    user.pop("_id", None)
    user.pop("password_hash", None)
    user["token_version"] = payload.get("ver", 1)
    return user


def require_role(*roles):
    async def checker(user: dict = Depends(get_current_monitor_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return checker


async def get_current_admin(request: Request) -> dict:
    """Allows SuperAdmin users or monitor operators with admin role to access admin endpoints."""
    from app.core.database import get_db

    db = await get_db()
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    # SuperAdmin (lives in the users collection)
    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        user = None
    if user and user.get("role") == "superadmin":
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        user["token_version"] = payload.get("ver", 1)
        return user

    # Monitor operators (only those with admin role may access admin endpoints)
    monitor = await db.monitor_operators.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if monitor:
        if monitor.get("role") not in ("admin", "superadmin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        monitor["token_version"] = payload.get("ver", 1)
        return monitor

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


async def get_current_company_admin(
    company_id: str,
    user: dict = Depends(get_current_admin),
) -> dict:
    """Admin access scoped to a single company (prevents cross-company IDOR).

    SuperAdmins may access any company; company admins are restricted to their own.
    """
    if user.get("role") == "superadmin":
        return user
    if user.get("company_id") != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado para esta empresa",
        )
    return user


async def get_current_superadmin(request: Request) -> dict:
    from app.core.database import get_db

    db = await get_db()
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    [user, company] = await asyncio.gather(
        db.users.find_one({"_id": ObjectId(payload["sub"])}),
        db.companies.find_one({"superadmin_id": payload["sub"]}),
    )
    if not user or user.get("role") not in ("superadmin",):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="SuperAdmin access required")
    user["id"] = str(user["_id"])
    user.pop("_id", None)
    user.pop("password_hash", None)
    user["is_root"] = user.get("email", "").lower() == settings.SUPERADMIN_EMAIL.lower()
    return user


async def get_current_root_superadmin(request: Request) -> dict:
    """Solo la cuenta principal (la del .env) puede gestionar superadmins."""
    user = await get_current_superadmin(request)
    if not user.get("is_root"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el SuperAdmin principal puede gestionar otras cuentas de SuperAdmin",
        )
    return user