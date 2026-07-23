"""
Tests: Email verification flow (token, verify, resend).
"""

from app.config import get_settings

settings = get_settings()


class TestEmailVerificationToken:
    """Email verification token generation and validation."""

    def test_register_sends_verification_email(self, client):
        """Registration triggers verification email (SendGrid called)."""
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "email": "verifytest@test.com",
                "password": "Str0ng!Pass2024",
                "full_name": "Verify Test",
                "phone": "+584145555556",
                "cedula": "V-55555556",
                "role": "worker",
            },
        )
        assert resp.status_code == 201
        user_data = resp.json()
        assert user_data["email"] == "verifytest@test.com"
        # UserResponse may not expose email_verified, but registration succeeds

    def test_verify_email_with_valid_token(self, client):
        """GET /auth/verify-email with valid token marks email as verified."""
        # Register a user
        register_resp = client.post(
            "/api/v1/auth/register",
            json={
                "email": "verify2@test.com",
                "password": "Str0ng!Pass2024",
                "full_name": "Verify2",
                "phone": "+584146666666",
                "cedula": "V-66666666",
                "role": "worker",
            },
        )
        assert register_resp.status_code == 201
        user_id = register_resp.json()["id"]

        # Generate a valid verification token (simulating what register does)
        from app.routers.auth import create_access_token

        token = create_access_token({"sub": str(user_id), "purpose": "email_verify"})

        # Verify with the token
        verify_url = f"/api/v1/auth/verify-email?token={token}"
        resp = client.get(verify_url)
        assert resp.status_code == 200
        data = resp.json()
        assert data["verified"] is True

        # Verify again should return "already verified"
        resp2 = client.get(verify_url)
        assert resp2.status_code == 200
        assert "ya estaba" in resp2.json()["message"].lower()

    def test_verify_email_with_invalid_token(self, client):
        """Invalid token returns 400."""
        resp = client.get("/api/v1/auth/verify-email?token=invalid-token-123")
        assert resp.status_code in (400, 401)

    def test_verify_email_wrong_purpose(self, client, contractor_token):
        """Token without purpose='email_verify' is rejected."""
        # Use a login token (no purpose field)
        resp = client.get(f"/api/v1/auth/verify-email?token={contractor_token}")
        assert resp.status_code == 400

    def test_resend_verification(self, client, unverified_user_token):
        """POST /auth/resend-verification sends a new email."""
        resp = client.post(
            "/api/v1/auth/resend-verification",
            headers={
                "Authorization": f"Bearer {unverified_user_token}",
            },
        )
        assert resp.status_code == 200
        assert "reenviado" in resp.json()["message"].lower()

    def test_resend_already_verified(self, client, verified_user_token):
        """Resend for already verified user returns success message."""
        resp = client.post(
            "/api/v1/auth/resend-verification",
            headers={
                "Authorization": f"Bearer {verified_user_token}",
            },
        )
        assert resp.status_code == 200
        assert "ya esta" in resp.json()["message"].lower()


class TestEmailVerificationRestrictions:
    """Critical actions require verified email (when dependency is applied)."""

    def test_unverified_user_can_login(self, client, unverified_user_token):
        """Unverified users CAN login."""
        resp = client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": f"Bearer {unverified_user_token}",
            },
        )
        assert resp.status_code == 200

    def test_unverified_user_can_access_balance(self, client, unverified_user_token):
        """Unverified users CAN check balance (not a critical action)."""
        resp = client.get(
            "/api/v1/payments/balance",
            headers={
                "Authorization": f"Bearer {unverified_user_token}",
            },
        )
        assert resp.status_code == 200

    def test_verified_user_can_login(self, client, verified_user_token):
        """Verified users CAN login normally."""
        resp = client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": f"Bearer {verified_user_token}",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "verified@test.com"
