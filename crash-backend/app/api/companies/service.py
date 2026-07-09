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
    await db.monitor_operators.delete_many({"company_id": company_id})
    r = await db.companies.delete_one({"_id": ObjectId(company_id)})
    if r.deleted_count == 0:
        raise HTTPException(404, "Empresa no encontrada")
    return {"ok": True}


async def buy_package(company_id: str, plan_id: str, cycle: str = "Mensual") -> dict:
    db = await get_db()
    company = await get_company(company_id)
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    plan = await db.plans.find_one({"_id": ObjectId(plan_id)})
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    result = await tokens_service.regenerate_tokens(company_id, plan, cycle)
    return result


async def get_company_tokens(company_id: str) -> list:
    return await tokens_service.list_company_tokens(company_id)
