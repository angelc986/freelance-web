"""
Prometheus metrics for TurnoGO — HTTP requests, latency, errors, DB status.

Usage:
    from app.metrics import (
        http_requests_total,
        http_request_duration_seconds,
        http_errors_total,
        database_status,
    )
"""

from prometheus_client import Counter, Gauge, Histogram, Info, generate_latest

# ── HTTP Requests ──
http_requests_total = Counter(
    "turnogo_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

http_request_duration_seconds = Histogram(
    "turnogo_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

http_errors_total = Counter(
    "turnogo_http_errors_total",
    "Total HTTP errors",
    ["method", "endpoint", "status_class"],
)

# ── Database ──
database_status = Gauge(
    "turnogo_database_status",
    "Database connectivity: 1=ok, 0=unavailable",
)

# ── Service Info ──
app_info = Info("turnogo_app", "Application metadata")


def set_app_info(name: str, version: str, environment: str) -> None:
    """Set application metadata once at startup."""
    app_info.info(
        {
            "name": name,
            "version": version,
            "environment": environment,
        }
    )


def set_database_up() -> None:
    database_status.set(1)


def set_database_down() -> None:
    database_status.set(0)


def get_metrics() -> bytes:
    """Generate Prometheus-formatted metrics."""
    return generate_latest()
