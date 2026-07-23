"""
Withdraw tests — FASE 3B
Covers: success, insufficient balance, no wallet, amount validation, auth
"""

from app.models.user import User


class TestWithdraw:
    """POST /api/v1/payments/withdraw — withdrawal flows."""

    def test_withdraw_success(self, client, contractor_token, db):
        """User with balance and wallet can withdraw."""
        # Register wallet on contractor
        user = db.query(User).filter(User.email == "contractor@test.com").first()
        user.wallet_address = "0x1234567890abcdef1234567890abcdef12345678"
        user.balance = 500.0
        db.commit()

        resp = client.post(
            "/api/v1/payments/withdraw",
            json={
                "amount": 50.0,
                "to_address": "0x1234567890abcdef1234567890abcdef12345678",
            },
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "withdraw"
        assert data["amount"] == 50.0

    def test_withdraw_insufficient_balance(self, client, contractor_token, db):
        """Withdraw amount > balance is rejected."""
        user = db.query(User).filter(User.email == "contractor@test.com").first()
        user.wallet_address = "0x1234567890abcdef1234567890abcdef12345678"
        user.balance = 10.0
        db.commit()

        resp = client.post(
            "/api/v1/payments/withdraw",
            json={
                "amount": 50.0,
                "to_address": "0x1234567890abcdef1234567890abcdef12345678",
            },
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 400
        assert (
            "saldo insuficiente" in resp.json()["detail"].lower()
            or "insuficiente" in resp.json()["detail"].lower()
        )

    def test_withdraw_without_wallet_rejected(self, client, contractor_token, db):
        """User without registered wallet cannot withdraw."""
        user = db.query(User).filter(User.email == "contractor@test.com").first()
        user.balance = 500.0
        user.wallet_address = None  # No wallet
        db.commit()

        resp = client.post(
            "/api/v1/payments/withdraw",
            json={
                "amount": 50.0,
                "to_address": "0x1234567890abcdef1234567890abcdef12345678",
            },
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 400
        assert "wallet" in resp.json()["detail"].lower()

    def test_withdraw_below_minimum(self, client, contractor_token, db):
        """Withdraw below $1 minimum is rejected."""
        user = db.query(User).filter(User.email == "contractor@test.com").first()
        user.wallet_address = "0x1234567890abcdef1234567890abcdef12345678"
        user.balance = 500.0
        db.commit()

        resp = client.post(
            "/api/v1/payments/withdraw",
            json={
                "amount": 0.50,
                "to_address": "0x1234567890abcdef1234567890abcdef12345678",
            },
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 400

    def test_withdraw_without_auth_rejected(self, client):
        """No token → 403."""
        resp = client.post(
            "/api/v1/payments/withdraw",
            json={
                "amount": 50.0,
                "to_address": "0x1234567890abcdef1234567890abcdef12345678",
            },
        )
        assert resp.status_code in (401, 403)
