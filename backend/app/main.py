import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# STARTUP VALIDATION â€” must run BEFORE app creation
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
from app.config import get_settings
from app.database import Base, engine
from app.limiter import limiter
from app.logging_config import configure_logging, get_logger
from app.request_context import generate_request_id, set_request_id
from app.startup_validator import validate_startup

_settings = get_settings()

# ── Structured logging ──
is_production = _settings.ENVIRONMENT == "production"
configure_logging(level=_settings.LOG_LEVEL, json_format=is_production)
logger = get_logger(__name__)

validate_startup(_settings)
logger.info(
    "Startup validation passed", extra={"app": _settings.APP_NAME, "version": _settings.APP_VERSION}
)
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•


# Sentry - monitoreo de errores en produccion
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.routers import (
    admin_router,
    auth_router,
    events_router,
    jobs_router,
    notifications_router,
    payments_router,
    push_subscriptions_router,
    ratings_router,
    users_router,
    verification_router,
)

sentry_dsn = _settings.SENTRY_DSN
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=_settings.ENVIRONMENT,
        traces_sample_rate=0.1,
        send_default_pii=True,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
    )
    logger.info("Sentry initialized", extra={"environment": _settings.ENVIRONMENT})

# Database Schema -- Alembic handles migrations
# Production: schema managed by `alembic upgrade head` in the
#   startup command. No migration code runs here.
# Development: Base.metadata.create_all() as safe fallback
#   (prefer `alembic upgrade head` for consistency).
if _settings.ENVIRONMENT == "production":
    logger.info("Production: Alembic manages schema")
else:
    logger.info("Development: create_all fallback active")
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TurnoGO API",
    version="1.0.1",  # test persistencia PostgreSQL
)


# ── Request ID middleware ──
# Must be FIRST to capture every request before any other middleware.
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    # Accept existing request_id from frontend or generate one
    request_id = request.headers.get("X-Request-ID", generate_request_id())
    set_request_id(request_id)
    request.state.request_id = request_id

    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000)

    response.headers["X-Request-ID"] = request_id

    logger.debug(
        "Request completed",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response


# Security headers middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if env == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Middleware para mantener HTTPS detrÃ¡s del proxy de Railway
@app.middleware("http")
async def https_redirect(request: Request, call_next):
    response = await call_next(request)
    # Si es un redirect 307, asegurar que Location use HTTPS
    if response.status_code == 307:
        location = response.headers.get("location", "")
        if location.startswith("http://"):
            location = location.replace("http://", "https://", 1)
            return RedirectResponse(location, status_code=307)
    return response


# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# CORS â€” Strict origin validation
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# In production: only FRONTEND_URL is allowed (required).
# In development: localhost origins are allowed for testing.
# Swagger docs (/docs, /redoc, /openapi.json) are always accessible.

env = _settings.ENVIRONMENT
frontend_url = os.getenv("FRONTEND_URL", "")

if env == "production":
    if not frontend_url:
        raise RuntimeError(
            "\n"
            "====================================================\n"
            "*** ERROR: FRONTEND_URL is required in production    |\n"
            "====================================================\n"
            "|  CORS requests will be blocked without it.          |\n"
            "|  Set FRONTEND_URL in Railway Variables tab.         |\n"
            "====================================================\n"
        )
    allow_origins = [frontend_url]
    logger.info("CORS: Production mode", extra={"origin": frontend_url})
else:
    allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.0.0.101:3000",
        "https://freelance-web-beta.vercel.app",
        "https://freelance-web.vercel.app",
    ]
    if frontend_url:
        allow_origins.append(frontend_url)
    logger.info("CORS: Development mode", extra={"origin_count": len(allow_origins)})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

# Incluir routers (cada router ya tiene su prefix propio, excepto events)
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(payments_router)
app.include_router(ratings_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(events_router)
app.include_router(notifications_router)
app.include_router(push_subscriptions_router)
app.include_router(verification_router)

# Servir archivos subidos (avatares)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/v1/health")
def health():
    """General health check — fast, no dependencies."""
    return {"status": "ok"}


@app.get("/live")
def live():
    """Liveness probe — confirms the process is running. No external checks.

    Use for: Railway health check, process monitor.
    """
    return {"status": "alive"}


@app.get("/ready")
def ready():
    """Readiness probe — confirms the app can serve traffic.

    Checks: database connectivity.
    Use for: load balancer, ingress controller.
    """
    checks = {}
    healthy = True

    # Database check
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = "unavailable"
        healthy = False
        logger.error("Readiness check failed: database unavailable", extra={"error": str(e)})

    status_code = 200 if healthy else 503
    return JSONResponse(
        content={"status": "ready" if healthy else "not_ready", "checks": checks},
        status_code=status_code,
    )
