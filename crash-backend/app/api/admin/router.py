from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse

from app.api.admin.service import (
    get_dashboard_stats,
    export_impacts_csv,
    get_system_analytics,
    send_email_report,
    get_audit_log,
    get_token_alerts,
    get_impact_heatmap,
)
from app.api.companies.service import (
    list_support_requests,
    forward_support_request,
    resolve_support_request,
    reset_support_password,
    revoke_support_token,
)
from app.core.security import get_current_admin, get_current_superadmin, require_role

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


# ── Alertas de tokens / suscripciones ─────────────────────────────
@router.get("/token-alerts")
async def token_alerts(_: dict = Depends(get_current_superadmin)):
    return await get_token_alerts()


# ── Mapa de calor de impactos ─────────────────────────────────────
@router.get("/heatmap")
async def heatmap(
    company_id: str = Query(None, description="Filtrar por empresa"),
    days: int = Query(30, ge=1, le=365),
    _: dict = Depends(get_current_superadmin),
):
    return await get_impact_heatmap(company_id, days)


# ── Centro de Ayudas (reportes de soporte) ────────────────────────
@router.get("/support")
async def support_list(_: dict = Depends(get_current_superadmin)):
    return await list_support_requests()


@router.post("/support/{req_id}/forward")
async def support_forward(req_id: str, _: dict = Depends(get_current_superadmin)):
    return await forward_support_request(req_id)


@router.post("/support/{req_id}/resolve")
async def support_resolve(req_id: str, data: dict = None, _: dict = Depends(get_current_superadmin)):
    return await resolve_support_request(req_id, (data or {}).get("note", ""))


@router.post("/support/{req_id}/reset-password")
async def support_reset_password(req_id: str, data: dict = None, _: dict = Depends(get_current_superadmin)):
    """Reinicia la contraseña de la cuenta asociada y devuelve una temporal."""
    return await reset_support_password(req_id, (data or {}).get("target_email"))


@router.post("/support/{req_id}/revoke-token")
async def support_revoke_token(req_id: str, data: dict = None, _: dict = Depends(get_current_superadmin)):
    """Desactiva el token de monitorista de la empresa (o uno específico)."""
    return await revoke_support_token(req_id, (data or {}).get("token"))