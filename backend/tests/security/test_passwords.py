"""
Tests: Password validation and common password blacklist.
"""
import pytest
from app.services.password_validator import (
    validate_password_strength,
    is_password_common,
)


class TestPasswordStrength:
    """Password complexity requirements: 8+ chars, upper, lower, digit, special."""

    def test_valid_password(self):
        """Strong password passes all checks."""
        assert validate_password_strength("OpenClaw2024!") is None

    def test_too_short(self):
        """Less than 8 characters is rejected."""
        err = validate_password_strength("Ab1!")
        assert err is not None
        assert "8 caracteres" in err.lower() or "8" in err

    def test_no_uppercase(self):
        """Missing uppercase letter is rejected."""
        err = validate_password_strength("openclaw2024!")
        assert err is not None
        assert "mayuscula" in err.lower()

    def test_no_lowercase(self):
        """Missing lowercase letter is rejected."""
        err = validate_password_strength("OPENCLAW2024!")
        assert err is not None
        assert "minuscula" in err.lower()

    def test_no_digit(self):
        """Missing number is rejected."""
        err = validate_password_strength("OpenClaw!!!!!")
        assert err is not None
        assert "numero" in err.lower()

    def test_no_special(self):
        """Missing special character is rejected."""
        err = validate_password_strength("OpenClaw2024")
        assert err is not None
        assert "especial" in err.lower()

    def test_minimum_length_exactly_8(self):
        """Exactly 8 characters with all requirements passes."""
        assert validate_password_strength("Ab1!defg") is None

    def test_various_special_chars(self):
        """Different special characters are all valid."""
        for char in ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "-"]:
            pw = f"Test1234{char}"
            assert validate_password_strength(pw) is None


class TestCommonPasswords:
    """Blacklist of top 100 common passwords."""

    def test_password_is_common(self):
        assert is_password_common("password") is True

    def test_123456_is_common(self):
        assert is_password_common("123456") is True

    def test_qwerty_is_common(self):
        assert is_password_common("qwerty") is True

    def test_admin_is_common(self):
        assert is_password_common("admin") is True

    def test_case_insensitive(self):
        """Common password detection is case-insensitive."""
        assert is_password_common("PASSWORD") is True
        assert is_password_common("Password") is True
        assert is_password_common("PaSsWoRd") is True

    def test_strong_password_not_common(self):
        assert is_password_common("Xy9$kL2@mQ5!") is False

    def test_empty_not_common(self):
        """Empty string is not in the blacklist."""
        assert is_password_common("") is False


class TestRegisterPasswordValidation:
    """Integration: /register endpoint rejects weak passwords."""

    def test_register_weak_password_rejected(self, client):
        """Registration with 'abc' is rejected by password validator."""
        resp = client.post("/api/v1/auth/register", json={
            "email": "weakpw@test.com",
            "password": "abc",
            "full_name": "Test",
            "phone": "+584149999999",
            "cedula": "V-99999999",
            "role": "worker",
        })
        assert resp.status_code == 400
        detail = resp.json()["detail"].lower()
        assert "8 caracteres" in detail or "8" in detail

    def test_register_common_password_rejected(self, client):
        """Registration with a common password is rejected (either by complexity or blacklist)."""
        # 'password' fails complexity first (no uppercase), 'password123' fails blacklist too
        resp = client.post("/api/v1/auth/register", json={
            "email": "commonpw2@test.com",
            "password": "password",  # No uppercase = complexity fail first
            "full_name": "Test",
            "phone": "+584148888801",
            "cedula": "V-88888801",
            "role": "worker",
        })
        assert resp.status_code == 400
        # Either complexity or blacklist message
        detail = resp.json()["detail"].lower()
        assert "mayuscula" in detail or "comun" in detail

    def test_register_strong_password_accepted(self, client):
        """Registration with a strong password succeeds."""
        resp = client.post("/api/v1/auth/register", json={
            "email": "strongpw@test.com",
            "password": "Str0ng!Pass2024",
            "full_name": "Test",
            "phone": "+584147777777",
            "cedula": "V-77777777",
            "role": "worker",
        })
        assert resp.status_code == 201
        assert resp.json()["email"] == "strongpw@test.com"
