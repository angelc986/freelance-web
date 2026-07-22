"""Tests: Dev-token bypass gating by ENVIRONMENT."""
import os
import pytest
from app.config import get_settings
from app.models.user import User
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestDevTokenDevelopment:
    """In development, dev- tokens are accepted as mock bypasses."""

    @pytest.fixture(autouse=True)
    def set_dev_env(self):
        old = os.environ.get("ENVIRONMENT")
        os.environ["ENVIRONMENT"] = "development"
        get_settings.cache_clear()
        yield
        if old:
            os.environ["ENVIRONMENT"] = old
        else:
            os.environ.pop("ENVIRONMENT", None)
        get_settings.cache_clear()

    def test_dev_token_accepted_in_dev(self, client, db):
        """Protected endpoints using get_current_user() accept dev-token in dev."""
        user = User(
            email="devtokentest@test.com",
            password_hash=pwd.hash("Test123!"),
            full_name="Dev Token Test",
            phone="+5841450001",
            cedula="V-50001",
            role="worker",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # /payments/balance uses Depends(get_current_user) which has dev-token guard
        resp = client.get("/api/v1/payments/balance", headers={
            "Authorization": f"Bearer dev-{user.id}",
        })
        assert resp.status_code == 200

    def test_protected_route_accepts_dev_token(self, client, db):
        """Any protected route should accept dev-token in development."""
        user = User(
            email="devtoken2@test.com",
            password_hash=pwd.hash("Test123!"),
            full_name="Dev Token 2",
            phone="+5841450002",
            cedula="V-50002",
            role="worker",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        resp = client.get("/api/v1/payments/balance", headers={
            "Authorization": f"Bearer dev-{user.id}",
        })
        assert resp.status_code == 200

    def test_invalid_dev_token_format_rejected(self, client):
        """dev- without integer user_id returns 401."""
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer dev-abc",
        })
        assert resp.status_code == 401


class TestDevTokenProduction:
    """In production, any dev- token is rejected."""

    @pytest.fixture(autouse=True)
    def set_prod_env(self):
        old = os.environ.get("ENVIRONMENT")
        os.environ["ENVIRONMENT"] = "production"
        get_settings.cache_clear()
        yield
        if old:
            os.environ["ENVIRONMENT"] = old
        else:
            os.environ.pop("ENVIRONMENT", None)
        get_settings.cache_clear()

    def test_dev_token_rejected_in_prod(self, client):
        """dev- tokens are 401 on endpoints using get_current_user() in production."""
        resp = client.get("/api/v1/payments/balance", headers={
            "Authorization": "Bearer dev-1",
        })
        assert resp.status_code == 401

    def test_valid_jwt_still_works_in_prod(self, client, contractor_token):
        """Real JWT tokens still work fine in production."""
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {contractor_token}",
        })
        assert resp.status_code == 200
