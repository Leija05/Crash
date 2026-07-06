import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse
from starlette.middleware.cors import CORSMiddleware

from app.api.auth.router import router as auth_router
from app.api.impacts.router import router as impacts_router
from app.api.monitor.router import router as monitor_router
from app.api.monitor.websockets import manager
from app.api.riders.router import router as riders_router
from app.api.telemetry.router import router as telemetry_router
from app.core.config import settings
from app.core.database import get_db, close_db
from app.core.security import decode_token, hash_password, verify_password

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("crash")

app = FastAPI(title="C.R.A.S.H. 2.0 Unified API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(impacts_router, prefix="/api")
app.include_router(telemetry_router, prefix="/api")
app.include_router(riders_router, prefix="/api")
app.include_router(monitor_router, prefix="/api")


@app.get("/api/")
async def root():
    return {"service": "crash-unified", "status": "ok", "demo": settings.DEMO_MODE}


@app.get("/api/health")
async def health():
    return {"status": "healthy", "database": "connected"}


@app.get("/webhook/whatsapp")
async def whatsapp_webhook_verify(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode == "subscribe" and token == settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN and challenge:
        logger.info("WhatsApp webhook verificado correctamente")
        return PlainTextResponse(content=challenge)
    logger.warning("Intento de verificación webhook inválido")
    raise HTTPException(status_code=403, detail="Webhook verification failed")


@app.post("/webhook/whatsapp")
async def whatsapp_webhook_receive(request: Request):
    from app.infrastructure.whatsapp_client import verify_webhook_signature

    raw_body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")
    if not verify_webhook_signature(raw_body, signature):
        logger.warning("Firma inválida en webhook de WhatsApp")
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    payload = json.loads(raw_body.decode("utf-8"))
    logger.info(f"WhatsApp webhook event: {json.dumps(payload)}")
    return {"status": "received"}


@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("WebSocket connection attempt from %s", websocket.client)

    token = websocket.query_params.get("token")
    if not token:
        try:
            token = websocket.cookies.get("access_token")
        except Exception:
            pass

    if not token:
        logger.warning("WS: no token found — rejecting")
        await websocket.close(code=4401)
        return

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            logger.warning("WS: bad token type: %s", payload.get("type"))
            await websocket.close(code=4401)
            return
    except Exception as exc:
        logger.error("WS: token decode failed: %s", exc)
        await websocket.close(code=4401)
        return

    await manager.connect(websocket)
    logger.info("WS: connected (demo=%s)", settings.DEMO_MODE)

    from app.infrastructure.simulator import simulator
    from app.infrastructure.mobile_bridge import bridge
    src = simulator if settings.DEMO_MODE else bridge
    try:
        await websocket.send_json({
            "type": "snapshot",
            "ts": datetime.now(timezone.utc).isoformat(),
            "drivers": src.list_drivers(),
            "alerts": src.list_alerts(),
            "demo": settings.DEMO_MODE,
        })
    except Exception as exc:
        logger.error("WS: snapshot send failed: %s", exc)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        logger.info("WS: disconnected")
    except Exception as exc:
        await manager.disconnect(websocket)
        logger.error("WS: error: %s", exc)


async def _seed_operators() -> None:
    db = await get_db()
    seeds = [
        {"email": settings.ADMIN_EMAIL.lower(), "password": settings.ADMIN_PASSWORD,
         "name": "Administrador", "role": "admin"},
        {"email": settings.MONITOR_EMAIL.lower(), "password": settings.MONITOR_PASSWORD,
         "name": "Monitorista", "role": "monitor"},
    ]
    for s in seeds:
        existing = await db.monitor_operators.find_one({"email": s["email"]})
        if existing is None:
            await db.monitor_operators.insert_one({
                "id": f"usr-{uuid.uuid4().hex[:10]}",
                "email": s["email"],
                "password_hash": hash_password(s["password"]),
                "name": s["name"],
                "role": s["role"],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info("Seeded operator %s (%s)", s["email"], s["role"])
        elif not verify_password(s["password"], existing["password_hash"]):
            await db.monitor_operators.update_one(
                {"email": s["email"]},
                {"$set": {"password_hash": hash_password(s["password"]), "role": s["role"]}},
            )
            logger.info("Refreshed operator password for %s", s["email"])

    admin_email = settings.MOBILE_ADMIN_EMAIL
    admin_password = settings.MOBILE_ADMIN_PASSWORD
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Mobile admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Admin password updated")


@app.on_event("startup")
async def on_startup() -> None:
    db = await get_db()
    await db.monitor_operators.create_index("email", unique=True)
    await db.monitor_acks.create_index("impact_id", unique=True)
    await db.monitor_incident_logs.create_index([("incident_id", 1), ("created_at", -1)])
    await db.users.create_index("email", unique=True)
    await db.emergency_contacts.create_index("user_id")
    await db.impact_events.create_index("user_id")
    await db.telemetry.create_index("user_id")
    await db.location_history.create_index("user_id")
    await db.location_history.create_index("timestamp", expireAfterSeconds=86400)
    await db.user_live_locations.create_index("user_id", unique=True)
    await db.user_profiles.create_index("user_id")
    await db.user_settings.create_index("user_id")

    if settings.DEMO_MODE:
        await db.drivers.create_index("id", unique=True)
        await db.alerts.create_index("id", unique=True)
        await db.events.create_index([("driver_id", 1), ("ts", -1)])
        await db.telemetry.create_index([("driver_id", 1), ("ts", -1)])

    await _seed_operators()

    if settings.DEMO_MODE:
        from app.infrastructure.simulator import simulator
        from app.api.monitor.websockets import manager
        await simulator.start(db, manager.broadcast)
        logger.info("CRASH started in DEMO mode (simulator)")
    else:
        from app.infrastructure.mobile_bridge import bridge
        from app.api.monitor.websockets import manager
        await bridge.start(db, manager.broadcast)
        logger.info("CRASH started in LIVE mode — reading mobile DB '%s'", settings.DB_NAME)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    if settings.DEMO_MODE:
        from app.infrastructure.simulator import simulator
        await simulator.stop()
    else:
        from app.infrastructure.mobile_bridge import bridge
        await bridge.stop()
    await close_db()
