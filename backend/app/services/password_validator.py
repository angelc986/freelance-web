"""
Password validation and security.

Features:
  - Complexity requirements (min 8 chars, upper, lower, digit, special)
  - Common password blacklist (top 100 locally, no external API dependency)
  - Never blocks registration if blacklist loading fails
"""

import re

# -- Top 100 most common passwords (OWASP + HIBP top list) --
# Sourced from public security research. Never blocks external API dependency.
_COMMON_PASSWORDS: set[str] = {
    "123456",
    "password",
    "12345678",
    "qwerty",
    "123456789",
    "12345",
    "1234",
    "111111",
    "1234567",
    "sunshine",
    "qwerty123",
    "iloveyou",
    "princess",
    "admin",
    "welcome",
    "666666",
    "abc123",
    "football",
    "123123",
    "monkey",
    "654321",
    "!@#$%^&*",
    "charlie",
    "aa123456",
    "donald",
    "password1",
    "qwerty12345",
    "1234567890",
    "123456789a",
    "qwerty1",
    "1q2w3e4r",
    "master",
    "letmein",
    "login",
    "baseball",
    "dragon",
    "trustno1",
    "starwars",
    "whatever",
    "nicole",
    "access",
    "flower",
    "hello",
    "hottie",
    "lovely",
    "michael",
    "ninja",
    "mustang",
    "passw0rd",
    "shadow",
    "mynoob",
    "654321a",
    "!qaz2wsx",
    "superman",
    "1qaz2wsx",
    "pokemon",
    "batman",
    "hunter2",
    "trustno",
    "merlin",
    "ashley",
    "andrew",
    "joshua",
    "matthew",
    "jessica",
    "password123",
    "admin123",
    "letmein123",
    "qwerty1234",
    "pass1234",
    "daniel",
    "austin",
    "anthony",
    "taylor",
    "thomas",
    "george",
    "robert",
    "william",
    "joseph",
    "david",
    "richard",
    "charles",
    "christopher",
    "james",
    "oliver",
    "jack",
    "harry",
    "jacob",
    "charlie2",
    "thomas1",
    "soccer",
    "liverpool",
    "arsenal",
    "chelsea",
    "manchester",
    "blink182",
    "eminem",
    "metallica",
    "slipknot",
    "nirvana",
    "fuckyou",
    "fuckoff",
    "bitch",
    "asshole",
    "bastard",
    "freedom",
    "america",
    "canada",
    "england",
    "germany",
    "1234567890qwerty",
    "123456789qwerty",
    "12345678qwerty",
    "pass123",
}

# Special character detection (any of these counts)
_SPECIAL_RE = re.compile(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?`~]")


def validate_password_strength(password: str) -> str | None:
    """
    Validate password meets minimum security requirements.

    Returns None if valid, or an error message string if invalid.
    """
    if len(password) < 8:
        return "La contrasena debe tener al menos 8 caracteres"

    if not re.search(r"[A-Z]", password):
        return "La contrasena debe contener al menos una mayuscula"

    if not re.search(r"[a-z]", password):
        return "La contrasena debe contener al menos una minuscula"

    if not re.search(r"[0-9]", password):
        return "La contrasena debe contener al menos un numero"

    if not _SPECIAL_RE.search(password):
        return "La contrasena debe contener al menos un caracter especial (!@#$%...)"

    return None


def is_password_common(password: str) -> bool:
    """
    Check if the password appears in the common password blacklist.

    Case-insensitive comparison (so "Password", "PASSWORD", etc. are all caught).
    """
    return password.lower() in _COMMON_PASSWORDS
