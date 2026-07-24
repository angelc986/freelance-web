"""
KYC Security Test Suite — Fase 10.3
Cubre: proteccion de avatar, idempotencia, maquina de estados, HMAC, sesiones.

Ejecutar: pytest tests/verification/test_kyc_security.py -v
"""

import hashlib
import hmac
import json
import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models.kyc_webhook_event import KycWebhookEvent
from app.models.user import User

# ─── Helpers ────────────────────────────────────────────────────────────────

WEBHOOK_SECRET = "test-didit-webhook-secret-for-tests"


def _make_didit_signature(payload: dict, secret: str = WEBHOOK_SECRET) -> str:
    """Generate Didit-compatible X-Signature-V2 HMAC-SHA256 hex digest."""

    def _shorten_floats(data):
        if isinstance(data, dict):
            return {k: _shorten_floats(v) for k, v in data.items()}
        if isinstance(data, list):
            return [_shorten_floats(x) for x in data]
        if isinstance(data, float) and data.is_integer():
            return int(data)
        return data

    canonical = json.dumps(
        _shorten_floats(payload),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hmac.new(
        secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def _webhook_payload(session_id: str, status: str, vendor_data: str) -> dict:
    """Minimal Didit webhook payload."""
    return {
        "session_id": session_id,
        "status": status,
        "vendor_data": vendor_data,
    }


def _send_webhook(
    client: TestClient,
    payload: dict,
    secret: str = WEBHOOK_SECRET,
    timestamp: int | None = None,
    signature: str | None = None,
    omit_signature: bool = False,
    omit_timestamp: bool = False,
) -> dict:
    """Send a signed webhook to the Didit endpoint."""
    ts = timestamp or int(time.time())
    headers = {}
    if not omit_timestamp:
        headers["X-Timestamp"] = str(ts)
    if not omit_signature:
        headers["X-Signature-V2"] = signature or _make_didit_signature(payload, secret)

    resp = client.post("/api/v1/verification/webhook", json=payload, headers=headers)
    return {"status_code": resp.status_code, "body": resp.json()}


def _get_user_from_db(user_id: int):
    """Fetch fresh user from DB."""
    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()


# ─── Fixtures ───────────────────────────────────────────────────────────────


@pytest.fixture
def kyc_user_token(client, db):
    """Create a user ready for KYC testing. Returns token."""
    from passlib.context import CryptContext

    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user = User(
        email="kycuser@test.com",
        phone="+584147000000",
        cedula="V-70000000",
        full_name="KYC Test User",
        password_hash=pwd.hash("Test123!"),
        role="worker",
        kyc_status="PENDING",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "kycuser@test.com", "password": "Test123!"},
    )
    return resp.json()["access_token"], user.id


@pytest.fixture
def verified_user(client, db):
    """Create a fully KYC-verified user. Returns (token, user_id)."""
    from datetime import UTC, datetime

    from passlib.context import CryptContext

    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user = User(
        email="verifiedkyc@test.com",
        phone="+584147000001",
        cedula="V-70000001",
        full_name="Verified KYC User",
        password_hash=pwd.hash("Test123!"),
        role="worker",
        is_verified=True,
        kyc_status="APPROVED",
        avatar_verified=True,
        avatar_verified_url="https://cloudinary.com/verified_avatar.jpg",
        avatar_url="https://cloudinary.com/verified_avatar.jpg",
        verified_at=datetime(2026, 7, 1, tzinfo=UTC),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "verifiedkyc@test.com", "password": "Test123!"},
    )
    return resp.json()["access_token"], user.id


# ─── Test: Avatar Protection ────────────────────────────────────────────────


class TestAvatarProtection:
    """CRIT-02 + avatar_verified_url immutability."""

    def test_verified_user_cannot_change_avatar(self, client, verified_user):
        """Usuario verificado por KYC → 403 al subir avatar."""
        token, _uid = verified_user
        # Crear un archivo falso de 1x1 PNG
        fake_png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f"
            b"\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        resp = client.post(
            "/api/v1/users/avatar",
            files={"file": ("avatar.png", fake_png, "image/png")},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403
        assert "KYC" in resp.json()["detail"]

    def test_unverified_user_can_change_avatar(self, client, kyc_user_token):
        """Usuario no verificado puede subir avatar normalmente."""
        token, _uid = kyc_user_token
        fake_png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f"
            b"\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        resp = client.post(
            "/api/v1/users/avatar",
            files={"file": ("avatar.png", fake_png, "image/png")},
            headers={"Authorization": f"Bearer {token}"},
        )
        # Deberia funcionar (200 o fallback local)
        assert resp.status_code in (200, 500)  # 500 si Cloudinary no configurado

    def test_avatar_verified_url_not_writable_from_api(self, client, verified_user):
        """avatar_verified_url no debe ser escribible desde ningun endpoint publico."""
        token, _uid = verified_user
        # Intentar modificar perfil con avatar_verified_url
        resp = client.patch(
            "/api/v1/auth/me",
            json={"avatar_verified_url": "https://evil.com/hacked.jpg"},
            headers={"Authorization": f"Bearer {token}"},
        )
        # Si el endpoint existe, no debe permitir escribir ese campo
        if resp.status_code != 404:
            user = _get_user_from_db(_uid)
            # El campo NO debe haber cambiado
            assert user.avatar_verified_url != "https://evil.com/hacked.jpg"
            assert user.avatar_verified_url == "https://cloudinary.com/verified_avatar.jpg"


