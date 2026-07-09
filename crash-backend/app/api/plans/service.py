from datetime import datetime, timezone
from fastapi import HTTPException
from bson import ObjectId
from app.core.database import get_db

PLANS_SEED = [
    {"name": "Basic", "price": 5, "max_drivers": 3, "max_monitors": 1, "features": ["Monitoreo en vivo", "Alertas de impacto", "Historial básico (7 días)", "Soporte por correo"], "popular": False, "created_at": datetime.now(timezone.utc).isoformat()},
    {"name": "Advanced", "price": 15, "max_drivers": 10, "max_monitors": 5, "features": ["Todo lo de Basic", "Historial completo (30 días)", "Diagnóstico con IA", "Reportes exportables", "Soporte prioritario"], "popular": True, "created_at": datetime.now(timezone.utc).isoformat()},
    {"name": "Enterprise", "price": 25, "max_drivers": 30, "max_monitors": 15, "features": ["Todo lo de Advanced", "Historial ilimitado", "Webhook personalizado", "API de integración", "Soporte 24/7 dedicado", "Onboarding asistido"], "popular": False, "created_at": datetime.now(timezone.utc).isoformat()},
]

async def seed_plans():
    db = await get_db()
    existing = await db.plans.count_documents({})
    if existing == 0:
        await db.plans.insert_many(PLANS_SEED)

async def list_plans():
    db = await get_db()
    cursor = db.plans.find({})
    docs = await cursor.to_list(100)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs

async def get_plan(plan_id: str) -> dict:
    db = await get_db()
    try:
        doc = await db.plans.find_one({"_id": ObjectId(plan_id)})
    except Exception:
        doc = None
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

async def create_plan(name: str, price: float, max_drivers: int, features: list, max_monitors: int = 1):
    db = await get_db()
    doc = {
        "name": name, "price": price, "max_drivers": max_drivers, "max_monitors": max_monitors,
        "features": features, "popular": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.plans.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return doc

async def update_plan(plan_id: str, data: dict):
    db = await get_db()
    allowed = {"name", "price", "max_drivers", "max_monitors", "features", "popular"}
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
