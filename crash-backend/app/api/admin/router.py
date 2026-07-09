from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse

from app.api.admin.service import (
    get_dashboard_stats,
    export_impacts_csv,
    get_system_analytics,
    send_email_report,
    get_audit_log,
)
from app.core.security import get_current_admin, require_role

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def dashboard_stats(_: dict = Depends(get_current_admin)):
    return await get_dashboard_stats()


@router.get("/audit")
async def audit_log(_: dict = Depends(get_current_admin)):
    return await get_audit_log()


@router.get("/analytics")
async def system_analytics(
    days: int = Query(7, ge=1, le=90),
    _: dict = Depends(get_current_admin),
):
    return await get_system_analytics(days)


@router.get("/export/impacts")
async def export_impacts(
    days: int = Query(30, ge=1, le=365),
    _: dict = Depends(get_current_admin),
):
    csv_data = await export_impacts_csv(days)
    return PlainTextResponse(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=crash-impacts-{days}d.csv"},
    )


@router.post("/report/email")
async def email_report(
    recipient: str = Query(..., description="Correo destino"),
    _: dict = Depends(get_current_admin),
):
    return await send_email_report(recipient)