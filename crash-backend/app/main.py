import asyncio
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.responses import PlainTextResponse, JSONResponse, HTMLResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.openapi.docs import get_swagger_ui_html

from app.api.admin.router import router as admin_router
from app.api.auth.router import router as auth_router
from app.api.companies.router import router as companies_router
from app.api.tokens.router import router as tokens_router
from app.api.plans.router import router as plans_router
from app.api.impacts.router import router as impacts_router
from app.api.monitor.router import router as monitor_router
from app.api.monitor.websockets import manager
from app.api.riders.router import router as riders_router
from app.api.telemetry.router import router as telemetry_router
from app.api.sales.router import router as sales_router
from app.core.config import settings
from app.core.database import get_db, close_db
from app.core.security import decode_token, hash_password, verify_password
from app.core.rate_limiter import rate_limiter
from app.core.cache import cache
from app.core.exceptions import AppException, app_exception_handler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("crash")


class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        process_time = time.time() - start
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        if process_time > 1:
            logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.3f}s")
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 200, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next):
        from app.core.rate_limiter import RateLimitConfig
        client_ip = request.client.host if request.client else "unknown"
        config = RateLimitConfig(
            window_seconds=self.window_seconds,
            max_requests=self.max_requests,
        )
        if not rate_limiter.check(f"global:{client_ip}", config):
            return JSONResponse(
                status_code=429,
                content={"detail": "Demasiadas solicitudes. Intenta de nuevo m\u00e1s tarde."},
            )
        return await call_next(request)


CUSTOM_SWAGGER_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>C.R.A.S.H. API</title>
  <style>
    :root {
      --bg: #0A0A0A;
      --surface: #0d0d0f;
      --border: rgba(255,255,255,0.1);
      --text: #f5f5f5;
      --primary: #10b981;
      --destructive: #ef4444;
    }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: 'IBM Plex Sans', sans-serif; }
    .swagger-ui { color: var(--text) !important; }
    .swagger-ui .topbar { background: var(--surface) !important; border-bottom: 1px solid var(--border); }
    .swagger-ui .topbar .download-url-wrapper .select-label { color: var(--text) !important; }
    .swagger-ui .info .title { color: var(--text) !important; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { background: var(--surface) !important; box-shadow: none !important; border: 1px solid var(--border); border-radius: 12px; }
    .swagger-ui .opblock-tag { border-bottom: 1px solid var(--border); color: var(--text) !important; }
    .swagger-ui .opblock .opblock-summary { border-color: var(--border) !important; }
    .swagger-ui .opblock { background: var(--surface) !important; border: 1px solid var(--border) !important; border-radius: 12px !important; margin: 8px 0; }
    .swagger-ui .opblock .opblock-summary-description { color: rgba(255,255,255,0.6) !important; }
    .swagger-ui .opblock-body { background: var(--surface) !important; }
    .swagger-ui .opblock-body pre { background: rgba(0,0,0,0.3) !important; border-radius: 8px; }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th { border-bottom: 1px solid var(--border); color: var(--text) !important; }
    .swagger-ui .response-col_status { color: var(--text) !important; }
    .swagger-ui .btn { border-radius: 8px !important; }
    .swagger-ui .btn.execute { background: var(--primary) !important; border-color: var(--primary) !important; }
    .swagger-ui input, .swagger-ui select, .swagger-ui textarea { background: rgba(0,0,0,0.3) !important; border: 1px solid var(--border) !important; color: var(--text) !important; border-radius: 8px !important; }
    .swagger-ui .model-box { background: rgba(0,0,0,0.2) !important; border-radius: 8px; }
    .swagger-ui .model { color: var(--text) !important; }
    .swagger-ui .markdown p, .swagger-ui .markdown li { color: rgba(255,255,255,0.7) !important; }
    .swagger-ui .opblock-summary-control:focus { outline: none; }
    .swagger-ui .opblock-summary-path { color: var(--primary) !important; }
    .swagger-ui .response-col_description { color: rgba(255,255,255,0.7) !important; }
    .swagger-ui .parameters-col_description { color: rgba(255,255,255,0.7) !important; }
    .swagger-ui .model-toggle { filter: invert(1); }
    .swagger-ui .loading-container { background: var(--bg); }
    .swagger-ui .loading-container .loading { border-color: var(--border); }
    svg:not(:root) { fill: currentColor; }
  </style>
</head>
<body style="background:#0A0A0A;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      defaultModelsExpandDepth: 1,
      docExpansion: "list",
    });
  </script>
