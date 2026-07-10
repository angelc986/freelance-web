from fastapi import FastAPI
from app.database import engine, Base
from app.routers import auth_router, jobs_router

# Crear todas las tablas de la BD al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Incluir routers
app.include_router(auth_router)
app.include_router(jobs_router)

@app.get("/api/v1/health")
def health():
    return {"status": "ok"}