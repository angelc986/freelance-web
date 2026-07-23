"""
Centralized logging configuration — JSON in production, text in dev.

Usage:
    from app.logging_config import get_logger
    logger = get_logger(__name__)
    logger.info("User created", extra={"user_id": 123})
"""

import logging
import os

from pythonjsonlogger import jsonlogger


class _SanitizingFormatter(logging.Formatter):
    """Strip sensitive fields from log records before formatting."""

    _SENSITIVE_KEYS = {
        "password",
        "password_hash",
        "token",
        "access_token",
        "refresh_token",
        "api_key",
        "secret_key",
        "private_key",
        "seed",
        "phrase",
        "credential",
        "authorization",
    }

    @classmethod
    def _sanitize(cls, record: logging.LogRecord) -> logging.LogRecord:
        """Remove sensitive data from record fields."""
        if hasattr(record, "msg") and isinstance(record.msg, str):
            for key in cls._SENSITIVE_KEYS:
                if key in record.msg.lower():
                    record.msg = record.msg.replace(key, "***")
        return record


class _SanitizingJsonFormatter(jsonlogger.JsonFormatter):
    """JSON formatter that redacts sensitive keys from extra fields."""

    _SENSITIVE_KEYS = {
        "password",
        "password_hash",
        "token",
        "access_token",
        "refresh_token",
        "api_key",
        "secret_key",
        "private_key",
        "seed",
        "phrase",
        "credential",
        "authorization",
        "key",
        "secret",
    }

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record["service"] = "turnogo-api"
        log_record["environment"] = os.getenv("ENVIRONMENT", "development")
        # Redact sensitive keys in extra fields
        for key in list(log_record.keys()):
            for sensitive in self._SENSITIVE_KEYS:
                if sensitive in key.lower():
                    log_record[key] = "***"


def configure_logging(level: str = "INFO", json_format: bool = False):
    """
    Configure root logger. Call once at startup.

    Args:
        level: DEBUG | INFO | WARNING | ERROR | CRITICAL
        json_format: True for production (JSON to stdout)
    """
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicates on reload
    root.handlers.clear()

    handler = logging.StreamHandler()
    handler.setLevel(getattr(logging, level.upper(), logging.INFO))

    if json_format:
        formatter: logging.Formatter = _SanitizingJsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%SZ",
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    handler.setFormatter(formatter)
    root.addHandler(handler)

    # Quiet noisy third-party loggers
    for noisy in ("web3", "urllib3", "eth_account", "httpcore", "httpx"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    return root


def get_logger(name: str) -> logging.Logger:
    """Get a logger for a module. Returns existing or creates new."""
    return logging.getLogger(name)
