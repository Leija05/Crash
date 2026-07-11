import logging
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import HTTPException

from app.core.database import get_db
from app.core.geo import haversine_m

logger = logging.getLogger("crash.geofences")

VALID_TYPES = {"curva", "tunel", "escolar", "cruce", "obra", "otro"}
TYPE_RISK = {"curva": 3, "tunel": 2, "escolar": 2, "cruce": 3, "obra": 2, "otro": 1}


def _clean_str(v, limit=120) -> str:
    return v.strip()[:limit] if isinstance(v, str) else ""


def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def create_geofence(data: dict) -> dict:
    db = await get_db()
    name = _clean_str(data.get("name"))
    gtype = (data.get("type") or "otro").strip().lower()
    if not name:
        raise HTTPException(400, "El nombre de la zona es obligatorio")
    if gtype not in VALID_TYPES:
        raise HTTPException(400, f"Tipo inválido. Usa uno de: {', '.join(sorted(VALID_TYPES))}")
    try:
        lat = float(data.get("latitude"))
        lon = float(data.get("longitude"))
        radius = float(data.get("radius_m", 100))
    except (TypeError, ValueError):
        raise HTTPException(400, "Coordenadas o radio inválidos")
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise HTTPException(400, "Coordenadas fuera de rango")
    if not (10 <= radius <= 5000):
        raise HTTPException(400, "El radio debe estar entre 10 y 5000 metros")

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "type": gtype,
        "latitude": lat,
        "longitude": lon,
        "radius_m": radius,
        "risk_weight": int(data.get("risk_weight") or TYPE_RISK.get(gtype, 1)),
        "note": _clean_str(data.get("note"), 300),
        "company_id": data.get("company_id") or None,
        "active": bool(data.get("active", True)),
        "created_at": now,
        "updated_at": now,
    }
    await db.geofences.insert_one(doc)
    return _serialize(doc)


