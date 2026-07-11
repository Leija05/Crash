import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from app.api.impacts.service import classify_severity
from app.api.geofences.service import evaluate_zone
from app.api.telemetry.schemas import TelemetryInput, LocationInput, BatchTelemetryInput
from app.core.database import get_db
from app.core.geo import haversine_m
from app.core.security import get_current_rider

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("")
async def receive_telemetry(body: TelemetryInput, user: dict = Depends(get_current_rider)):
    db = await get_db()
    settings = await db.user_settings.find_one({"user_id": user["id"]}, {"_id": 0}) or {}
    track_location = settings.get("location_tracking_enabled", True)
    location = None
    if track_location and body.latitude is not None and body.longitude is not None:
        location = {
            "latitude": body.latitude,
            "longitude": body.longitude,
            "gps_accuracy_m": body.gps_accuracy_m,
        }

    client_event_id = body.client_event_id or f"telemetry-{uuid.uuid4()}"
    doc = {
        "user_id": user["id"],
        "client_event_id": client_event_id,
        "acceleration": {"x": body.acceleration_x, "y": body.acceleration_y, "z": body.acceleration_z},
        "gyroscope": {"x": body.gyroscope_x, "y": body.gyroscope_y, "z": body.gyroscope_z},
        "g_force": body.g_force,
        "speed_kmh": body.speed_kmh,
        "helmet_connected": body.helmet_connected,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.telemetry.insert_one(doc)
    except DuplicateKeyError:
        return {
            "status": "duplicate_ignored",
            "g_force": body.g_force,
            "severity": classify_severity(body.g_force),
            "location_tracking_enabled": track_location,
        }

    # Geocercas de riesgo: detectar modo Precaución y cronometrar tiempo en zona.
    caution = {"in_zone": False, "caution": False}
    if location:
        try:
            caution = await evaluate_zone(user["id"], location["latitude"], location["longitude"])
        except Exception:
            caution = {"in_zone": False, "caution": False}

    if location:
        latest_live = await db.user_live_locations.find_one({"user_id": user["id"]}, {"_id": 0})
        await db.user_live_locations.update_one(
            {"user_id": user["id"]},
            {"$set": {
                "user_id": user["id"],
                "location": location,
                "helmet_connected": body.helmet_connected,
                "g_force": body.g_force,
                "speed_kmh": body.speed_kmh,
                "caution": caution,
                "timestamp": doc["timestamp"],
            }},
            upsert=True,
        )

        should_store_history = False
        if not latest_live or not latest_live.get("location"):
            should_store_history = True
        else:
            prev = latest_live["location"]
            prev_lat = prev.get("latitude")
            prev_lon = prev.get("longitude")
            curr_lat = location.get("latitude")
            curr_lon = location.get("longitude")
            if prev_lat is not None and prev_lon is not None and curr_lat is not None and curr_lon is not None:
                distance_m = haversine_m(prev_lat, prev_lon, curr_lat, curr_lon)
                should_store_history = distance_m >= 25

                prev_ts_raw = latest_live.get("timestamp")
                if prev_ts_raw:
                    try:
                        prev_ts = datetime.fromisoformat(prev_ts_raw)
                        now_ts = datetime.fromisoformat(doc["timestamp"])
                        elapsed_seconds = (now_ts - prev_ts).total_seconds()
                        if elapsed_seconds >= 60:
                            should_store_history = True
                    except Exception:
                        pass

        if should_store_history:
            await db.location_history.insert_one({
                "user_id": user["id"],
                "location": location,
                "helmet_connected": body.helmet_connected,
                "g_force": body.g_force,
                "timestamp": doc["timestamp"],
            })

    return {
        "status": "ok",
        "g_force": body.g_force,
        "severity": classify_severity(body.g_force),
        "location_tracking_enabled": track_location,
        "caution": caution,
    }


@router.post("/batch")
async def receive_telemetry_batch(body: BatchTelemetryInput, user: dict = Depends(get_current_rider)):
    """Ingesta en ráfaga de la Caja Negra del Casco.

    Recibe muestras almacenadas localmente mientras no había señal y las
    persiste conservando su marca de tiempo original. No re-dispara alertas
    (el evento ya ocurrió); solo preserva la telemetría para la caja negra.
    """
    db = await get_db()
    if not body.samples:
        return {"status": "ok", "stored": 0, "duplicates": 0}

    settings = await db.user_settings.find_one({"user_id": user["id"]}, {"_id": 0}) or {}
    track_location = settings.get("location_tracking_enabled", True)

    stored = 0
    duplicates = 0
    latest = None
    for s in body.samples:
        ts = s.occurred_at or datetime.now(timezone.utc).isoformat()
        location = None
        if track_location and s.latitude is not None and s.longitude is not None:
            location = {
                "latitude": s.latitude,
                "longitude": s.longitude,
                "gps_accuracy_m": s.gps_accuracy_m,
            }
        doc = {
            "user_id": user["id"],
            "client_event_id": s.client_event_id or f"blackbox-{uuid.uuid4()}",
            "acceleration": {"x": s.acceleration_x, "y": s.acceleration_y, "z": s.acceleration_z},
            "gyroscope": {"x": s.gyroscope_x, "y": s.gyroscope_y, "z": s.gyroscope_z},
            "g_force": s.g_force,
            "speed_kmh": s.speed_kmh,
            "helmet_connected": s.helmet_connected,
            "location": location,
            "from_blackbox": True,
            "timestamp": ts,
        }
        try:
            await db.telemetry.insert_one(doc)
            stored += 1
            if location:
                await db.location_history.insert_one({
                    "user_id": user["id"],
                    "location": location,
                    "helmet_connected": s.helmet_connected,
                    "g_force": s.g_force,
                    "from_blackbox": True,
                    "timestamp": ts,
                })
            if latest is None or ts > latest["timestamp"]:
                latest = doc
        except DuplicateKeyError:
            duplicates += 1

    return {"status": "ok", "stored": stored, "duplicates": duplicates}


@router.post("/location")
async def update_live_location(body: LocationInput, user: dict = Depends(get_current_rider)):
    db = await get_db()
    settings = await db.user_settings.find_one({"user_id": user["id"]}, {"_id": 0}) or {}
    if not settings.get("location_tracking_enabled", True):
        return {"status": "disabled"}

    location = {
        "latitude": body.latitude,
        "longitude": body.longitude,
        "gps_accuracy_m": body.gps_accuracy_m,
    }
    ts = datetime.now(timezone.utc).isoformat()

    try:
        caution = await evaluate_zone(user["id"], body.latitude, body.longitude)
    except Exception:
        caution = {"in_zone": False, "caution": False}

    previous = await db.user_live_locations.find_one({"user_id": user["id"]}, {"_id": 0})
    await db.user_live_locations.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "user_id": user["id"],
            "location": location,
            "helmet_connected": bool(body.helmet_connected),
            "g_force": None,
            "caution": caution,
            "timestamp": ts,
        }},
        upsert=True,
    )

    should_store_history = False
    if not previous or not previous.get("location"):
        should_store_history = True
    else:
        prev = previous["location"]
        prev_lat = prev.get("latitude")
        prev_lon = prev.get("longitude")
        if prev_lat is not None and prev_lon is not None:
            distance_m = haversine_m(prev_lat, prev_lon, body.latitude, body.longitude)
            if distance_m >= 25:
                should_store_history = True
            else:
                prev_ts_raw = previous.get("timestamp")
                if prev_ts_raw:
                    try:
                        elapsed_seconds = (datetime.fromisoformat(ts) - datetime.fromisoformat(prev_ts_raw)).total_seconds()
                        if elapsed_seconds >= 60:
                            should_store_history = True
                    except Exception:
                        pass

    if should_store_history:
        await db.location_history.insert_one({
            "user_id": user["id"],
            "location": location,
            "helmet_connected": bool(body.helmet_connected),
            "g_force": None,
            "timestamp": ts,
        })

    return {"status": "ok"}


