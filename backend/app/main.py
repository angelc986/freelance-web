import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# STARTUP VALIDATION â€” must run BEFORE app creation
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
from app.config import get_settings
from app.database import Base, engine
from app.limiter import limiter
from app.startup_validator import validate_startup

_settings = get_settings()
validate_startup(_settings)
print(f"[STARTUP] Validation passed ({_settings.APP_NAME} v{_settings.APP_VERSION})")
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

sentry_dsn = os.getenv("SENTRY_DSN", "")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=os.getenv("ENVIRONMENT", "development"),
        traces_sample_rate=0.1,
        send_default_pii=True,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
    )

# Database Schema -- Alembic handles migrations
# Production: schema managed by `alembic upgrade head` in the
#   startup command. No migration code runs here.
# Development: Base.metadata.create_all() as safe fallback
#   (prefer `alembic upgrade head` for consistency).
if _settings.ENVIRONMENT == "production":
    print("[DB] Production: Alembic manages schema")
else:
    print("[DB] Development: create_all fallback active")
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TurnoGO API",
    version="1.0.1",  # test persistencia PostgreSQL
)


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
    print(f"[CORS] Production mode: only {frontend_url}")
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
    print(f"[CORS] Development mode: {len(allow_origins)} origins allowed")

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
    return {"status": "ok"}
