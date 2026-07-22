"""
Configuración global de tests.
"""
import pytest
import os

# Modo test: desactivar rate limiting
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///./test_freelance.db"

from fastapi.testclient import TestClient
from app.main import app
from app.limiter import limiter
from app.database import SessionLocal, engine, Base
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(autouse=True)
def cleanup_db():
    """Limpia BD antes de cada test."""
    # Desactivar rate limiting
    limiter.enabled = False
    Base.metadata.create_all(bind=engine)
    yield
    db = SessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    db.close()


@pytest.fixture(scope="session")
def client():
    """Cliente HTTP compartido."""
    return TestClient(app)


@pytest.fixture
def db():
    """Conexión directa a BD."""
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def contractor_token(client):
    """Crea contractor y devuelve token. Inserta directo en BD."""
    db = SessionLocal()
    user = User(
        email="contractor@test.com",
        password_hash=pwd_context.hash("Test123!"),
        full_name="Test Contractor",
        phone="+584141111111",
        cedula="V-11111111",
        role="contractor",
        balance=10000,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    resp = client.post("/api/v1/auth/login", json={
        "email": "contractor@test.com",
        "password": "Test123!",
    })
    return resp.json()["access_token"]


@pytest.fixture
def worker_token(client):
    """Crea worker y devuelve token."""
    db = SessionLocal()
    user = User(
        email="worker@test.com",
        password_hash=pwd_context.hash("Test123!"),
        full_name="Test Worker",
        phone="+584142222222",
        cedula="V-22222222",
        role="worker",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    resp = client.post("/api/v1/auth/login", json={
        "email": "worker@test.com",
        "password": "Test123!",
    })
    return resp.json()["access_token"]


# ── Security test fixtures ──

@pytest.fixture
def verified_user_token(client, db):
    """Crea usuario con email verificado y devuelve token."""
    user = User(
        email="verified@test.com",
        password_hash=pwd_context.hash("Test123!"),
        full_name="Verified User",
        phone="+584143000000",
        cedula="V-30000000",
        role="worker",
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    resp = client.post("/api/v1/auth/login", json={
        "email": "verified@test.com",
        "password": "Test123!",
    })
    return resp.json()["access_token"]


@pytest.fixture
def unverified_user_token(client, db):
    """Crea usuario sin verificar email y devuelve token."""
    user = User(
        email="unverified@test.com",
        password_hash=pwd_context.hash("Test123!"),
        full_name="Unverified User",
        phone="+584144000000",
        cedula="V-40000000",
        role="worker",
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    resp = client.post("/api/v1/auth/login", json={
        "email": "unverified@test.com",
        "password": "Test123!",
    })
    return resp.json()["access_token"]
