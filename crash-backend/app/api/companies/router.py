import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.api.companies.service import create_company, list_companies, get_company, update_company, delete_company, generate_company_token, regenerate_company_token
from app.core.security import get_current_superadmin, get_current_monitor_user

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
async def get_company_detail(company_id: str, _=Depends(get_current_monitor_user)):
    return await get_company(company_id)

@router.post("")
async def create(data: dict, _=Depends(get_current_superadmin)):
    return await create_company(
        name=data.get("name"), email=data.get("email"),
        phone=data.get("phone", ""), plan_id=data.get("plan_id"),
    )

@router.post("/public/register")
async def public_register(data: dict):
    return await create_company(
        name=data.get("name"), email=data.get("email"),
        phone=data.get("phone", ""), plan_id=data.get("plan_id"),
    )

@router.put("/{company_id}")
async def update(company_id: str, data: dict, _=Depends(get_current_superadmin)):
    return await update_company(company_id, data)

@router.delete("/{company_id}")
async def delete(company_id: str, _=Depends(get_current_superadmin)):
    return await delete_company(company_id)

@router.post("/{company_id}/token/generate")
async def gen_token(company_id: str, _=Depends(get_current_superadmin)):
    return await generate_company_token(company_id)

@router.post("/{company_id}/token/regenerate")
async def regen_token(company_id: str, _=Depends(get_current_superadmin)):
    return await regenerate_company_token(company_id)

@router.get("/{company_id}/monitors")
async def company_monitors(company_id: str, _=Depends(get_current_monitor_user)):
    from app.core.database import get_db
    db = await get_db()
    cursor = db.monitor_operators.find({"company_id": company_id}, {"_id": 0, "password_hash": 0})
    return await cursor.to_list(100)
