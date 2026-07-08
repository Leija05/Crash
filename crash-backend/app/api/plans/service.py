from datetime import datetime, timezone
from fastapi import HTTPException
from bson import ObjectId
from app.core.database import get_db

PLANS_SEED = [
    {"name": "Basic", "price": 5, "max_drivers": 3, "features": ["Monitoreo en vivo", "Alertas de impacto", "Historial básico (7 días)", "Soporte por correo"], "popular": False, "created_at": datetime.now(timezone.utc).isoformat()},
    {"name": "Advanced", "price": 15, "max_drivers": 10, "features": ["Todo lo de Basic", "Historial completo (30 días)", "Diagnóstico con IA", "Reportes exportables", "Soporte prioritario"], "popular": True, "created_at": datetime.now(timezone.utc).isoformat()},
    {"name": "Enterprise", "price": 25, "max_drivers": 30, "features": ["Todo lo de Advanced", "Historial ilimitado", "Webhook personalizado", "API de integración", "Soporte 24/7 dedicado", "Onboarding asistido"], "popular": False, "created_at": datetime.now(timezone.utc).isoformat()},
]

async def seed_plans():
    db = await get_db()
    existing = await db.plans.count_documents({})
    if existing == 0:
        await db.plans.insert_many(PLANS_SEED)

async def list_plans():
    db = await get_db()
    cursor = db.plans.find({}, {"_id": 0})
    return await cursor.to_list(100)

async def create_plan(name: str, price: float, max_drivers: int, features: list):
    db = await get_db()
    doc = {
        "name": name, "price": price, "max_drivers": max_drivers,
        "features": features, "popular": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.plans.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return doc

async def update_plan(plan_id: str, data: dict):
    db = await get_db()
    allowed = {"name", "price", "max_drivers", "features", "popular"}
    update = {k: v for k, v in data.items() if k in allowed}
    if not update:
        raise HTTPException(400, "No fields to update")
    r = await db.plans.update_one({"_id": ObjectId(plan_id)}, {"$set": update})
    if r.modified_count == 0:
        raise HTTPException(404, "Plan not found")
    return {"ok": True}

async def delete_plan(plan_id: str):
    db = await get_db()
    r = await db.plans.delete_one({"_id": ObjectId(plan_id)})
    if r.deleted_count == 0:
        raise HTTPException(404, "Plan not found")
    return {"ok": True}
