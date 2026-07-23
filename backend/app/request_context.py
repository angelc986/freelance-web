"""
Per-request context — thread-safe via contextvars (async-compatible).

Usage:
    from app.request_context import set_request_id, get_request_id

    # In middleware:
    set_request_id("abc-123")

    # Anywhere downstream:
    rid = get_request_id()  # "abc-123"
"""

import uuid
from contextvars import ContextVar

_request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def generate_request_id() -> str:
    """Generate a short request ID (8-char hex UUID)."""
    return uuid.uuid4().hex[:8]


def set_request_id(request_id: str) -> None:
    """Set the request_id for the current async context."""
    _request_id_var.set(request_id)


def get_request_id() -> str:
    """Get the request_id for the current async context, or empty string."""
    return _request_id_var.get()
