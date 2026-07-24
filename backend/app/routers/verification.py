import hashlib
import hmac
import json
import logging
import os
import time
from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.limiter import limiter
from app.models.kyc_webhook_event import KycWebhookEvent
from app.models.user import User
from app.services.audit import log_action
from app.services.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/verification", tags=["verification"])


# ─── Dependencies ───
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Shorten floats helper (for webhook HMAC) ───
def shorten_floats(data):
    """Match Didit: whole-valued floats serialize as ints."""
    if isinstance(data, dict):
        return {k: shorten_floats(v) for k, v in data.items()}
    if isinstance(data, list):
        return [shorten_floats(x) for x in data]
    if isinstance(data, float) and data.is_integer():
        return int(data)
    return data


# ─── Endpoints ───


def _extract_portrait_url(payload: dict) -> str | None:
    """Extract the user's portrait/selfie image URL from Didit webhook payload."""
    portrait = payload.get("portrait_image")
    if portrait:
        return portrait

    decision = payload.get("decision")
    if isinstance(decision, dict):
        for feature_list in ["face_matches", "liveness_checks", "id_verifications"]:
            items = decision.get(feature_list)
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict):
                        img = (
                            item.get("portrait_image")
                            or item.get("face_image")
                            or item.get("image")
                        )
                        if img:
                            return img

    documents = payload.get("documents")
    if isinstance(documents, list):
        for doc in documents:
            if isinstance(doc, dict):
                images = doc.get("images")
                if isinstance(images, list) and images:
                    return images[0].get("url") if isinstance(images[0], dict) else images[0]

    return None


