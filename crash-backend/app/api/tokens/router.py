from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.api.tokens import service as tokens_service
from app.api.plans.service import get_plan

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.get("/company/{company_id}")
async def list_tokens(company_id: str, _=Depends(get_current_superadmin)):
    return await tokens_service.list_company_tokens(company_id)


@router.post("/{company_id}/monitorista")
async def create_monitor_token(company_id: str, body: dict, _=Depends(get_current_superadmin)):
    """Crea un token de monitorista para la empresa (1 activo a la vez)."""
    from app.api.companies.service import get_company
    cycle = body.get("cycle") or "Mensual"
    company = await get_company(company_id)
    if not company:
        raise HTTPException(404, "Empresa no encontrada")
    plan = await get_plan(company.get("plan_id")) if company.get("plan_id") else None
    if not plan:
        db = await get_db()
        plan = await db.plans.find_one({"name": "Basic"})
    tok = await tokens_service.create_monitor_token(company, plan, cycle)
    return {
        "token": tok["token"],
        "role": tok["role"],
        "company_id": company_id,
        "use_count": tok["use_count"],
        "max_uses": tok["max_uses"],
        "cycle": cycle,
    }


@router.post("/regenerate")
async def regenerate(body: dict, _=Depends(get_current_superadmin)):
    company_id = body.get("company_id")
    plan_id = body.get("plan_id")
    cycle = body.get("cycle", "Mensual")
    if not company_id or not plan_id:
        raise HTTPException(400, "company_id y plan_id son requeridos")
    plan = await get_plan(plan_id)
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    return await tokens_service.regenerate_tokens(company_id, plan, cycle)


@router.post("/deactivate")
async def deactivate(body: dict, _=Depends(get_current_superadmin)):
    token = (body.get("token") or "").strip().upper()
    if not token:
        raise HTTPException(400, "token requerido")
    from app.core.database import get_db
    db = await get_db()
    r = await db.site_tokens.update_one(
        {"token": token},
        {"$set": {"active": False, "deactivated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if r.modified_count == 0:
        raise HTTPException(404, "Token no encontrado")
    return {"ok": True}