async def list_geofences(company_id: str = None) -> list:
    db = await get_db()
    query = {}
    if company_id:
        query["$or"] = [{"company_id": company_id}, {"company_id": None}]
    cursor = db.geofences.find(query, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


async def get_active_geofences(company_id: str = None) -> list:
    db = await get_db()
    query = {"active": True}
    if company_id:
        query["$or"] = [{"company_id": company_id}, {"company_id": None}]
    cursor = db.geofences.find(
        query,
        {"_id": 0, "id": 1, "name": 1, "type": 1, "latitude": 1, "longitude": 1, "radius_m": 1, "risk_weight": 1},
    )
    return await cursor.to_list(500)


async def update_geofence(geofence_id: str, data: dict) -> dict:
    db = await get_db()
    update = {}
    if "name" in data:
        update["name"] = _clean_str(data.get("name"))
    if "type" in data:
        gtype = (data.get("type") or "otro").strip().lower()
        if gtype not in VALID_TYPES:
            raise HTTPException(400, "Tipo inválido")
        update["type"] = gtype
    for key in ("latitude", "longitude", "radius_m", "risk_weight"):
        if key in data and data[key] is not None:
            try:
                update[key] = float(data[key])
            except (TypeError, ValueError):
                raise HTTPException(400, f"Valor inválido para {key}")
    if "note" in data:
        update["note"] = _clean_str(data.get("note"), 300)
    if "active" in data:
        update["active"] = bool(data["active"])
    if not update:
        raise HTTPException(400, "Nada que actualizar")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.geofences.update_one({"id": geofence_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(404, "Zona no encontrada")
    doc = await db.geofences.find_one({"id": geofence_id}, {"_id": 0})
    return doc


async def delete_geofence(geofence_id: str) -> dict:
    db = await get_db()
    r = await db.geofences.delete_one({"id": geofence_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "Zona no encontrada")
    return {"status": "deleted", "id": geofence_id}


def zone_containing(lat: float, lon: float, zones: list) -> dict | None:
    """Devuelve la zona activa más cercana que contiene el punto, o None."""
    best = None
    best_dist = None
    for z in zones:
        try:
            d = haversine_m(lat, lon, z["latitude"], z["longitude"])
        except (KeyError, TypeError):
            continue
        if d <= z.get("radius_m", 0):
            if best_dist is None or d < best_dist:
                best = z
                best_dist = d
    return best


async def evaluate_zone(user_id: str, lat: float, lon: float) -> dict:
    """Detecta entrada/salida de zonas de riesgo y cronometra el tiempo dentro.

    Devuelve el estado de precaución actual para el conductor.
    """
    if lat is None or lon is None:
        return {"in_zone": False, "caution": False}
    db = await get_db()
    zones = await get_active_geofences()
    current = zone_containing(lat, lon, zones)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    state = await db.user_zone_state.find_one({"user_id": user_id}, {"_id": 0})
    prev_zone_id = state.get("geofence_id") if state else None
    current_id = current["id"] if current else None

    if current_id != prev_zone_id:
        # Cerrar sesión anterior (salida de zona).
        if prev_zone_id and state:
            entered_raw = state.get("entered_at")
            duration = 0
            if entered_raw:
                try:
                    entered_dt = datetime.fromisoformat(entered_raw)
                    duration = int((now - entered_dt).total_seconds())
                except (ValueError, TypeError):
                    duration = 0
            await db.geofence_events.insert_one({
                "user_id": user_id,
                "geofence_id": prev_zone_id,
                "geofence_name": state.get("geofence_name", ""),
                "geofence_type": state.get("geofence_type", ""),
                "entered_at": entered_raw,
                "exited_at": now_iso,
                "duration_s": duration,
                "created_at": now_iso,
            })
        # Abrir nueva sesión (entrada) o limpiar estado.
        if current_id:
            await db.user_zone_state.update_one(
                {"user_id": user_id},
                {"$set": {
                    "user_id": user_id,
                    "geofence_id": current_id,
                    "geofence_name": current.get("name", ""),
                    "geofence_type": current.get("type", ""),
                    "entered_at": now_iso,
                    "updated_at": now_iso,
                }},
                upsert=True,
            )
        else:
            await db.user_zone_state.delete_one({"user_id": user_id})

    seconds_in_zone = 0
    if current_id:
        entered = now_iso if current_id != prev_zone_id else (state.get("entered_at") if state else now_iso)
        try:
            seconds_in_zone = int((now - datetime.fromisoformat(entered)).total_seconds())
        except (ValueError, TypeError):
            seconds_in_zone = 0

    if not current:
        return {"in_zone": False, "caution": False}
    return {
        "in_zone": True,
        "caution": True,
        "mode": "precaucion",
        "geofence_id": current["id"],
        "name": current.get("name", ""),
        "type": current.get("type", ""),
        "risk_weight": current.get("risk_weight", 1),
        "seconds_in_zone": seconds_in_zone,
    }


async def zone_risk_at(lat: float, lon: float) -> int:
    """Peso de riesgo de la zona en un punto (0 si no hay zona)."""
    if lat is None or lon is None:
        return 0
    zones = await get_active_geofences()
    z = zone_containing(lat, lon, zones)
    return z.get("risk_weight", 0) if z else 0


async def get_geofence_stats(days: int = 30) -> dict:
    db = await get_db()
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=days)).isoformat()

    per_zone = await db.geofence_events.aggregate([
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id": {"id": "$geofence_id", "name": "$geofence_name", "type": "$geofence_type"},
            "entries": {"$sum": 1},
            "total_seconds": {"$sum": "$duration_s"},
            "drivers": {"$addToSet": "$user_id"},
        }},
        {"$project": {
            "_id": 0,
            "geofence_id": "$_id.id",
            "name": "$_id.name",
            "type": "$_id.type",
            "entries": 1,
            "total_seconds": 1,
            "unique_drivers": {"$size": "$drivers"},
            "avg_seconds": {"$cond": [{"$gt": ["$entries", 0]}, {"$divide": ["$total_seconds", "$entries"]}, 0]},
        }},
        {"$sort": {"total_seconds": -1}},
    ]).to_list(100)

    for z in per_zone:
        z["avg_seconds"] = round(z.get("avg_seconds", 0), 1)

    total_events = sum(z["entries"] for z in per_zone)
    total_seconds = sum(z["total_seconds"] for z in per_zone)
    active_zones = await db.geofences.count_documents({"active": True})

    # Conductores actualmente en zona de precaución.
    currently_in_zone = await db.user_zone_state.count_documents({})

    return {
        "period_days": days,
        "active_zones": active_zones,
        "total_entries": total_events,
        "total_seconds": total_seconds,
        "currently_in_zone": currently_in_zone,
        "per_zone": per_zone,
        "timestamp": now.isoformat(),
    }