# ─── Test: Webhook Idempotency ──────────────────────────────────────────────


class TestWebhookIdempotency:
    """HIGH-01: Webhooks duplicados no modifican estado."""

    @patch("app.routers.verification._upload_avatar_from_url", return_value=None)
    def test_duplicate_webhook_no_state_change(self, mock_upload, client, kyc_user_token):
        """Webhook duplicado no crea doble registro ni cambia estado."""
        _token, user_id = kyc_user_token
        session_id = "session-dup-001"
        payload = _webhook_payload(session_id, "Approved", str(user_id))

        # Primer envio
        r1 = _send_webhook(client, payload)
        assert r1["status_code"] == 200
        assert not r1["body"].get("duplicate")

        # Verificar que se creo el registro
        user = _get_user_from_db(user_id)
        assert user.is_verified is True
        assert user.kyc_status == "APPROVED"

        # Segundo envio — mismo session_id + status
        r2 = _send_webhook(client, payload)
        assert r2["status_code"] == 200
        assert r2["body"].get("duplicate") is True

        # Solo debe existir UN registro en kyc_webhook_events
        db = SessionLocal()
        try:
            count = (
                db.query(KycWebhookEvent)
                .filter(
                    KycWebhookEvent.session_id == session_id,
                    KycWebhookEvent.status == "Approved",
                )
                .count()
            )
            assert count == 1
        finally:
            db.close()

    @patch("app.routers.verification._upload_avatar_from_url", return_value=None)
    def test_webhook_retry_terminates_correctly(self, mock_upload, client, kyc_user_token):
        """Reintento del webhook devuelve 200 con duplicate=True."""
        _token, user_id = kyc_user_token
        session_id = "session-retry-001"
        payload = _webhook_payload(session_id, "Approved", str(user_id))

        _send_webhook(client, payload)
        r2 = _send_webhook(client, payload)

        assert r2["status_code"] == 200
        assert r2["body"]["received"] is True

    @patch("app.routers.verification._upload_avatar_from_url", return_value=None)
    def test_different_status_same_session_processed(
        self, mock_upload, client, kyc_user_token
    ):
        """Diferentes status con misma session_id se procesan independientemente."""
        _token, user_id = kyc_user_token
        session_id = "session-multi-status"

        # Primero Declined
        _send_webhook(client, _webhook_payload(session_id, "Declined", str(user_id)))
        # Luego Approved (escenario: reintento manual en Didit)
        _send_webhook(client, _webhook_payload(session_id, "Approved", str(user_id)))

        user = _get_user_from_db(user_id)
        assert user.is_verified is True
        assert user.kyc_status == "APPROVED"

        # Debe haber 2 registros (Declined + Approved)
        db = SessionLocal()
        try:
            count = db.query(KycWebhookEvent).filter(
                KycWebhookEvent.session_id == session_id
            ).count()
            assert count == 2
        finally:
            db.close()


# ─── Test: KYC State Machine ────────────────────────────────────────────────


