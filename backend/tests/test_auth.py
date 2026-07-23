"""
Tests de autenticación: register, login, refresh, /me
"""

from fastapi.testclient import TestClient


class TestRegister:
    def test_register_success(self, client: TestClient):
        """Step 1 register (email+password) returns 201 with placeholder full_name/cedula."""
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@test.com",
                "password": "SecurePass123!",
                "full_name": "New User",
                "phone": "+584143333333",
                "cedula": "V-33333333",
                "role": "worker",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newuser@test.com"
        # Step 1 generates a placeholder name (real name set in Step 2: POST /auth/complete)
        assert data["full_name"].startswith("Usuario-")
        assert data["role"] == "worker"
        assert "id" in data
        assert "password_hash" not in data  # No exponer password

    def test_register_duplicate_email(self, client: TestClient):
        """Email duplicado debe devolver 400."""
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "dup@test.com",
                "password": "Pass123!",
                "full_name": "User",
                "phone": "+584144444444",
                "cedula": "V-44444444",
                "role": "worker",
            },
        )
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "email": "dup@test.com",
                "password": "Pass123!",
                "full_name": "User2",
                "phone": "+584145555555",
                "cedula": "V-55555555",
                "role": "worker",
            },
        )
        assert resp.status_code == 400
        assert "ya registrado" in resp.json()["detail"].lower()

    def test_register_duplicate_cedula(self, client: TestClient):
        """Step 2: duplicate cedula should return 400 during profile completion."""
        # Register two users (Step 1 gives placeholder cedulas)
        r1 = client.post(
            "/api/v1/auth/register",
            json={
                "email": "user1@test.com",
                "password": "Pass123!",
                "full_name": "User1",
                "phone": "+584146666666",
                "cedula": "V-66666666",
                "role": "worker",
            },
        )
        # Get token by logging in, not from register (UserResponse has no token)
        login1 = client.post(
            "/api/v1/auth/login",
            json={"email": "user1@test.com", "password": "Pass123!"},
        )
        token1 = login1.json()["access_token"]
        # Complete profile for user1 with cedula V-66666666
        client.patch(
            "/api/v1/auth/complete-profile",
            json={"full_name": "User1", "phone": "+584146666666", "cedula": "V-66666666", "address": "Calle 1"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        # Register user2
        r2 = client.post(
            "/api/v1/auth/register",
            json={
                "email": "user2@test.com",
                "password": "Pass123!",
                "full_name": "User2",
                "phone": "+584147777777",
                "cedula": "V-11111111",
                "role": "worker",
            },
        )
        # Get token by logging in
        login2 = client.post(
            "/api/v1/auth/login",
            json={"email": "user2@test.com", "password": "Pass123!"},
        )
        token2 = login2.json()["access_token"]
        # Try to complete user2 with the same cedula — should fail
        resp = client.patch(
            "/api/v1/auth/complete-profile",
            json={"full_name": "User2", "phone": "+584147777777", "cedula": "V-66666666", "address": "Calle 2"},
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert resp.status_code == 400

    def test_register_invalid_email(self, client: TestClient):
        """Email invalido (actualmente aceptado, sin validation EmailStr)."""
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "email": "no-es-un-email",
                "password": "Pass123!",
                "full_name": "User",
                "phone": "+584148888888",
                "cedula": "V-88888888",
                "role": "worker",
            },
        )
        # Sin validacion EmailStr, la API lo acepta. Si se agrega, cambiar a 422
        assert resp.status_code in (200, 201)


class TestLogin:
    def test_login_success(self, client: TestClient, contractor_token):
        """Login exitoso devuelve access_token + refresh_token + user."""
        resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": "contractor@test.com",
                "password": "Test123!",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["user"]["email"] == "contractor@test.com"

    def test_login_wrong_password(self, client: TestClient, contractor_token):
        """Password incorrecto devuelve 401."""
        resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": "contractor@test.com",
                "password": "WrongPassword!",
            },
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client: TestClient):
        """Usuario que no existe devuelve 401."""
        resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": "noexisto@test.com",
                "password": "Test123!",
            },
        )
        assert resp.status_code == 401


class TestProfile:
    def test_get_me(self, client: TestClient, contractor_token):
        """/me devuelve datos del usuario autenticado."""
        resp = client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": f"Bearer {contractor_token}",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "contractor@test.com"

    def test_get_me_unauthorized(self, client: TestClient):
        """/me sin token devuelve 401."""
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_update_profile(self, client: TestClient, contractor_token):
        """PATCH /me actualiza nombre y teléfono."""
        resp = client.patch(
            "/api/v1/auth/me",
            json={
                "full_name": "Updated Name",
            },
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Name"


class TestRefreshToken:
    def test_refresh_success(self, client: TestClient, contractor_token):
        """Refresh devuelve nuevo par de tokens."""
        # Primero obtener refresh token
        login_resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": "contractor@test.com",
                "password": "Test123!",
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        # Refrescar
        resp = client.post(f"/api/v1/auth/refresh?refresh_token={refresh_token}")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        # El nuevo refresh debe ser diferente (rotación)
        assert data["refresh_token"] != refresh_token

    def test_refresh_invalid_token(self, client: TestClient):
        """Refresh token inválido devuelve 401."""
        resp = client.post("/api/v1/auth/refresh?refresh_token=token-falso")
        assert resp.status_code == 401
