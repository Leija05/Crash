from fastapi import APIRouter, Depends, Request

from app.api.auth.schemas import LoginInput, MonitorLoginInput, RegisterInput
from app.api.auth.service import (
    login_monitor,
    login_rider,
    refresh_rider_token,
    register_rider,
    verify_site_token,
    register_monitor_with_token,
)
from app.core.security import get_current_monitor_user, get_current_rider, get_current_superadmin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(body: RegisterInput):
    return await register_rider(body.email, body.password, body.name, body.company_id or "")


@router.post("/login")
async def login(body: LoginInput):
    return await login_rider(body.email, body.password)


@router.post("/monitor/login")
async def monitor_login(body: MonitorLoginInput):
    return await login_monitor(body.email, body.password)


@router.post("/monitor/logout")
async def monitor_logout(_: dict = Depends(get_current_monitor_user)):
    return {"ok": True}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_rider)):
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "role": user["role"], "created_at": user.get("created_at", ""),
    }


@router.get("/monitor/me")
async def get_monitor_me(user: dict = Depends(get_current_monitor_user)):
    return user


@router.post("/verify-site-token")
async def verify_token(body: dict):
    return await verify_site_token(body.get("token", ""))

@router.post("/register-monitor")
async def register_monitor(body: dict):
    return await register_monitor_with_token(
        body.get("token", ""), body.get("email", ""),
        body.get("password", ""), body.get("name", ""),
    )

@router.get("/monitors")
async def list_monitors(user: dict = Depends(get_current_monitor_user)):
    from app.core.database import get_db
    db = await get_db()
    company_id = user.get("company_id")
    query = {"company_id": company_id} if company_id else {}
    cursor = db.monitor_operators.find(query, {"_id": 0, "password_hash": 0})
    return await cursor.to_list(100)

@router.get("/superadmin/check")
async def superadmin_check(_=Depends(get_current_superadmin)):
    return {"superadmin": True}

@router.post("/refresh")
async def refresh(request: Request):
    body = await request.json()
    return await refresh_rider_token(body.get("refresh_token", ""))
