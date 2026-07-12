from fastapi import APIRouter, Depends, File, Query, Request, UploadFile
from starlette.responses import RedirectResponse

from app.api.versions.service import (
    create_version,
    list_versions,
    update_version,
    delete_version,
    get_latest_version,
    upload_apk,
    get_version_download_url,
)
from app.core.security import get_current_superadmin

router = APIRouter(prefix="/versions", tags=["versions"])


@router.get("/latest")
async def versions_latest(platform: str = Query("android")):
    """Última versión publicada (público) para la web y la app móvil."""
    return await get_latest_version(platform)


@router.get("")
async def versions_list(_: dict = Depends(get_current_superadmin)):
    return await list_versions()


@router.post("/upload")
async def versions_upload(file: UploadFile = File(...), _: dict = Depends(get_current_superadmin)):
    return await upload_apk(file)


@router.post("")
async def versions_create(data: dict, _: dict = Depends(get_current_superadmin)):
    return await create_version(data)


@router.get("/{version_id}/download")
async def versions_download(version_id: str, request: Request):
    url = await get_version_download_url(version_id)
    if url.startswith("/"):
        url = str(request.base_url).rstrip("/") + url
    return RedirectResponse(url=url, status_code=302)


@router.put("/{version_id}")
async def versions_update(version_id: str, data: dict, _: dict = Depends(get_current_superadmin)):
    return await update_version(version_id, data)


@router.delete("/{version_id}")
async def versions_delete(version_id: str, _: dict = Depends(get_current_superadmin)):
    return await delete_version(version_id)
