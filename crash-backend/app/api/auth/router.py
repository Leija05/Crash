from fastapi import APIRouter, Depends, Request, Response

from app.api.auth.schemas import LoginInput, MonitorLoginInput, RegisterInput
from app.api.auth.service import (
    login_monitor,
    login_rider,
    refresh_rider_token,
    register_rider,
)
from app.core.security import get_current_monitor_user, get_current_rider

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(body: RegisterInput):
    return await register_rider(body.email, body.password, body.name)


@router.post("/login")
async def login(body: LoginInput):
    return await login_rider(body.email, body.password)


@router.post("/monitor/login")
async def monitor_login(body: MonitorLoginInput):
    return await login_monitor(body.email, body.password)


@router.post("/monitor/logout")
async def monitor_logout(response: Response, _: dict = Depends(get_current_monitor_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
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


@router.post("/refresh")
async def refresh(request: Request):
    body = await request.json()
    return await refresh_rider_token(body.get("refresh_token", ""))
