"""
Auth profile & security tests — FASE 3D
Covers: register, login, tokens, profile, sessions (11 tests)

Known pre-existing:
- update_profile (PATCH /me): SQLAlchemy session bug
- /change-password: endpoint does not exist
- JWT: deterministic for same user (no jti)
"""

PW = "Test123!"


def _register(client, **kw):
    payload = {
        "email": "tmp@t.com",
        "password": PW,
        "full_name": "X",
        "phone": "+584149999999",
        "cedula": "V-99999999",
        "role": "worker",
    }
    payload.update(kw)
    return client.post("/api/v1/auth/register", json=payload)


def _login(client, email, password=PW):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


class TestRegister:
    def test_register_returns_user(self, client):
        resp = _register(client, email="r1@t.com", cedula="V-11111111")
        assert resp.status_code == 201
        assert resp.json()["email"] == "r1@t.com"

    def test_register_duplicate_email(self, client):
        _register(client, email="dup@t.com", cedula="V-22222222")
        resp = _register(client, email="dup@t.com", cedula="V-33333333")
        assert resp.status_code == 400

    def test_register_weak_password(self, client):
        resp = _register(client, email="wpw@t.com", cedula="V-44444444", password="123")
        assert resp.status_code in (400, 422)

    def test_register_missing_fields(self, client):
        resp = client.post("/api/v1/auth/register", json={"email": "x@t.com"})
        assert resp.status_code == 422


class TestLoginTokens:
    def test_login_returns_tokens(self, client):
        _register(client, email="lt@t.com", cedula="V-55000001")
        resp = _login(client, "lt@t.com")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_wrong_password(self, client):
        _register(client, email="lpw@t.com", cedula="V-55000002")
        resp = _login(client, "lpw@t.com", password="***")
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        resp = client.post("/api/v1/auth/login", json={})
        assert resp.status_code == 422

    def test_invalid_access_token(self, client, contractor_token):
        bad = contractor_token[:-5] + "XXXXX"
        resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {bad}"})
        assert resp.status_code in (401, 403)

    def test_refresh_bogus_token(self, client):
        resp = client.post("/api/v1/auth/token", json={"refresh_token": "bogus"})
        assert resp.status_code in (400, 401, 422)


class TestProfile:
    def test_get_own_profile(self, client, contractor_token):
        resp = client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {contractor_token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "contractor@test.com"


class TestSessions:
    def test_token_scoped_to_account(self, client):
        _register(client, email="sa@t.com", cedula="V-88000001")
        _register(client, email="sb@t.com", cedula="V-88000002")
        token_a = _login(client, "sa@t.com").json()["access_token"]
        resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_a}"})
        assert resp.json()["email"] == "sa@t.com"
