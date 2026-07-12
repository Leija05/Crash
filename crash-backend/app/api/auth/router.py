from bson import ObjectId
from fastapi import APIRouter, Depends, Request

from app.api.auth.schemas import LoginInput, MonitorLoginInput, RegisterInput
from app.api.auth.service import (
    login_monitor,
    login_rider,
    refresh_rider_token,
    register_rider,
    verify_site_token,
    register_monitor_with_token,
    link_driver_company,
    assign_driver_company,
    associate_monitor_company,
    create_superadmin,
    list_superadmins,
    delete_superadmin,
)
from app.core.security import (
    get_current_monitor_user,
    get_current_rider,
    get_current_superadmin,
    get_current_root_superadmin,
)

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
    from app.core.config import settings as _settings
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "role": user["role"], "created_at": user.get("created_at", ""),
        "is_root": user.get("email", "").lower() == _settings.SUPERADMIN_EMAIL.lower(),
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
    if not company_id:
        # Sin empresa asociada: solo se muestra el propio operador.
        query = {"id": user.get("id")}
    else:
        query = {"company_id": company_id}
    cursor = db.monitor_operators.find(query, {"_id": 0, "password_hash": 0})
    return await cursor.to_list(100)

@router.get("/superadmin/check")
async def superadmin_check(_=Depends(get_current_superadmin)):
    return {"superadmin": True}

@router.post("/assign-driver-token")
async def assign_driver_token(body: dict, user: dict = Depends(get_current_rider)):
    return await assign_driver_company(user["id"], body.get("token", ""))


@router.post("/link-company")
async def link_company(body: dict, user: dict = Depends(get_current_rider)):
    return await link_driver_company(user["id"], body.get("token", ""))


@router.post("/monitor/associate")
async def monitor_associate(body: dict, user: dict = Depends(get_current_monitor_user)):
    return await associate_monitor_company(body.get("token", ""), user)


@router.post("/superadmin")
async def create_sa(body: dict, _=Depends(get_current_root_superadmin)):
    return await create_superadmin(body.get("email", ""), body.get("password", ""), body.get("name", "SuperAdmin"))


@router.get("/superadmins")
async def list_sa(_=Depends(get_current_superadmin)):
    return await list_superadmins()


@router.delete("/superadmin/{user_id}")
async def delete_sa(user_id: str, _=Depends(get_current_root_superadmin)):
    return await delete_superadmin(user_id)

@router.post("/remove-driver-token")
async def remove_driver_token(user: dict = Depends(get_current_rider)):
    from app.api.auth.service import remove_driver_company
    return await remove_driver_company(user["id"])

@router.get("/driver-company")
async def get_driver_company(user: dict = Depends(get_current_rider)):
    from app.core.database import get_db
    db = await get_db()
    rider = await db.users.find_one({"_id": ObjectId(user["id"])}, {"company_id": 1, "company_name": 1})
    if rider and rider.get("company_id"):
        return {"company_id": rider["company_id"], "company_name": rider["company_name"]}
    return {"company_id": None, "company_name": None}

@router.post("/refresh")
async def refresh(request: Request):
    body = await request.json()
    return await refresh_rider_token(body.get("refresh_token", ""))
