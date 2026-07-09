import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.api.companies.service import (
    create_company, list_companies, get_company, update_company, delete_company,
    buy_package, get_company_tokens, get_company_drivers,
    create_support_request, extend_subscription,
    get_company_webhooks, set_company_webhooks, test_company_webhook,
    set_report_schedule,
)
from app.core.security import get_current_superadmin, get_current_monitor_user, get_current_admin

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("")
async def get_companies(_=Depends(get_current_superadmin)):
    return await list_companies()

@router.get("/public")
async def list_public_companies():
    from app.core.database import get_db
    db = await get_db()
    cursor = db.companies.find({"status": "active"}, {"_id": 1, "name": 1, "plan_name": 1})
    docs = []
    async for d in cursor:
        docs.append({"id": str(d["_id"]), "name": d["name"], "plan_name": d.get("plan_name", "Basic")})
    return docs

@router.get("/{company_id}")
async def get_company_detail(company_id: str, _=Depends(get_current_admin)):
    return await get_company(company_id)

@router.post("")
async def create(data: dict, _=Depends(get_current_superadmin)):
    return await create_company(
        name=data.get("name"), email=data.get("email"),
        phone=data.get("phone", ""), plan_id=data.get("plan_id"), cycle=data.get("cycle", "Mensual"),
    )

@router.post("/public/register")
async def public_register(data: dict):
    return await create_company(
        name=data.get("name"), email=data.get("email"),
        phone=data.get("phone", ""), plan_id=data.get("plan_id"), cycle=data.get("cycle", "Mensual"),
    )

@router.put("/{company_id}")
async def update(company_id: str, data: dict, _=Depends(get_current_superadmin)):
    return await update_company(company_id, data)

@router.delete("/{company_id}")
async def delete(company_id: str, _=Depends(get_current_superadmin)):
    return await delete_company(company_id)

@router.post("/{company_id}/buy-package")
async def buy(company_id: str, data: dict, _=Depends(get_current_superadmin)):
    return await buy_package(company_id, data.get("plan_id"), data.get("cycle", "Mensual"))

@router.get("/{company_id}/tokens")
async def tokens(company_id: str, _=Depends(get_current_superadmin)):
    return await get_company_tokens(company_id)

@router.get("/{company_id}/monitors")
async def company_monitors(company_id: str, _=Depends(get_current_admin)):
    from app.core.database import get_db
    db = await get_db()
    cursor = db.monitor_operators.find({"company_id": company_id}, {"_id": 0, "password_hash": 0})
    return await cursor.to_list(100)


@router.get("/{company_id}/drivers")
async def company_drivers(company_id: str, _=Depends(get_current_admin)):
    return await get_company_drivers(company_id)


@router.post("/support")
async def create_support(data: dict, user: dict = Depends(get_current_monitor_user)):
    """Un monitorista/empresa envía un reporte al Centro de Ayudas (superadmin)."""
    company_id = user.get("company_id")
    if not company_id:
        from fastapi import HTTPException
        raise HTTPException(400, "Tu cuenta no está asociada a una empresa")
    return await create_support_request(
        company_id, data.get("type", "otro"), data.get("message", ""),
        requested_by={
            "id": user.get("id", ""),
            "email": user.get("email", ""),
            "name": user.get("name", ""),
        },
    )


@router.post("/{company_id}/extend-subscription")
async def extend_sub(company_id: str, data: dict = None, _=Depends(get_current_superadmin)):
    days = int((data or {}).get("days", 30))
    return await extend_subscription(company_id, days)


@router.get("/{company_id}/webhooks")
async def company_webhooks_get(company_id: str, _=Depends(get_current_admin)):
    return await get_company_webhooks(company_id)


@router.put("/{company_id}/webhooks")
async def company_webhooks_set(company_id: str, data: dict, _=Depends(get_current_superadmin)):
    return await set_company_webhooks(company_id, data)


@router.post("/{company_id}/webhooks/test")
async def company_webhooks_test(company_id: str, _=Depends(get_current_superadmin)):
    return await test_company_webhook(company_id)


@router.put("/{company_id}/report-schedule")
async def company_report_schedule(company_id: str, data: dict, _=Depends(get_current_superadmin)):
    return await set_report_schedule(company_id, data)
