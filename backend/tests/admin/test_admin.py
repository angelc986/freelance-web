"""
Admin endpoint tests — FASE 3A
Covers: access control, stats, users, disputes, wallet (10 tests)

Auth dependency: get_current_admin (app/services/auth.py)
Checks: current_user.is_admin == True
"""
import pytest


class TestAdminAccessControl:
    """Authorization: who can access admin endpoints."""

    def test_admin_access_stats(self, client, admin_token):
        """Admin can access dashboard stats."""
        resp = client.get("/api/v1/admin/stats", headers={
            "Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200

    def test_contractor_blocked_from_stats(self, client, contractor_token):
        """Non-admin contractor gets 403."""
        resp = client.get("/api/v1/admin/stats", headers={
            "Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 403

    def test_worker_blocked_from_stats(self, client, worker_token):
        """Non-admin worker gets 403."""
        resp = client.get("/api/v1/admin/stats", headers={
            "Authorization": f"Bearer {worker_token}"})
        assert resp.status_code == 403

    def test_no_token_rejected(self, client):
        """Request without Authorization header returns 403."""
        resp = client.get("/api/v1/admin/stats")
        assert resp.status_code in (401, 403)

    def test_invalid_token_rejected(self, client):
        """Bogus JWT returns 401."""
        resp = client.get("/api/v1/admin/stats", headers={
            "Authorization": "Bearer not.a.real.token"})
        assert resp.status_code == 401

    def test_contractor_blocked_from_users(self, client, contractor_token):
        """Contractor cannot list users."""
        resp = client.get("/api/v1/admin/users", headers={
            "Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 403


class TestAdminStats:
    """GET /admin/stats — platform dashboard."""

    def test_stats_structure(self, client, admin_token):
        """Stats response has expected keys."""
        resp = client.get("/api/v1/admin/stats", headers={
            "Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        data = resp.json()
        expected_keys = ["total_users", "total_workers", "total_jobs",
                         "active_jobs", "disputed_jobs", "total_volume_usdt"]
        for key in expected_keys:
            assert key in data, f"Missing key: {key}"


class TestAdminUsers:
    """GET /admin/users — user management list."""

    def test_list_users_paginated(self, client, admin_token):
        """Returns paginated user list with expected wrapper keys."""
        resp = client.get("/api/v1/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert isinstance(data["users"], list)


class TestAdminDisputes:
    """GET /admin/disputes — dispute management."""

    def test_list_disputes(self, client, admin_token):
        """Returns paginated dispute list (may be empty)."""
        resp = client.get("/api/v1/admin/disputes", headers={
            "Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
        assert "disputes" in data
        assert isinstance(data["disputes"], list)


class TestAdminWallet:
    """GET /admin/wallet — system wallet info."""

    def test_wallet_info(self, client, admin_token):
        """Returns system wallet address and balance data."""
        resp = client.get("/api/v1/admin/wallet", headers={
            "Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert "system_wallet" in data
        assert "balance" in data
        assert "total_deposits" in data
        assert "total_withdrawals" in data


class TestAdminUserDetail:
    """GET /admin/users/{id}."""

    def test_user_detail(self, client, admin_token, contractor_token):
        # Get contractor id
        me = client.get("/api/v1/auth/me",
            headers={"Authorization": f"Bearer {contractor_token}"})
        uid = me.json()["id"]

        resp = client.get(f"/api/v1/admin/users/{uid}",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        assert resp.json()["id"] == uid

    def test_user_detail_requires_admin(self, client, contractor_token):
        me = client.get("/api/v1/auth/me",
            headers={"Authorization": f"Bearer {contractor_token}"})
        uid = me.json()["id"]

        resp = client.get(f"/api/v1/admin/users/{uid}",
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 403


class TestAdminTransactions:
    """GET /admin/transactions."""

    def test_transactions_admin_only(self, client, admin_token):
        resp = client.get("/api/v1/admin/transactions",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200

    def test_transactions_contractor_blocked(self, client, contractor_token):
        resp = client.get("/api/v1/admin/transactions",
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 403


class TestAdminAnalytics:
    """GET /admin/analytics."""

    def test_analytics_admin(self, client, admin_token):
        resp = client.get("/api/v1/admin/analytics",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200


class TestAdminUserStatus:
    """PATCH /admin/users/{id}/status."""

    def test_toggle_status_admin(self, client, admin_token, contractor_token):
        me = client.get("/api/v1/auth/me",
            headers={"Authorization": f"Bearer {contractor_token}"})
        uid = me.json()["id"]

        resp = client.patch(f"/api/v1/admin/users/{uid}/status?is_active=false",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200

    def test_toggle_status_requires_admin(self, client, contractor_token):
        me = client.get("/api/v1/auth/me",
            headers={"Authorization": f"Bearer {contractor_token}"})
        uid = me.json()["id"]

        resp = client.patch(f"/api/v1/admin/users/{uid}/status?is_active=false",
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 403
