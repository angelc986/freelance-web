"""
Deposit tests — FASE 3B
Covers: role restriction, missing payload, amount validation, auth
Note: Deposit success requires real blockchain tx_hash verification
      (not testable in isolation without mocking web3.py).
"""
import pytest


class TestDepositAccess:
    """POST /api/v1/payments/deposit — authorization and validation."""

    def test_worker_cannot_deposit(self, client, worker_token):
        """Only contractors can deposit (403 for workers)."""
        resp = client.post("/api/v1/payments/deposit", json={
            "amount": 100.0,
            "tx_hash": "0x" + "a" * 64,
        }, headers={"Authorization": f"Bearer {worker_token}"})
        assert resp.status_code == 403

    def test_deposit_without_auth_rejected(self, client):
        """No token → rejected."""
        resp = client.post("/api/v1/payments/deposit", json={
            "amount": 100.0,
            "tx_hash": "0x" + "a" * 64,
        })
        assert resp.status_code in (401, 403)

    def test_deposit_missing_tx_hash(self, client, contractor_token):
        """Missing tx_hash field returns 422 (validation error)."""
        resp = client.post("/api/v1/payments/deposit", json={
            "amount": 100.0,
        }, headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 422

    def test_deposit_missing_amount(self, client, contractor_token):
        """Missing amount field returns 422."""
        resp = client.post("/api/v1/payments/deposit", json={
            "tx_hash": "0x" + "a" * 64,
        }, headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 422

    def test_deposit_empty_payload(self, client, contractor_token):
        """Empty body returns 422."""
        resp = client.post("/api/v1/payments/deposit", json={},
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 422