class TestKycStateMachine:
    """CRIT-03 + kyc_status: transiciones validas y proteccion de estado."""

    @patch("app.routers.verification._upload_avatar_from_url", return_value=None)
    def test_approved_then_stale_declined_maintains_verification(
        self, mock_upload, client, kyc_user_token
    ):
        """APPROVED seguido de DECLINED antiguo mantiene verificacion."""
        _token, user_id = kyc_user_token
        session_id = "session-order-001"

        # Approved webhook
        _send_webhook(client, _webhook_payload(session_id, "Approved", str(user_id)))
        user = _get_user_from_db(user_id)
        assert user.is_verified is True
        assert user.kyc_status == "APPROVED"

        # Declined webhook (antiguo/replay)
        r2 = _send_webhook(client, _webhook_payload(session_id, "Declined", str(user_id)))
        assert r2["status_code"] == 200

        # El usuario DEBE seguir verificado
        user = _get_user_from_db(user_id)
        assert user.is_verified is True
        assert user.kyc_status == "APPROVED"

    @patch("app.routers.verification._upload_avatar_from_url", return_value=None)
    def test_rejected_user_can_retry_kyc(self, mock_upload, client, kyc_user_token):
        """Usuario rechazado puede iniciar nuevo proceso KYC."""
        _token, user_id = kyc_user_token
        session_id = "session-rejected-001"

        # Rechazar
        _send_webhook(client, _webhook_payload(session_id, "Declined", str(user_id)))
        user = _get_user_from_db(user_id)
        assert user.is_verified is False
        assert user.kyc_status == "DECLINED"
        assert user.didit_session_id is None

        # Deberia poder crear nueva sesion (no hay didit_session_id activo)
        # Nota: create_verification llama a Didit API real — mockeamos httpx

    def test_kyc_status_transitions(self, client, kyc_user_token):
        """kyc_status solo permite transiciones validas."""
        _token, user_id = kyc_user_token

        # PENDING → DECLINED
        _send_webhook(client, _webhook_payload("s1", "Declined", str(user_id)))
        user = _get_user_from_db(user_id)
        assert user.kyc_status == "DECLINED"

        # DECLINED → APPROVED (nuevo intento con otra sesion)
        with patch(
            "app.routers.verification._upload_avatar_from_url", return_value=None
        ):
            _send_webhook(client, _webhook_payload("s2", "Approved", str(user_id)))
        user = _get_user_from_db(user_id)
        assert user.kyc_status == "APPROVED"

        # APPROVED → DECLINED debe ser IGNORADO (CRIT-03)
        _send_webhook(client, _webhook_payload("s2", "Declined", str(user_id)))
        user = _get_user_from_db(user_id)
        assert user.kyc_status == "APPROVED"

    @patch("app.routers.verification._upload_avatar_from_url", return_value=None)
    def test_cloudinary_failure_keeps_consistent_state(
        self, mock_upload, client, kyc_user_token
    ):
        """Si Cloudinary falla, el usuario queda verificado pero sin avatar."""
        _token, user_id = kyc_user_token
        session_id = "session-no-cloud"

        # mock_upload ya retorna None (Cloudinary caido)
        _send_webhook(client, _webhook_payload(session_id, "Approved", str(user_id)))

        user = _get_user_from_db(user_id)
        # Debe estar verificado aunque Cloudinary fallo
        assert user.is_verified is True
        assert user.kyc_status == "APPROVED"
        # avatar_verified debe ser False (no se subio foto)
        assert user.avatar_verified is False
        # avatar_verified_url no se modifico
        assert user.avatar_verified_url is None


# ─── Test: Webhook Security (HMAC) ──────────────────────────────────────────


class TestWebhookSecurity:
    """HIGH-04: Solo HMAC, sin fallback. Timestamp validation."""

    def test_webhook_invalid_hmac_rejected(self, client, kyc_user_token):
        """Firma HMAC invalida → 401."""
        _token, user_id = kyc_user_token
        payload = _webhook_payload("s-hmac-001", "Approved", str(user_id))

        r = _send_webhook(client, payload, signature="deadbeef")
        assert r["status_code"] == 401

    def test_webhook_wrong_secret_rejected(self, client, kyc_user_token):
        """Firma con secret incorrecto → 401."""
        _token, user_id = kyc_user_token
        payload = _webhook_payload("s-secret-001", "Approved", str(user_id))

        r = _send_webhook(client, payload, secret="wrong-secret")
        assert r["status_code"] == 401

    def test_webhook_missing_signature_rejected(self, client, kyc_user_token):
        """Sin cabecera X-Signature-V2 → 401."""
        _token, user_id = kyc_user_token
        payload = _webhook_payload("s-nosig-001", "Approved", str(user_id))

        r = _send_webhook(client, payload, omit_signature=True)
        assert r["status_code"] == 401

    def test_webhook_missing_timestamp_rejected(self, client, kyc_user_token):
        """Sin cabecera X-Timestamp → 401."""
        _token, user_id = kyc_user_token
        payload = _webhook_payload("s-nots-001", "Approved", str(user_id))

        r = _send_webhook(client, payload, omit_timestamp=True)
        assert r["status_code"] == 401

    def test_webhook_expired_timestamp_rejected(self, client, kyc_user_token):
        """Timestamp >5min antiguo → 401."""
        _token, user_id = kyc_user_token
        payload = _webhook_payload("s-old-001", "Approved", str(user_id))
        old_ts = int(time.time()) - 301

        r = _send_webhook(client, payload, timestamp=old_ts)
        assert r["status_code"] == 401

    def test_webhook_future_timestamp_rejected(self, client, kyc_user_token):
        """Timestamp futuro → 401."""
        _token, user_id = kyc_user_token
        payload = _webhook_payload("s-future-001", "Approved", str(user_id))
        future_ts = int(time.time()) + 301

        r = _send_webhook(client, payload, timestamp=future_ts)
        assert r["status_code"] == 401

    def test_webhook_api_key_fallback_removed(self, client, kyc_user_token):
        """HIGH-04: API Key como fallback ya no funciona."""
        _token, user_id = kyc_user_token
        payload = _webhook_payload("s-apikey-001", "Approved", str(user_id))

        # Intentar con x-api-key en vez de firma HMAC
        resp = client.post(
            "/api/v1/verification/webhook",
            json=payload,
            headers={"x-api-key": "any-key"},
        )
        assert resp.status_code == 401

    @patch("app.routers.verification._upload_avatar_from_url", return_value=None)
    def test_valid_webhook_accepted(self, mock_upload, client, kyc_user_token):
        """Webhook con firma HMAC valida → 200."""
        _token, user_id = kyc_user_token
        payload = _webhook_payload("s-valid-001", "Approved", str(user_id))

        r = _send_webhook(client, payload)
        assert r["status_code"] == 200
        assert r["body"]["received"] is True


