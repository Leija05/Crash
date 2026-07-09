from fastapi import APIRouter, Depends, Request

from app.api.sales.service import compute_logistics
from app.core.security import get_current_superadmin

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("/logistics")
async def sales_logistics(_=Depends(get_current_superadmin), request: Request = None):
    params = dict(request.query_params) if request else {}
    return await compute_logistics(params)