@router.get("/history")
async def get_telemetry_history(
    impact_id: str,
    before_minutes: int = 5,
    after_minutes: int = 5,
    limit: int = 200,
    user: dict = Depends(get_current_rider),
):
    db = await get_db()
    impact = await db.impact_events.find_one(
        {"id": impact_id, "user_id": user["id"]},
        {"_id": 0, "created_at": 1, "g_force": 1, "location": 1},
    )
    if not impact:
        raise HTTPException(status_code=404, detail="Impacto no encontrado")

    impact_time_str = impact.get("created_at")
    if not impact_time_str:
        return {"points": [], "impact": impact}

    try:
        impact_dt = datetime.fromisoformat(impact_time_str)
    except Exception:
        return {"points": [], "impact": impact}

    from_start = impact_dt - timedelta(minutes=before_minutes)
    from_end = impact_dt + timedelta(minutes=after_minutes)

    cursor = db.telemetry.find(
        {
            "user_id": user["id"],
            "timestamp": {"$gte": from_start.isoformat(), "$lte": from_end.isoformat()},
        },
        {"_id": 0, "acceleration": 1, "gyroscope": 1, "g_force": 1, "timestamp": 1, "helmet_connected": 1},
    ).sort("timestamp", 1).limit(limit)

    points = await cursor.to_list(length=limit)
    return {
        "points": points,
        "impact": {
            "id": impact_id,
            "g_force": impact.get("g_force"),
            "timestamp": impact_time_str,
            "location": impact.get("location"),
        },
    }


@router.get("/live")
async def get_live_tracking(user: dict = Depends(get_current_rider)):
    db = await get_db()
    latest = await db.user_live_locations.find_one({"user_id": user["id"]}, {"_id": 0})
    if latest:
        return latest
    telemetry = await db.telemetry.find_one(
        {"user_id": user["id"], "location": {"$ne": None}},
        {"_id": 0},
        sort=[("timestamp", -1)],
    )
    if telemetry:
        return {
            "user_id": user["id"],
            "location": telemetry.get("location"),
            "helmet_connected": telemetry.get("helmet_connected"),
            "g_force": telemetry.get("g_force"),
            "timestamp": telemetry.get("timestamp"),
        }
    return {
        "user_id": user["id"],
        "location": None,
        "helmet_connected": False,
        "g_force": None,
        "timestamp": None,
    }
