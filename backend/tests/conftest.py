"""
Configuración de tests — drop_all + create_all por test.
"""
import pytest
import os

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
    limiter.enabled = False
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def _make_user(client, db, email, password, **extra):
    user = User(email=email, password_hash=pwd_context.hash(password), **extra)
    db.add(user)
    db.commit()
    db.refresh(user)
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


@pytest.fixture
def contractor_token(client, db):
    return _make_user(client, db, "contractor@test.com", "Test123!",
        full_name="Test Contractor", phone="+584141111111",
        cedula="V-11111111", role="contractor", balance=10000)


@pytest.fixture
def worker_token(client, db):
    return _make_user(client, db, "worker@test.com", "Test123!",
        full_name="Test Worker", phone="+584142222222",
        cedula="V-22222222", role="worker")


@pytest.fixture
def verified_user_token(client, db):
    return _make_user(client, db, "verified@test.com", "Test123!",
        full_name="Verified User", phone="+584143000000",
        cedula="V-30000000", role="worker", email_verified=True)


@pytest.fixture
def unverified_user_token(client, db):
    return _make_user(client, db, "unverified@test.com", "Test123!",
        full_name="Unverified User", phone="+584144000000",
        cedula="V-40000000", role="worker", email_verified=False)


@pytest.fixture
def admin_token(client, db):
    return _make_user(client, db, "admin@test.com", "Test123!",
        full_name="Test Admin", phone="+584145555555",
        cedula="V-55555555", role="contractor",
        is_admin=True, email_verified=True)
