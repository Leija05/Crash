import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from bson import ObjectId
from app.core.database import get_db

async def create_company(name: str, email: str, phone: str = "", plan_id: str = None) -> dict:
    db = await get_db()
    existing = await db.companies.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Ya existe una empresa con ese email")

    plan = None
    max_drivers = 3
    if plan_id:
        try:
            plan = await db.plans.find_one({"_id": ObjectId(plan_id)})
        except:
            pass
    if not plan:
        plan = await db.plans.find_one({"name": "Basic"})
    if plan:
        max_drivers = plan.get("max_drivers", 3)

    site_token = uuid.uuid4().hex[:12].upper()
    doc = {
        "name": name, "email": email, "phone": phone,
        "plan_id": str(plan["_id"]) if plan else None,
        "plan_name": plan["name"] if plan else "Basic",
        "max_drivers": max_drivers,
        "site_token": site_token,
        "status": "active",
        "monitor_count": 0, "driver_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.companies.insert_one(doc)
    doc["id"] = str(result.inserted_id)
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
    except:
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
    allowed = {"name", "email", "phone", "plan_id", "plan_name", "status", "max_drivers"}
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

async def generate_company_token(company_id: str) -> dict:
    db = await get_db()
    token = uuid.uuid4().hex[:12].upper()
    r = await db.companies.update_one(
        {"_id": ObjectId(company_id)},
        {"$set": {"site_token": token, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if r.modified_count == 0:
        raise HTTPException(404, "Empresa no encontrada")
    return {"site_token": token}

async def regenerate_company_token(company_id: str) -> dict:
    return await generate_company_token(company_id)

async def verify_site_token(token: str) -> dict:
    db = await get_db()
    company = await db.companies.find_one({"site_token": token.upper()})
    if not company:
        raise HTTPException(404, "Token de acceso inválido")
    if company.get("status") != "active":
        raise HTTPException(403, "La empresa está suspendida")
    monitor_count = await db.monitor_operators.count_documents({"company_id": str(company["_id"])})
    if monitor_count >= company.get("max_drivers", 3):
        raise HTTPException(403, "La empresa ha alcanzado el límite de monitoristas")
    return {"valid": True, "company_id": str(company["_id"]), "company_name": company["name"], "plan_name": company.get("plan_name", "Basic")}
