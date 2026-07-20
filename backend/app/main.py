import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter
from app.database import engine, Base
from sqlalchemy import text as sa_text


# Migraciones automáticas
# Se ejecutan al iniciar el backend para evitar errores en Railway
# donde PostgreSQL ya tiene tablas creadas sin ciertas columnas
def run_migrations():
    with engine.connect() as conn:
        dialect = conn.dialect.name
        try:
            if dialect == "postgresql":
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR"))
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE"))
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR"))
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profession VARCHAR"))
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION"))
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION"))
                conn.execute(sa_text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION"))
                conn.execute(sa_text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION"))
            elif dialect == "sqlite":
                cols = [row[1] for row in conn.execute(sa_text("PRAGMA table_info(users)")).fetchall()]
                if "google_id" not in cols:
                    conn.execute(sa_text("ALTER TABLE users ADD COLUMN google_id VARCHAR"))
                if "profile_completed" not in cols:
                    conn.execute(sa_text("ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT 0"))
                if "latitude" not in cols:
                    conn.execute(sa_text("ALTER TABLE users ADD COLUMN latitude FLOAT"))
                if "longitude" not in cols:
                    conn.execute(sa_text("ALTER TABLE users ADD COLUMN longitude FLOAT"))
            conn.commit()
            print(f"[migracion] columnas ok ({dialect})")
        except Exception as e:
            print(f"[migracion] aviso: {e}")


run_migrations()
from app.routers import auth_router, jobs_router, payments_router, ratings_router, users_router, admin_router, events_router, notifications_router, verification_router

# Sentry - monitoreo de errores en produccion
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

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

# Crear tablas
Base.metadata.create_all(bind=engine)

# Migración manual: agregar last_login_at si no existe (PostgreSQL)
from sqlalchemy import text, inspect
try:
    inspector = inspect(engine)
    cols = [c["name"] for c in inspector.get_columns("users")]
    if "last_login_at" not in cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE"))
            conn.commit()
            print("✓ Migración: last_login_at agregado a users")
except Exception as e:
    print(f"⚠️ Migración last_login_at omitida: {e}")

app = FastAPI(
    title="TurnoGO API",
    version="1.0.1",  # test persistencia PostgreSQL
)

# Middleware para mantener HTTPS detrás del proxy de Railway
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

# CORS
# CORS: permitir todos los orígenes para desarrollo y múltiples frontends
allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.0.0.101:3000",
    "https://freelance-web-beta.vercel.app",
    "https://freelance-web.vercel.app",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allow_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers (cada router ya tiene su prefix propio, excepto events)
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(payments_router)
app.include_router(ratings_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(events_router)
app.include_router(notifications_router)
app.include_router(verification_router)

# Servir archivos subidos (avatares)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