def _upload_avatar_from_url(image_url: str, user_id: int) -> str | None:
    """Download portrait from Didit and upload to Cloudinary. Returns Cloudinary URL."""
    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        logger.warning("cloudinary not installed, skipping avatar upload")
        return None
    settings = get_settings()
    if not all(
        [
            settings.CLOUDINARY_CLOUD_NAME,
            settings.CLOUDINARY_API_KEY,
            settings.CLOUDINARY_API_SECRET,
        ]
    ):
        logger.warning("Cloudinary not configured, skipping avatar upload")
        return None

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.get(image_url)
            resp.raise_for_status()

        result = cloudinary.uploader.upload(
            resp.content,
            public_id=f"avatars/user_{user_id}",
            folder="turnogo/avatars",
            overwrite=True,
            resource_type="image",
            transformation=[{"width": 300, "height": 300, "crop": "fill", "gravity": "face"}],
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Failed to upload avatar for user {user_id}: {e}")
        return None


@router.post("/create")
@limiter.limit("5/minute")
async def create_verification(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a Didit verification session for the current user.
    Returns the verification URL to redirect the user to.
    """
    settings = get_settings()

    if not settings.DIDIT_API_KEY:
        raise HTTPException(status_code=503, detail="Verification service not configured")

    if current_user.is_verified:
        return {
            "status": "already_verified",
            "message": "Tu identidad ya esta verificada",
        }

    # HIGH-03: Reusar sesión KYC pendiente si ya existe
    if current_user.didit_session_id:
        logger.info(
            f"Reusing existing Didit session {current_user.didit_session_id} "
            f"for user {current_user.id}"
        )
        return {
            "status": "existing_session",
            "message": "Ya tienes una sesion de verificacion activa. Completala antes de crear otra.",
            "session_id": current_user.didit_session_id,
        }

    callback_url = (
        f"{os.getenv('APP_URL', 'https://freelance-web-beta.vercel.app')}/verification-complete"
    )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://verification.didit.me/v3/session/",
            headers={
                "x-api-key": settings.DIDIT_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "workflow_id": settings.DIDIT_WORKFLOW_ID,
                "callback": callback_url,
                "vendor_data": str(current_user.id),
                "contact_details": {
                    "email": current_user.email,
                },
                "language": "es",
            },
        )

    if response.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail="Error creating verification session")

    session = response.json()
    session_id = session.get("session_id")
    verification_url = session.get("url")

    current_user.didit_session_id = session_id
    db.commit()

    log_action(
        current_user.id, "kyc_session_created", {"session_id": session_id}, ip=request.client.host
    )

    return {
        "status": "created",
        "verification_url": verification_url,
        "session_id": session_id,
    }


@router.get("/status")
async def get_verification_status(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's verification status."""
    return {
        "is_verified": current_user.is_verified,
        "verified_at": current_user.verified_at.isoformat() if current_user.verified_at else None,
    }


@router.post("/webhook")
async def didit_webhook(request: Request):
    """
    Receive verification results from Didit via webhook.
    Verifies HMAC signature before processing.
    """
    settings = get_settings()
    raw_body = await request.body()
    signature = request.headers.get("X-Signature-V2")
    timestamp = request.headers.get("X-Timestamp")

    # HIGH-04: Solo autenticación HMAC — sin fallback a API Key
    if not signature or not timestamp:
        raise HTTPException(status_code=401, detail="Missing X-Signature-V2 or X-Timestamp header")

    try:
        if abs(int(time.time()) - int(timestamp)) > 300:
            raise HTTPException(status_code=401, detail="Request too old")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid timestamp")

    try:
        payload = json.loads(raw_body)
        canonical = json.dumps(
            shorten_floats(payload),
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
        )
        expected = hmac.new(
            settings.DIDIT_WEBHOOK_SECRET.encode("utf-8"),
            canonical.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=401, detail="Invalid signature")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    payload = json.loads(raw_body)
    session_id = payload.get("session_id")
    status_val = payload.get("status")
    vendor_data = payload.get("vendor_data")

    if not session_id or not vendor_data:
        return {"received": True}

    db = SessionLocal()
    try:
        # HIGH-01: Idempotencia — verificar si este webhook ya fue procesado
        existing = (
            db.query(KycWebhookEvent)
            .filter(
                KycWebhookEvent.session_id == session_id,
                KycWebhookEvent.status == status_val,
            )
            .first()
        )
        if existing:
            logger.info(
                f"Duplicate webhook ignored: session={session_id} status={status_val} "
                f"(already processed at {existing.processed_at})"
            )
            return {"received": True, "duplicate": True}

        user = db.query(User).filter(User.id == int(vendor_data)).first()
        if not user:
            return {"received": True}

        if status_val == "Approved":
            # Maquina de estados KYC: registrar transicion
            previous_status = user.kyc_status
            previous_avatar = user.avatar_verified_url

            user.kyc_status = "APPROVED"
            user.is_verified = True
            user.verified_at = datetime.now(UTC)

            portrait_url = _extract_portrait_url(payload)
            if portrait_url:
                cloud_url = _upload_avatar_from_url(portrait_url, user.id)
                if cloud_url:
                    user.avatar_verified_url = cloud_url
                    user.avatar_url = cloud_url
                    user.avatar_verified = True
            user.didit_session_id = None

            # HIGH-02: Log de cambio de avatar con estado anterior
            log_action(
                user.id,
                "kyc_approved",
                {
                    "session_id": session_id,
                    "previous_status": previous_status,
                    "new_status": "APPROVED",
                    "previous_avatar": previous_avatar,
                    "new_avatar": user.avatar_verified_url,
                },
                ip=request.client.host,
            )

        elif status_val in ("Declined", "Expired", "Abandoned"):
            # CRIT-03: Nunca des-verificar a un usuario ya aprobado
            if user.is_verified:
                logger.warning(
                    f"Ignoring {status_val} webhook for already-verified user {user.id} "
                    f"(session {session_id}). Possibly a replayed or out-of-order webhook."
                )
                return {"received": True}

            previous_status = user.kyc_status
            new_status = status_val.upper()
            user.kyc_status = new_status
            user.didit_session_id = None

            log_action(
                user.id,
                "kyc_failed",
                {
                    "session_id": session_id,
                    "status": status_val,
                    "previous_status": previous_status,
                    "new_status": new_status,
                },
                ip=request.client.host,
            )

        # HIGH-01: Registrar evento como procesado
        db.add(
            KycWebhookEvent(
                session_id=session_id,
                status=status_val,
                user_id=int(vendor_data),
            )
        )
        db.commit()

    except (ValueError, Exception) as e:
        db.rollback()
        logger.error(f"Webhook processing error: {e}", exc_info=True)
    finally:
        db.close()

    return {"received": True}