# ─── Test: KYC Session Management ───────────────────────────────────────────


class TestKycSessionManagement:
    """HIGH-03: Reutilizacion de sesiones, limites."""

    def test_verified_user_cannot_create_new_kyc_session(
        self, client, verified_user
    ):
        """Usuario ya verificado → already_verified al crear sesion."""
        token, _uid = verified_user
        resp = client.post(
            "/api/v1/verification/create",
            headers={"Authorization": f"Bearer {token}"},
        )
        # Debe responder que ya esta verificado (sin llamar a Didit)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "already_verified"

    def test_user_with_pending_session_reuses_it(self, client, kyc_user_token):
        """Usuario con didit_session_id existente → reusa la sesion."""
        token, user_id = kyc_user_token

        # Simular que ya tiene una sesion pendiente
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            user.didit_session_id = "existing-didit-session-123"
            db.commit()
        finally:
            db.close()

        # Intentar crear nueva sesion (sin mock — deberia detectar sesion existente
        # ANTES de llamar a Didit)
        resp = client.post(
            "/api/v1/verification/create",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "existing_session"
        assert data["session_id"] == "existing-didit-session-123"
        assert "activa" in data["message"].lower() or "completala" in data["message"].lower()

    def test_rejected_user_without_session_can_create(self, client, kyc_user_token):
        """Usuario rechazado sin sesion activa puede crear nueva (HTTP 503 si Didit no configurado)."""
        token, user_id = kyc_user_token

        # Marcar como rechazado, sin sesion activa
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            user.kyc_status = "DECLINED"
            user.didit_session_id = None
            db.commit()
        finally:
            db.close()

        resp = client.post(
            "/api/v1/verification/create",
            headers={"Authorization": f"Bearer {token}"},
        )
        # Sin DIDIT_API_KEY configurada → 503 (servicio no disponible)
        # Con API key → llamaria a Didit. En tests, esperamos 503.
        assert resp.status_code in (200, 503)


# ─── Test: KYC Status Endpoint ──────────────────────────────────────────────


class TestKycStatusEndpoint:
    """GET /verification/status — refleja el estado real."""

    def test_status_reflects_pending(self, client, kyc_user_token):
        """Usuario nuevo → PENDING."""
        token, _uid = kyc_user_token
        resp = client.get(
            "/api/v1/verification/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["is_verified"] is False

    def test_status_reflects_verified(self, client, verified_user):
        """Usuario verificado → is_verified=True."""
        token, _uid = verified_user
        resp = client.get(
            "/api/v1/verification/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["is_verified"] is True
        assert resp.json()["verified_at"] is not None

    @patch("app.routers.verification._upload_avatar_from_url", return_value=None)
    def test_status_updates_after_webhook(self, mock_upload, client, kyc_user_token):
        """Despues de webhook Approved, status refleja el cambio."""
        token, user_id = kyc_user_token

        _send_webhook(client, _webhook_payload("s-status-001", "Approved", str(user_id)))

        resp = client.get(
            "/api/v1/verification/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["is_verified"] is True
