from fastapi import APIRouter, Depends, Query, Request

from app.api.analytics.service import record_page_view, get_page_analytics
from app.core.security import get_current_superadmin

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/track")
async def track_page_view(data: dict, request: Request):
    """Registra una vista de página (endpoint público, sin autenticación)."""
    ip = request.client.host if request.client else ""
    await record_page_view(
        path=(data or {}).get("path", "/"),
        visitor_id=(data or {}).get("visitor_id", ""),
        referrer=(data or {}).get("referrer", ""),
        user_agent=request.headers.get("user-agent", ""),
        ip=ip,
    )
    return {"ok": True}


@router.get("/overview")
async def analytics_overview(
    days: int = Query(30, ge=1, le=365),
    _: dict = Depends(get_current_superadmin),
):
    return await get_page_analytics(days)
