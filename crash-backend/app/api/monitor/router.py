from fastapi import APIRouter, Depends
from typing import Optional

from app.api.monitor.schemas import IncidentLogPayload
from app.api.monitor.service import (
    acknowledge_alert,
    add_incident_log,
    driver_events,
    driver_history,
    false_alarm,
    get_driver,
    get_system_mode,
    incident_log,
    list_alerts,
    list_drivers,
    list_users,
    query_impacts,
)
from app.api.admin.service import get_impact_heatmap
from app.core.security import get_current_monitor_user, require_role

router = APIRouter(prefix="/monitor", tags=["monitor"])


@router.get("/drivers")
async def get_drivers(user: dict = Depends(get_current_monitor_user)):
    return await list_drivers(user.get("company_id"))


@router.get("/drivers/{driver_id}")
async def get_driver_detail(driver_id: str, _: dict = Depends(get_current_monitor_user)):
    return await get_driver(driver_id)


@router.get("/drivers/{driver_id}/history")
async def get_driver_history(
    driver_id: str, limit: int = 200, _: dict = Depends(get_current_monitor_user),
):
    return await driver_history(driver_id, limit)


@router.get("/drivers/{driver_id}/events")
async def get_driver_events(
    driver_id: str, limit: int = 100, _: dict = Depends(get_current_monitor_user),
):
    return await driver_events(driver_id, limit)


@router.get("/impacts")
async def list_all_impacts(
    q: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    days: Optional[int] = None,
    limit: int = 500,
    user: dict = Depends(get_current_monitor_user),
):
    return await query_impacts(q, severity, status, date_from, date_to, days, limit, user.get("company_id"))


@router.get("/alerts")
async def get_alerts(user: dict = Depends(get_current_monitor_user)):
    return await list_alerts(user.get("company_id"))


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge(alert_id: str, user: dict = Depends(get_current_monitor_user)):
    return await acknowledge_alert(alert_id, user)


@router.post("/alerts/{alert_id}/false-alarm")
async def false_alarm_endpoint(alert_id: str, user: dict = Depends(get_current_monitor_user)):
    return await false_alarm(alert_id, user)


@router.get("/incidents/{incident_id}/log")
async def get_incident_log(incident_id: str, _: dict = Depends(get_current_monitor_user)):
    return await incident_log(incident_id)


@router.post("/incidents/{incident_id}/log")
async def post_incident_log(
    incident_id: str, payload: IncidentLogPayload, user: dict = Depends(get_current_monitor_user),
):
    return await add_incident_log(incident_id, payload.note, user)


@router.get("/heatmap")
async def monitor_heatmap(
    days: int = 30,
    user: dict = Depends(get_current_monitor_user),
):
    """Mapa de calor de impactos de la empresa del monitorista."""
    return await get_impact_heatmap(user.get("company_id"), days)


@router.get("/admin/users")
async def get_admin_users(_: dict = Depends(require_role("admin"))):
    return await list_users()


@router.get("/system/mode")
async def system_mode(_: dict = Depends(get_current_monitor_user)):
    return await get_system_mode()