</body>
</html>
"""

app = FastAPI(
    title="C.R.A.S.H. 2.0 Unified API",
    docs_url=None,
    redoc_url="/api/redoc",
)

app.add_exception_handler(AppException, app_exception_handler)


FIELD_MESSAGES = {
    "password": "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
    "name": "El nombre es obligatorio.",
    "email": "El correo electrónico no es válido.",
}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    messages = []
    for err in exc.errors():
        loc = err.get("loc", [])
        field = str(loc[-1]) if loc else ""
        if field in FIELD_MESSAGES:
            messages.append(FIELD_MESSAGES[field])
        else:
            messages.append(err.get("msg", "Dato inválido"))
    text = "; ".join(dict.fromkeys(messages)) or "Datos inválidos."
    return JSONResponse(status_code=422, content={"detail": text, "message": text})

allowed = settings.ALLOWED_ORIGINS
if allowed == ["*"]:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(PerformanceMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=200, window_seconds=60)

app.include_router(admin_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(companies_router, prefix="/api")
app.include_router(tokens_router, prefix="/api")
app.include_router(plans_router, prefix="/api")
app.include_router(impacts_router, prefix="/api")
app.include_router(telemetry_router, prefix="/api")
app.include_router(riders_router, prefix="/api")
app.include_router(monitor_router, prefix="/api")
app.include_router(sales_router, prefix="/api")


@app.get("/api/")
async def root():
    return {
        "service": "crash-unified",
        "version": "2.0",
        "status": "ok",
        "demo": settings.DEMO_MODE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui():
    return HTMLResponse(CUSTOM_SWAGGER_HTML)

@app.get("/api/health")
async def health(request: Request):
    db_status = "unknown"
    db_detail = ""
    try:
        db = await get_db()
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = "error"
        db_detail = str(e)

    cache_stats = cache.stats()
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "database_detail": db_detail,
        "demo_mode": settings.DEMO_MODE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(time.time() - app.state.startup_time) if hasattr(app.state, "startup_time") else 0,
        "cache": cache_stats,
        "rate_limiter": rate_limiter.stats(),
    }


@app.get("/api/health/ready")
async def health_ready():
    return {"status": "ready", "timestamp": datetime.now(timezone.utc).isoformat()}


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
            data = await websocket.receive_text()
            if data == '{"type":"ping"}':
                try:
                    await websocket.send_json({"type": "pong", "ts": datetime.now(timezone.utc).isoformat()})
                except Exception:
                    break
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        logger.info("WS: disconnected")
    except Exception as exc:
        await manager.disconnect(websocket)
        logger.error("WS: error: %s", exc)


async def _seed_superadmin() -> None:
    db = await get_db()
    email = settings.SUPERADMIN_EMAIL.lower()
    existing = await db.users.find_one({"email": email})

    if not existing:
        site_token = uuid.uuid4().hex[:12].upper()
        await db.users.insert_one({
            "email": email,
            "name": "SuperAdmin",
            "password_hash": hash_password(settings.SUPERADMIN_PASSWORD),
            "role": "superadmin",
            "site_token": site_token,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("SuperAdmin seeded: %s", email)
    elif existing.get("role") != "superadmin":
        site_token = uuid.uuid4().hex[:12].upper()
        await db.users.update_one(
            {"email": email},
            {"$set": {"role": "superadmin", "password_hash": hash_password(settings.SUPERADMIN_PASSWORD),
                       "site_token": site_token, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        logger.info("SuperAdmin role updated for %s", email)
    else:
        await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": hash_password(settings.SUPERADMIN_PASSWORD),
                       "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        site_token = existing.get("site_token", "")

    logger.info("=" * 50)
    logger.info("SUPERADMIN CREDENTIALS")
    logger.info("  Email : %s", email)
    logger.info("  Pass  : %s", settings.SUPERADMIN_PASSWORD)
    logger.info("  Token : %s", site_token)
    logger.info("  Panel : http://localhost:3000/admin")
    logger.info("=" * 50)


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

    # Associate the seeded monitor operator with the first company (if any)
    # so its dashboard is scoped to that company's drivers.
    try:
        first_company = await db.companies.find_one({}, {"name": 1})
        if first_company:
            await db.monitor_operators.update_one(
                {"email": settings.MONITOR_EMAIL.lower()},
                {"$set": {
                    "company_id": str(first_company["_id"]),
                    "company_name": first_company.get("name", ""),
                }},
            )
    except Exception:
        pass

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
    app.state.startup_time = time.time()
    db = await get_db()
    await db.monitor_operators.create_index("email", unique=True)
    await db.monitor_acks.create_index("impact_id", unique=True)
    await db.monitor_incident_logs.create_index([("incident_id", 1), ("created_at", -1)])
    await db.users.create_index("email", unique=True)
    await db.site_tokens.create_index("token", unique=True)
    await db.emergency_contacts.create_index("user_id")
    await db.impact_events.create_index("user_id")
    await db.impact_events.create_index([("user_id", 1), ("created_at", -1)])
    await db.telemetry.create_index("user_id")
    await db.telemetry.create_index([("user_id", 1), ("ts", -1)])
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

    await _seed_superadmin()
    await _seed_operators()
    from app.api.plans.service import seed_plans
    await seed_plans()

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
