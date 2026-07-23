"""
Centralized configuration — single source of truth for all settings.

All settings are read from environment variables (via os.getenv).
In development, python-dotenv loads .env automatically.
In production (Railway), environment variables are injected directly.

⚠️  Never hardcode secrets here. Defaults are for non-sensitive values only.
"""

import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

# ── Blocklist of insecure SECRET_KEY values ──
_INSECURE_SECRET_KEYS = {
    "",
    "changeme",
    "secret",
    "default",
    "super-secret-key-change-in-production",
    "***",
    "your-secret-key",
    "test",
}


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Freelance App API"
    APP_VERSION: str = "0.2.0"
    APP_URL: str = os.getenv("APP_URL", "")
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./freelance.db")

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # Polygon / Blockchain
    SYSTEM_WALLET_ADDRESS: str = os.getenv("SYSTEM_WALLET_ADDRESS", "")
    SYSTEM_WALLET_PRIVATE_KEY: str = os.getenv("SYSTEM_WALLET_PRIVATE_KEY", "")
    POLYGON_RPC_URL: str = os.getenv("POLYGON_RPC_URL", "https://rpc-amoy.polygon.technology")
    USDT_CONTRACT_ADDRESS: str = os.getenv("USDT_CONTRACT_ADDRESS", "")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    # Security
    MIN_CONFIRMATIONS: int = 12
    MAX_WITHDRAWALS_PER_DAY: int = 3
    LARGE_TX_THRESHOLD: float = 100.0

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

    # Didit Identity Verification
    DIDIT_API_KEY: str = os.getenv("DIDIT_API_KEY", "")
    DIDIT_WEBHOOK_SECRET: str = os.getenv("DIDIT_WEBHOOK_SECRET", "")
    DIDIT_WORKFLOW_ID: str = os.getenv("DIDIT_WORKFLOW_ID", "")

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Webhooks
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "")
    WEBHOOK_ALLOWED_IPS: str = os.getenv("WEBHOOK_ALLOWED_IPS", "")  # comma-separated

    # Sentry
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

    # Email (SendGrid / Resend / SMTP)
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")

    # Web Push (VAPID)
    VAPID_PRIVATE_KEY: str = os.getenv("VAPID_PRIVATE_KEY", "")
    VAPID_PUBLIC_KEY: str = os.getenv("VAPID_PUBLIC_KEY", "")

    def validate_secret_key(self):
        """Validate SECRET_KEY is not insecure. Called at startup."""
        key = (self.SECRET_KEY or "").strip()
        if not key:
            raise RuntimeError(
                "\n"
                "====================================================\n"
                "*** ERROR: SECRET_KEY is empty                    |\n"
                "====================================================\n"
                "|  Generate a secure key:                           |\n"
                "|                                                   |\n"
                '|    python -c "import secrets;                     |\n'
                '|      print(secrets.token_hex(64))"               |\n'
                "|                                                   |\n"
                "|  Then set it as an environment variable:          |\n"
                "|    SECRET_KEY=<generated-key>                     |\n"
                "|                                                   |\n"
                "|  Railway: Add SECRET_KEY in Variables tab         |\n"
                "|  Local:   Add to .env file                        |\n"
                "====================================================\n"
            )
        if key.lower() in _INSECURE_SECRET_KEYS or key in _INSECURE_SECRET_KEYS:
            raise RuntimeError(
                "\n"
                "====================================================\n"
                "*** ERROR: SECRET_KEY is using a default/insecure |\n"
                "====================================================\n"
                "|  Generate a secure key:                           |\n"
                "|                                                   |\n"
                '|    python -c "import secrets;                     |\n'
                '|      print(secrets.token_hex(64))"               |\n'
                "|                                                   |\n"
                "|  Then set it as an environment variable:          |\n"
                "|    SECRET_KEY=<generated-key>                     |\n"
                "|                                                   |\n"
                "|  Railway: Add SECRET_KEY in Variables tab         |\n"
                "|  Local:   Add to .env file                        |\n"
                "====================================================\n"
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    # Validate on first load (cached, so runs once)
    settings.validate_secret_key()
    return settings
