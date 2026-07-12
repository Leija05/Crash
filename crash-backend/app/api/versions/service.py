import logging
import os
import re
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile

from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger("crash.versions")

VALID_PLATFORMS = {"android", "ios", "all"}
_VERSION_RE = re.compile(r"^\d+(\.\d+){0,3}$")


def _clean_str(v, limit=2000) -> str:
    return v.strip()[:limit] if isinstance(v, str) else ""


def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _version_tuple(v: str) -> tuple:
    parts = re.findall(r"\d+", v or "")
    return tuple(int(p) for p in parts) if parts else (0,)


def _validate_url(url: str) -> str:
    url = _clean_str(url, 1000)
    if not url:
        raise HTTPException(400, "La URL de descarga es requerida")
    if not re.match(r"^(https?://|/uploads/)", url, re.IGNORECASE):
        raise HTTPException(400, "La URL de descarga debe iniciar con http://, https:// o /uploads/")
    return url


async def upload_apk(file: UploadFile) -> dict:
    if not file.filename or not any(file.filename.lower().endswith(ext) for ext in settings.ALLOWED_EXTENSIONS):
        raise HTTPException(400, f"Solo se permiten archivos: {', '.join(settings.ALLOWED_EXTENSIONS)}")
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(400, f"El archivo excede el tamaño máximo de {settings.MAX_UPLOAD_SIZE_MB} MB")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".apk"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    url = f"/uploads/versions/{filename}"
    size_mb = round(len(content) / (1024 * 1024), 2)
    logger.info("APK subido: %s (%s MB)", filename, size_mb)
    return {"url": url, "filename": filename, "size_mb": size_mb}


async def create_version(data: dict) -> dict:
    db = await get_db()
    version = _clean_str(data.get("version"), 20)
    if not version or not _VERSION_RE.match(version):
        raise HTTPException(400, "Versión inválida. Usa el formato x.y.z (ej. 2.1.0)")
    platform = (data.get("platform") or "android").strip().lower()
    if platform not in VALID_PLATFORMS:
        raise HTTPException(400, f"Plataforma inválida. Usa: {', '.join(sorted(VALID_PLATFORMS))}")
    download_url = _validate_url(data.get("download_url"))
    if await db.app_versions.find_one({"version": version, "platform": platform}):
        raise HTTPException(409, f"La versión {version} ya existe para {platform}")
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": uuid.uuid4().hex,
        "version": version,
        "platform": platform,
        "download_url": download_url,
        "notes": _clean_str(data.get("notes")),
        "mandatory": bool(data.get("mandatory", False)),
        "published": bool(data.get("published", False)),
        "size_mb": data.get("size_mb"),
        "created_at": now,
        "updated_at": now,
        "published_at": now if data.get("published") else None,
    }
    await db.app_versions.insert_one(dict(doc))
    logger.info("Versión creada: %s (%s)", version, platform)
    return _serialize(doc)


async def list_versions() -> list:
    db = await get_db()
    cursor = db.app_versions.find({}).sort("created_at", -1)
    return [_serialize(d) for d in await cursor.to_list(200)]


async def update_version(version_id: str, data: dict) -> dict:
    db = await get_db()
    existing = await db.app_versions.find_one({"id": version_id})
    if not existing:
        raise HTTPException(404, "Versión no encontrada")
    updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if "download_url" in data:
        updates["download_url"] = _validate_url(data.get("download_url"))
    if "notes" in data:
        updates["notes"] = _clean_str(data.get("notes"))
    if "mandatory" in data:
        updates["mandatory"] = bool(data.get("mandatory"))
    if "size_mb" in data:
        updates["size_mb"] = data.get("size_mb")
    if "published" in data:
        published = bool(data.get("published"))
        updates["published"] = published
        if published and not existing.get("published_at"):
            updates["published_at"] = updates["updated_at"]
    await db.app_versions.update_one({"id": version_id}, {"$set": updates})
    doc = await db.app_versions.find_one({"id": version_id})
    return _serialize(doc)


async def delete_version(version_id: str) -> dict:
    db = await get_db()
    r = await db.app_versions.delete_one({"id": version_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "Versión no encontrada")
    return {"ok": True}


async def get_version_download_url(version_id: str) -> str:
    db = await get_db()
    doc = await db.app_versions.find_one({"id": version_id})
    if not doc or not doc.get("download_url"):
        raise HTTPException(404, "URL de descarga no disponible")
    return doc.get("download_url", "")


async def get_latest_version(platform: str = "android") -> dict:
    db = await get_db()
    platform = (platform or "android").strip().lower()
    query = {"published": True, "platform": {"$in": [platform, "all"]}}
    published = [_serialize(d) for d in await db.app_versions.find(query).to_list(200)]
    if not published:
        return {}
    latest = max(published, key=lambda d: _version_tuple(d.get("version", "0")))
    return latest
