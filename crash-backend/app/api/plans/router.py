from fastapi import APIRouter, Depends
from app.api.plans.service import create_plan, list_plans, update_plan, delete_plan
from app.core.security import get_current_superadmin, get_current_monitor_user

router = APIRouter(prefix="/plans", tags=["plans"])

@router.get("")
async def get_plans():
    return await list_plans()

@router.post("")
async def create(plan: dict, _=Depends(get_current_superadmin)):
    return await create_plan(plan.get("name"), plan.get("price"), plan.get("max_drivers"), plan.get("features", []), plan.get("max_monitors", 1))

@router.put("/{plan_id}")
async def update(plan_id: str, plan: dict, _=Depends(get_current_superadmin)):
    return await update_plan(plan_id, plan)

@router.delete("/{plan_id}")
async def delete(plan_id: str, _=Depends(get_current_superadmin)):
    return await delete_plan(plan_id)
