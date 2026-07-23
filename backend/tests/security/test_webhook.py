"""
Tests: Webhook security module — HMAC, timestamp, nonce, replay, rate limit, IP whitelist.
"""

import hashlib
import hmac
import time
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services.webhook_security import (
    _nonce_store,
    _rate_limits,
    validate_webhook,
)

WEBHOOK_SECRET = "test-webhook-secret-12345"


def _make_request(
    body: bytes = b'{"amount": 100}',
    headers: dict | None = None,
    client_host: str = "127.0.0.1",
) -> AsyncMock:
    """Create a mock FastAPI Request with given body and headers."""
    req = AsyncMock()
    req.body = AsyncMock(return_value=body)
    req.headers = headers or {}
    req.client = MagicMock()
    req.client.host = client_host
    return req


def _make_valid_headers(secret: str, body: bytes) -> dict:
    """Generate valid webhook security headers."""
    now = int(time.time())
    nonce = hashlib.sha256(f"{now}".encode()).hexdigest()[:16]
    payload = f"{now}.{nonce}.{body.decode('utf-8')}".encode()
    sig = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return {
        "X-Webhook-Timestamp": str(now),
        "X-Webhook-Nonce": nonce,
        "X-Webhook-Signature": f"sha256={sig}",
    }


class TestWebhookHMAC:
    """HMAC signature validation."""

    def setup_method(self):
        _nonce_store.clear()
        _rate_limits.clear()

    @pytest.mark.asyncio
    async def test_valid_signature_accepted(self):
        """Request with valid HMAC signature passes validation."""
        body = b'{"amount": 100}'
        headers = _make_valid_headers(WEBHOOK_SECRET, body)
        req = _make_request(body=body, headers=headers)
        # Should not raise
        await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_hmac")

    @pytest.mark.asyncio
    async def test_invalid_signature_rejected(self):
        """Request with wrong HMAC is rejected with 401."""
        body = b'{"amount": 100}'
        headers = _make_valid_headers(WEBHOOK_SECRET, body)
        headers["X-Webhook-Signature"] = "sha256=deadbeef"
        req = _make_request(body=body, headers=headers)
        with pytest.raises(HTTPException) as exc:
            await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_hmac")
        assert exc.value.status_code == 401

    @pytest.mark.asyncio
    async def test_missing_signature_rejected(self):
        """Request with no signature header is rejected with 400."""
        body = b'{"amount": 100}'
        headers = _make_valid_headers(WEBHOOK_SECRET, body)
        del headers["X-Webhook-Signature"]
        req = _make_request(body=body, headers=headers)
        with pytest.raises(HTTPException) as exc:
            await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_hmac")
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_wrong_signature_format_rejected(self):
        """Signature without 'sha256=' prefix is rejected."""
        body = b'{"amount": 100}'
        headers = _make_valid_headers(WEBHOOK_SECRET, body)
        headers["X-Webhook-Signature"] = "deadbeef"
        req = _make_request(body=body, headers=headers)
        with pytest.raises(HTTPException) as exc:
            await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_hmac")
        assert exc.value.status_code == 400


