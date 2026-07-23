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

    current_user.didit_session_id = None
    db.commit()

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

    if signature and timestamp:
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
    else:
        api_key = request.headers.get("x-api-key", "")
        if api_key != settings.DIDIT_API_KEY:
            raise HTTPException(status_code=403, detail="Forbidden")

    payload = json.loads(raw_body)
    session_id = payload.get("session_id")
    status_val = payload.get("status")
    vendor_data = payload.get("vendor_data")

    if not session_id or not vendor_data:
        return {"received": True}

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(vendor_data)).first()
        if user:
            if status_val == "Approved":
                user.is_verified = True
                user.verified_at = datetime.now(UTC)
                portrait_url = _extract_portrait_url(payload)
                if portrait_url:
                    cloud_url = _upload_avatar_from_url(portrait_url, user.id)
                    if cloud_url:
                        user.avatar_url = cloud_url
                        user.avatar_verified = True
                log_action(
                    user.id, "kyc_approved", {"session_id": session_id}, ip=request.client.host
                )
            elif status_val in ("Declined", "Expired", "Abandoned"):
                user.is_verified = False
                user.didit_session_id = None
                log_action(
                    user.id,
                    "kyc_failed",
                    {"session_id": session_id, "status": status_val},
                    ip=request.client.host,
                )
            db.commit()
    except (ValueError, Exception):
        pass
    finally:
        db.close()

    return {"received": True}
