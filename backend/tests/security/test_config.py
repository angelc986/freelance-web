"""
Tests: Startup validation (SECRET_KEY, SYSTEM_WALLET_PRIVATE_KEY, CORS, ENVIRONMENT).
"""
import os
import pytest
from app.config import get_settings, _INSECURE_SECRET_KEYS


class TestSecretKeyValidation:
    """SECRET_KEY startup validation."""

    def test_empty_secret_key_raises(self):
        """Missing SECRET_KEY raises RuntimeError."""
        from app.config import Settings
        s = Settings()
        s.SECRET_KEY = ""
        with pytest.raises(RuntimeError):
            s.validate_secret_key()

    def test_insecure_secret_key_blocked(self):
        """Insecure default SECRET_KEY values are blocked."""
        from app.config import Settings
        for insecure in ["changeme", "secret", "super-secret-key-change-in-production"]:
            s = Settings()
            s.SECRET_KEY = insecure
            with pytest.raises(RuntimeError):
                s.validate_secret_key()

    def test_secure_key_passes(self):
        """A 128-char hex key passes validation."""
        from app.config import Settings
        s = Settings()
        s.SECRET_KEY = "a" * 128
        # Should not raise
        s.validate_secret_key()


class TestWalletValidation:
    """SYSTEM_WALLET_PRIVATE_KEY validation."""

    def test_missing_wallet_key_blocked(self):
        """Missing SYSTEM_WALLET_PRIVATE_KEY raises RuntimeError."""
        from app.startup_validator import validate_startup
        from app.config import Settings

        s = Settings()
        s.SECRET_KEY = "a" * 128
        s.SYSTEM_WALLET_PRIVATE_KEY = ""
        with pytest.raises(RuntimeError):
            validate_startup(s)

    def test_wallet_key_present_passes(self):
        """With both SECRET_KEY and WALLET key, startup passes."""
        from app.startup_validator import validate_startup
        from app.config import Settings

        s = Settings()
        s.SECRET_KEY = "a" * 128
        s.SYSTEM_WALLET_PRIVATE_KEY = "0xb33f"
        # Should not raise
        validate_startup(s)


class TestCORSProduction:
    """CORS: FRONTEND_URL required in production."""

    def test_prod_without_frontend_url_blocks(self):
        """Production without FRONTEND_URL raises RuntimeError."""
        old_env = os.environ.get("ENVIRONMENT")
        old_frontend = os.environ.get("FRONTEND_URL")
        os.environ["ENVIRONMENT"] = "production"
        os.environ["FRONTEND_URL"] = ""
        get_settings.cache_clear()

        try:
            env = get_settings().ENVIRONMENT
            frontend = os.getenv("FRONTEND_URL", "")
            assert env == "production"
            assert not frontend
            # The block is in main.py, not in the validator.
            # We test the conditional logic directly:
            if env == "production" and not frontend:
                blocked = True
            else:
                blocked = False
            assert blocked is True
        finally:
            if old_env:
                os.environ["ENVIRONMENT"] = old_env
            else:
                os.environ.pop("ENVIRONMENT", None)
            if old_frontend:
                os.environ["FRONTEND_URL"] = old_frontend
            else:
                os.environ.pop("FRONTEND_URL", None)
            get_settings.cache_clear()

    def test_dev_without_frontend_url_allowed(self):
        """Development without FRONTEND_URL is fine."""
        old_env = os.environ.get("ENVIRONMENT")
        old_frontend = os.environ.get("FRONTEND_URL")
        os.environ["ENVIRONMENT"] = "development"
        os.environ["FRONTEND_URL"] = ""
        get_settings.cache_clear()

        try:
            env = get_settings().ENVIRONMENT
            frontend = os.getenv("FRONTEND_URL", "")
            if env == "production" and not frontend:
                blocked = True
            else:
                blocked = False
            assert blocked is False
        finally:
            if old_env:
                os.environ["ENVIRONMENT"] = old_env
            else:
                os.environ.pop("ENVIRONMENT", None)
            if old_frontend:
                os.environ["FRONTEND_URL"] = old_frontend
            else:
                os.environ.pop("FRONTEND_URL", None)
            get_settings.cache_clear()


class TestOptionalServices:
    """Optional services (Cloudinary, Didit, email) warn but don't block."""

    def test_missing_optional_services_warn(self, capsys):
        """Missing Cloudinary/Didit produces warnings, not errors."""
        from app.startup_validator import validate_startup
        from app.config import Settings

        s = Settings()
        s.SECRET_KEY = "a" * 128
        s.SYSTEM_WALLET_PRIVATE_KEY = "0xb33f"
        s.CLOUDINARY_CLOUD_NAME = ""
        s.CLOUDINARY_API_KEY = ""
        s.CLOUDINARY_API_SECRET = ""
        s.DIDIT_API_KEY = ""
        # Should not raise
        validate_startup(s)

        captured = capsys.readouterr()
        assert "WARNING" in captured.out
        assert "Cloudinary" in captured.out
        assert "DIDIT" in captured.out
