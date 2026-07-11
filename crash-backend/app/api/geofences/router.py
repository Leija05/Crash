from fastapi import APIRouter, Depends, Query

from app.api.geofences.service import (
    create_geofence,
    list_geofences,
    update_geofence,
    delete_geofence,
    get_active_geofences,
    get_geofence_stats,
)
from app.core.security import get_current_superadmin, get_current_rider

router = APIRouter(prefix="/geofences", tags=["geofences"])


@router.get("")
async def geofences_list(_: dict = Depends(get_current_superadmin)):
    return await list_geofences()


@router.post("")
async def geofences_create(data: dict, _: dict = Depends(get_current_superadmin)):
    return await create_geofence(data)


@router.put("/{geofence_id}")
async def geofences_update(geofence_id: str, data: dict, _: dict = Depends(get_current_superadmin)):
    return await update_geofence(geofence_id, data)


@router.delete("/{geofence_id}")
async def geofences_delete(geofence_id: str, _: dict = Depends(get_current_superadmin)):
    return await delete_geofence(geofence_id)


@router.get("/stats")
async def geofences_stats(
    days: int = Query(30, ge=1, le=365),
    _: dict = Depends(get_current_superadmin),
):
    return await get_geofence_stats(days)


@router.get("/active")
async def geofences_active(user: dict = Depends(get_current_rider)):
    """Zonas activas para que la app móvil detecte el modo Precaución localmente."""
    company_id = user.get("company_id")
    return await get_active_geofences(company_id)
