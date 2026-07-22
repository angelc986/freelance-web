"""
Webhook Security Module — Cryptographic + Temporal validation for webhook endpoints.

Provides:
  - HMAC-SHA256 signature validation
  - Timestamp freshness check (default 5 min window)
  - Nonce tracking (replay protection)
  - IP whitelist (optional, configured via WEBHOOK_ALLOWED_IPS)
  - Rate limiting (2 req/min per webhook endpoint)

Usage:
    from app.services.webhook_security import validate_webhook
    from fastapi import Request

    @router.post("/webhook/deposit")
    async def deposit_webhook(request: Request):
        await validate_webhook(request, webhook_secret, endpoint_id="deposit")
        # ... process webhook ...
"""

import hashlib
import hmac
import time
from collections import defaultdict
from typing import Optional
from fastapi import HTTPException, Request
from app.config import get_settings

settings = get_settings()

# -- In-memory nonce store with expiration --
# Key: nonce, Value: expiry timestamp
# Automatically pruned on each validation call.
_nonce_store: dict[str, float] = {}

# -- Rate limiter per endpoint (in-memory, per-process) --
# Key: endpoint_id, Value: list of request timestamps
_rate_limits: dict[str, list[float]] = defaultdict(list)
_MAX_REQUESTS = 2  # per endpoint
_RATE_WINDOW_SECONDS = 60  # 1 minute

# -- Timestamp window --
_MAX_TIMESTAMP_AGE_SECONDS = 300  # 5 minutes


def _prune_nonces(now: float) -> None:
    """Remove expired nonces from the store."""
    expired = [n for n, exp in _nonce_store.items() if exp < now]
    for n in expired:
        del _nonce_store[n]


def _prune_rate_limits(endpoint_id: str, now: float) -> None:
    """Remove expired rate-limit entries."""
    window_start = now - _RATE_WINDOW_SECONDS
    _rate_limits[endpoint_id] = [
        ts for ts in _rate_limits[endpoint_id] if ts > window_start
    ]


async def validate_webhook(
    request: Request,
    webhook_secret: str,
    endpoint_id: str = "default",
    max_age_seconds: int = _MAX_TIMESTAMP_AGE_SECONDS,
) -> None:
    """
    Validate an incoming webhook request.

    Checks performed (in order):
      1. IP whitelist (if WEBHOOK_ALLOWED_IPS is configured)
      2. Rate limit (2 req/min)
      3. Timestamp freshness (default 5 min)
      4. Nonce uniqueness (replay protection)
      5. HMAC-SHA256 signature

    Args:
        request: FastAPI Request object
        webhook_secret: Shared secret for HMAC validation
        endpoint_id: Unique identifier for rate-limit scoping
        max_age_seconds: Maximum age of timestamp (default 300s)

    Raises:
        HTTPException(401/429/400) on validation failure
    """
    now = time.time()

    # 1. IP Whitelist (optional)
    allowed_ips = (settings.WEBHOOK_ALLOWED_IPS or "").strip()
    if allowed_ips:
        client_ip = request.client.host if request.client else "unknown"
        allowed = [ip.strip() for ip in allowed_ips.split(",") if ip.strip()]
        if client_ip not in allowed:
            raise HTTPException(
                status_code=403,
                detail=f"IP {client_ip} not in allowed webhook IPs",
            )

    # 2. Rate limit
    _prune_rate_limits(endpoint_id, now)
    if len(_rate_limits[endpoint_id]) >= _MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Webhook rate limit exceeded ({_MAX_REQUESTS} req/min)",
        )
    _rate_limits[endpoint_id].append(now)

    # Read body
    body = await request.body()
    body_str = body.decode("utf-8") if body else ""

    # 3. Timestamp validation
    timestamp_header = request.headers.get("X-Webhook-Timestamp", "")
    if not timestamp_header:
        raise HTTPException(status_code=400, detail="Missing X-Webhook-Timestamp header")

    try:
        timestamp = int(timestamp_header)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Webhook-Timestamp")

    if abs(now - timestamp) > max_age_seconds:
        raise HTTPException(
            status_code=400,
            detail=f"Webhook timestamp too old (max {max_age_seconds}s)",
        )
    if timestamp > now + 30:
        raise HTTPException(status_code=400, detail="Webhook timestamp is in the future")

    # 4. Nonce / Replay protection
    nonce = request.headers.get("X-Webhook-Nonce", "")
    if not nonce:
        raise HTTPException(status_code=400, detail="Missing X-Webhook-Nonce header")

    _prune_nonces(now)
    if nonce in _nonce_store:
        raise HTTPException(status_code=400, detail="Duplicate webhook request (nonce reused)")

    # Store nonce with TTL = max_age * 2 (keep a bit longer than the window)
    _nonce_store[nonce] = now + (max_age_seconds * 2)

    # 5. HMAC signature validation
    signature_header = request.headers.get("X-Webhook-Signature", "")
    if not signature_header:
        raise HTTPException(status_code=400, detail="Missing X-Webhook-Signature header")

    # Expected format: "sha256=<hex>"
    if not signature_header.startswith("sha256="):
        raise HTTPException(status_code=400, detail="Invalid signature format. Expected: sha256=<hex>")

    received_sig = signature_header[7:]  # Remove "sha256=" prefix

    # Compute expected signature: HMAC-SHA256(webhook_secret, "{timestamp}.{nonce}.{body}")
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured on server")

    payload = f"{timestamp}.{nonce}.{body_str}".encode("utf-8")
    expected_sig = hmac.new(
        webhook_secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()

    # Constant-time comparison
    if not hmac.compare_digest(expected_sig, received_sig):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
