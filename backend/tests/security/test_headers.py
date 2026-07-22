"""
Tests: Security headers in HTTP responses.
"""
import os
import pytest
from app.config import get_settings


class TestSecurityHeaders:
    """Verify security headers are present in responses."""

    def test_nosniff_header(self, client):
        """X-Content-Type-Options: nosniff is present."""
        resp = client.get("/api/v1/health")
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"

    def test_frame_options_deny(self, client):
        """X-Frame-Options: DENY is present."""
        resp = client.get("/api/v1/health")
        assert resp.headers.get("X-Frame-Options") == "DENY"

    def test_referrer_policy(self, client):
        """Referrer-Policy is set."""
        resp = client.get("/api/v1/health")
        assert "strict-origin" in resp.headers.get("Referrer-Policy", "")

    def test_permissions_policy(self, client):
        """Permissions-Policy restricts camera/mic/geolocation."""
        resp = client.get("/api/v1/health")
        pp = resp.headers.get("Permissions-Policy", "")
        assert "camera=()" in pp
        assert "microphone=()" in pp
        assert "geolocation=()" in pp

    def test_hsts_in_development(self, client):
        """HSTS is NOT present in development."""
        resp = client.get("/api/v1/health")
        assert "Strict-Transport-Security" not in resp.headers

    def test_headers_on_authenticated_endpoint(self, client, contractor_token):
        """Security headers are on protected endpoints too."""
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {contractor_token}",
        })
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"

    def test_headers_on_error_response(self, client):
        """Security headers are present even on error responses."""
        resp = client.get("/api/v1/auth/me")  # No token = 401
        assert resp.headers.get("X-Frame-Options") == "DENY"
