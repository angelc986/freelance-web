"""
Balance & extended history tests
"""
import pytest


class TestBalance:
    """GET /api/v1/payments/balance."""

    def test_balance_structure(self, client, contractor_token):
        resp = client.get("/api/v1/payments/balance",
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert "balance" in data
        assert "held_balance" in data
        assert "available_balance" in data

    def test_balance_no_auth(self, client):
        resp = client.get("/api/v1/payments/balance")
        assert resp.status_code in (401, 403)


class TestHistoryAuth:
    """GET /api/v1/payments/history — access control."""

    def test_history_no_auth(self, client):
        resp = client.get("/api/v1/payments/history")
        assert resp.status_code in (401, 403)

    def test_history_empty_new_user(self, client, worker_token):
        resp = client.get("/api/v1/payments/history",
            headers={"Authorization": f"Bearer {worker_token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
