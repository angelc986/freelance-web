from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter
from app.database import engine, Base
from app.routers import auth_router, jobs_router, payments_router, ratings_router, users_router, admin_router, events_router

# Crear todas las tablas de la BD al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Rate limiting — protege contra ataques de fuerza bruta
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — permitir requests desde el frontend (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.0.0.101:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(payments_router)
app.include_router(users_router)
app.include_router(ratings_router)
app.include_router(admin_router)
app.include_router(events_router)

@app.get("/api/v1/health")
@limiter.exempt
def health(request: Request):
    return {"status": "ok"}