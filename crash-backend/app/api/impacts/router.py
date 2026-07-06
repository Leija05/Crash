from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.impacts.schemas import ImpactInput
from app.api.impacts.service import (
    create_impact,
    false_alarm_from_mobile,
    get_user_impact,
    get_user_impacts,
)
from app.core.security import get_current_rider

router = APIRouter(prefix="/impacts", tags=["impacts"])


@router.get("")
async def list_impacts(user: dict = Depends(get_current_rider)):
    return await get_user_impacts(user["id"])


@router.get("/{impact_id}")
async def get_impact(impact_id: str, user: dict = Depends(get_current_rider)):
    impact = await get_user_impact(user["id"], impact_id)
    if not impact:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return impact


@router.post("")
async def create_impact_endpoint(body: ImpactInput, user: dict = Depends(get_current_rider)):
    return await create_impact(user, body)


@router.post("/false-alarm")
async def false_alarm_endpoint(request: Request, user: dict = Depends(get_current_rider)):
    body = await request.json()
    return await false_alarm_from_mobile(user["id"], body)