class TestWebhookTimestamp:
    """Timestamp freshness validation."""

    def setup_method(self):
        _nonce_store.clear()
        _rate_limits.clear()

    @pytest.mark.asyncio
    async def test_fresh_timestamp_accepted(self):
        """Current timestamp passes validation."""
        body = b'{"amount": 100}'
        headers = _make_valid_headers(WEBHOOK_SECRET, body)
        req = _make_request(body=body, headers=headers)
        await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_ts")

    @pytest.mark.asyncio
    async def test_expired_timestamp_rejected(self):
        """Timestamp older than 5 minutes is rejected."""
        body = b'{"amount": 100}'
        now = int(time.time())
        old_ts = now - 301  # 5 min + 1 sec
        nonce = hashlib.sha256(f"{old_ts}".encode()).hexdigest()[:16]
        payload = f"{old_ts}.{nonce}.{body.decode('utf-8')}".encode()
        sig = hmac.new(WEBHOOK_SECRET.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        headers = {
            "X-Webhook-Timestamp": str(old_ts),
            "X-Webhook-Nonce": nonce,
            "X-Webhook-Signature": f"sha256={sig}",
        }
        req = _make_request(body=body, headers=headers)
        with pytest.raises(HTTPException) as exc:
            await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_ts")
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_missing_timestamp_rejected(self):
        """No timestamp header is rejected."""
        body = b'{"amount": 100}'
        headers = _make_valid_headers(WEBHOOK_SECRET, body)
        del headers["X-Webhook-Timestamp"]
        req = _make_request(body=body, headers=headers)
        with pytest.raises(HTTPException) as exc:
            await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_ts")
        assert exc.value.status_code == 400


class TestWebhookNonce:
    """Nonce uniqueness / replay protection."""

    def setup_method(self):
        """Clear nonce store before each test."""
        _nonce_store.clear()
        _rate_limits.clear()

    @pytest.mark.asyncio
    async def test_reused_nonce_rejected(self):
        """Same nonce used twice is rejected (replay protection)."""
        body = b'{"amount": 100}'
        headers = _make_valid_headers(WEBHOOK_SECRET, body)
        req1 = _make_request(body=body, headers=headers)
        req2 = _make_request(body=body, headers=headers)

        await validate_webhook(req1, WEBHOOK_SECRET, endpoint_id="test_nonce")
        with pytest.raises(HTTPException) as exc:
            await validate_webhook(req2, WEBHOOK_SECRET, endpoint_id="test_nonce")
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_different_nonces_accepted(self):
        """Different nonces are accepted."""
        body = b'{"amount": 100}'
        h1 = _make_valid_headers(WEBHOOK_SECRET, body)
        # Slightly different timestamp = different nonce
        time.sleep(1.1)
        h2 = _make_valid_headers(WEBHOOK_SECRET, body)
        assert h1["X-Webhook-Nonce"] != h2["X-Webhook-Nonce"]

        await validate_webhook(
            _make_request(body=body, headers=h1), WEBHOOK_SECRET, endpoint_id="test_nonce"
        )
        await validate_webhook(
            _make_request(body=body, headers=h2), WEBHOOK_SECRET, endpoint_id="test_nonce"
        )


class TestWebhookRateLimit:
    """Rate limiting: 2 requests per minute."""

    def setup_method(self):
        _nonce_store.clear()
        _rate_limits.clear()

    @pytest.mark.asyncio
    async def test_two_requests_allowed(self):
        """Two requests within window are allowed (different nonces)."""
        body = b'{"amount": 100}'
        h1 = _make_valid_headers(WEBHOOK_SECRET, body)
        # Wait to get different timestamps (and therefore different nonces)
        import time as _time

        _time.sleep(1.1)
        h2 = _make_valid_headers(WEBHOOK_SECRET, body)
        assert h1["X-Webhook-Nonce"] != h2["X-Webhook-Nonce"]

        await validate_webhook(
            _make_request(body=body, headers=h1), WEBHOOK_SECRET, endpoint_id="test_rate"
        )
        await validate_webhook(
            _make_request(body=body, headers=h2), WEBHOOK_SECRET, endpoint_id="test_rate"
        )


class TestWebhookIPWhitelist:
    """IP whitelist validation."""

    def setup_method(self):
        _nonce_store.clear()
        _rate_limits.clear()

    @pytest.mark.asyncio
    async def test_allowed_ip_accepted(self):
        """IP in whitelist passes."""
        # Temporarily set allowed IPs
        import app.services.webhook_security as ws

        old_ips = ws.settings.WEBHOOK_ALLOWED_IPS
        ws.settings.WEBHOOK_ALLOWED_IPS = "10.0.0.1,192.168.1.1"
        try:
            body = b'{"amount": 100}'
            headers = _make_valid_headers(WEBHOOK_SECRET, body)
            req = _make_request(body=body, headers=headers, client_host="10.0.0.1")
            await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_ip")
        finally:
            ws.settings.WEBHOOK_ALLOWED_IPS = old_ips

    @pytest.mark.asyncio
    async def test_denied_ip_rejected(self):
        """IP not in whitelist is rejected with 403."""
        import app.services.webhook_security as ws

        old_ips = ws.settings.WEBHOOK_ALLOWED_IPS
        ws.settings.WEBHOOK_ALLOWED_IPS = "10.0.0.1"
        try:
            body = b'{"amount": 100}'
            headers = _make_valid_headers(WEBHOOK_SECRET, body)
            req = _make_request(body=body, headers=headers, client_host="192.168.1.100")
            with pytest.raises(HTTPException) as exc:
                await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_ip")
            assert exc.value.status_code == 403
        finally:
            ws.settings.WEBHOOK_ALLOWED_IPS = old_ips

    @pytest.mark.asyncio
    async def test_no_whitelist_allows_all(self):
        """When WEBHOOK_ALLOWED_IPS is empty, all IPs pass."""
        import app.services.webhook_security as ws

        old_ips = ws.settings.WEBHOOK_ALLOWED_IPS
        ws.settings.WEBHOOK_ALLOWED_IPS = ""
        try:
            body = b'{"amount": 100}'
            headers = _make_valid_headers(WEBHOOK_SECRET, body)
            req = _make_request(body=body, headers=headers, client_host="203.0.113.42")
            await validate_webhook(req, WEBHOOK_SECRET, endpoint_id="test_ip")
        finally:
            ws.settings.WEBHOOK_ALLOWED_IPS = old_ips
