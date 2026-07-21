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
                conn.execute(sa_text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_code VARCHAR(6)"))
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
from app.routers import auth_router, jobs_router, payments_router, ratings_router, users_router, admin_router, events_router, notifications_router, verification_router, push_subscriptions_router

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
    if "email_notifications" not in cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE"))
            conn.commit()
            print("✓ Migración: email_notifications agregado a users")
    if "push_subscription" not in cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN push_subscription TEXT"))
            conn.commit()
            print("✓ Migración: push_subscription agregado a users")

    # Migrar change_tokens: agregar new_wallet si no existe
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            cols = [c["name"] for c in inspector.get_columns("change_tokens")]
            if "new_wallet" not in cols:
                conn.execute(text("ALTER TABLE change_tokens ADD COLUMN new_wallet VARCHAR"))
                conn.commit()
                print("✓ Migración: new_wallet agregado a change_tokens")
    except Exception as e:
        print(f"⚠ Migración new_wallet omitida: {e}")

    # Migrar push_subscriptions legacy → nueva tabla
    try:
        with engine.connect() as conn:
            db_dialect = conn.dialect.name
            if db_dialect == "postgresql":
                table_rows = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'")).fetchall()
                table_names = [row[0] for row in table_rows]
            else:
                table_rows = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()
                table_names = [row[0] for row in table_rows]

            if "push_subscriptions" in table_names:
                rows = conn.execute(text("SELECT id, push_subscription FROM users WHERE push_subscription IS NOT NULL AND push_subscription != ''")).fetchall()
                migrated = 0
                for user_id, sub_json in rows:
                    try:
                        import json
                        sub = json.loads(sub_json)
                        endpoint = sub.get("endpoint", "")
                        keys = sub.get("keys", {})
                        auth = keys.get("auth", "")
                        p256dh = keys.get("p256dh", "")
                        if endpoint:
                            existing = conn.execute(text("SELECT id FROM push_subscriptions WHERE endpoint = :ep"), {"ep": endpoint}).fetchone()
                            if not existing:
                                conn.execute(
                                    text("INSERT INTO push_subscriptions (user_id, endpoint, auth, p256dh) VALUES (:uid, :ep, :auth, :p256dh)"),
                                    {"uid": user_id, "ep": endpoint, "auth": auth, "p256dh": p256dh}
                                )
                                migrated += 1
                    except Exception:
                        pass
                if migrated:
                    conn.commit()
                    print(f"✓ Migración: {migrated} push_subscriptions legacy migradas")
    except Exception as e:
        print(f"⚠️ Migración push_subscriptions omitida: {e}")

    # Migrar: held_balance, correction_count, correction_note, disputed_at, timeout_at, dispute_by
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            # users
            user_cols = [c["name"] for c in inspector.get_columns("users")]
            if "held_balance" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN held_balance DOUBLE PRECISION DEFAULT 0.0"))
                conn.commit()
                print("✓ Migración: held_balance agregado a users")
            # jobs
            job_cols = [c["name"] for c in inspector.get_columns("jobs")]
            for col, col_type in [
                ("correction_count", "INTEGER DEFAULT 0"),
                ("correction_note", "VARCHAR(1000)"),
                ("disputed_at", "TIMESTAMP WITH TIME ZONE"),
                ("timeout_at", "TIMESTAMP WITH TIME ZONE"),
                ("dispute_by", "VARCHAR(20)"),
            ]:
                if col not in job_cols:
                    conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col} {col_type}"))
                    conn.commit()
                    print(f"✓ Migración: {col} agregado a jobs")
    except Exception as e:
        print(f"⚠ Migración escrow/corrección omitida: {e}")
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
app.include_router(push_subscriptions_router)
app.include_router(verification_router)

# Servir archivos subidos (avatares)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
