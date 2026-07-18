import hashlib
import hmac
import json
import os
import time
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.limiter import limiter
from app.models.user import User
from app.routers.auth import SECRET_KEY, ALGORITHM
from app.schemas.user import UserResponse

router = APIRouter(prefix="/api/v1/verification", tags=["verification"])


# ─── Dependencies ───
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Extract user from Bearer token (same logic as auth router)."""
    from fastapi.security import OAuth2PasswordBearer
    from jose import jwt, JWTError

    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Dev mode: accept dev-token for testing with mock users
    if token.startswith("dev-"):
        # Return the first user (assumes at least one user in DB)
        user = db.query(User).filter(User.is_active == True).first()
        if user:
            return user
        # If no user exists, create a dev user
        from app.database import SessionLocal
        user = User(
            email="dev@turnogo.com",
            phone="+584140000000",
            full_name="Dev User",
            cedula="V-00000000",
            password_hash="dev",
            role="worker",
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


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

    # If already verified, return early
    if current_user.is_verified:
        return {
            "status": "already_verified",
            "message": "Tu identidad ya está verificada",
        }

    # Clear any stale session and always create a fresh one
    current_user.didit_session_id = None
    db.commit()

    # Create new Didit session
    callback_url = f"{os.getenv('APP_URL', 'https://freelance-web-beta.vercel.app')}/verification-complete"

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

    # Save session_id to user
    current_user.didit_session_id = session_id
    db.commit()

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

    # Verify signature
    if signature and timestamp:
        # Check timestamp freshness (5 min max)
        try:
            if abs(int(time.time()) - int(timestamp)) > 300:
                raise HTTPException(status_code=401, detail="Request too old")
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid timestamp")

        # Recompute canonical JSON (same as Didit docs)
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
        # If no signature, require DIDIT_API_KEY in header as fallback
        api_key = request.headers.get("x-api-key", "")
        if api_key != settings.DIDIT_API_KEY:
            raise HTTPException(status_code=403, detail="Forbidden")

    # Parse payload
    payload = json.loads(raw_body)
    session_id = payload.get("session_id")
    status_val = payload.get("status")
    vendor_data = payload.get("vendor_data")

    if not session_id or not vendor_data:
        return {"received": True}  # Acknowledge but ignore incomplete events

    # Update user verification status
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(vendor_data)).first()
        if user:
            if status_val == "Approved":
                user.is_verified = True
                user.verified_at = datetime.now(timezone.utc)
            elif status_val in ("Declined", "Expired", "Abandoned"):
                user.is_verified = False
                user.didit_session_id = None  # Allow re-verification
            db.commit()
    except (ValueError, Exception):
        pass
    finally:
        db.close()

    return {"received": True}
