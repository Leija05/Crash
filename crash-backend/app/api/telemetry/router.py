import uuid
from datetime import datetime, timedelta, timezone
from math import radians, sin, cos, sqrt, atan2

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from app.api.impacts.service import classify_severity
from app.api.telemetry.schemas import TelemetryInput
from app.core.database import get_db
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

    if location:
        latest_live = await db.user_live_locations.find_one({"user_id": user["id"]}, {"_id": 0})
        await db.user_live_locations.update_one(
            {"user_id": user["id"]},
            {"$set": {
                "user_id": user["id"],
                "location": location,
                "helmet_connected": body.helmet_connected,
                "g_force": body.g_force,
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
                r = 6371000.0
                dlat = radians(curr_lat - prev_lat)
                dlon = radians(curr_lon - prev_lon)
                a = sin(dlat / 2) ** 2 + cos(radians(prev_lat)) * cos(radians(curr_lat)) * sin(dlon / 2) ** 2
                c = 2 * atan2(sqrt(a), sqrt(1 - a))
                distance_m = r * c
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
    }


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
