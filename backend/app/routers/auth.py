import hashlib
import logging
import random
import secrets
from datetime import UTC, datetime, timedelta

import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.limiter import limiter
from app.models.change_token import ChangeToken
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.user import (
    CompleteProfileRequest,
    ConfirmChangeRequest,
    ForgotPasswordRequest,
    RequestChangeRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UpdateWalletRequest,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.audit import log_action
from app.services.auth import get_current_user
from app.services.password_validator import is_password_common, validate_password_strength

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ⚠️  SECRET_KEY and ALGORITHM are loaded from config (single source of truth).
# Do NOT hardcode these values. Use get_settings() instead.
_settings = get_settings()
SECRET_KEY = _settings.SECRET_KEY
ALGORITHM = _settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = _settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = _settings.REFRESH_TOKEN_EXPIRE_DAYS


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, db: Session):
    """Crea un refresh token aleatorio, lo hashea y lo guarda en BD."""
    token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expire = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    db_token = RefreshToken(
        user_id=int(data["sub"]),
        token_hash=token_hash,
        expires_at=expire,
    )
    db.add(db_token)
    db.commit()

    return token


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("3/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    """Step 1: Register with just email + password + role"""
    # Password strength validation
    pw_error = validate_password_strength(user.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    # Common password check
    if is_password_common(user.password):
        raise HTTPException(
            status_code=400, detail="Esa contraseña es demasiado comun. Elige una mas segura."
        )

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    hashed_password = pwd_context.hash(user.password)
    import secrets as _secrets

    random_suffix = _secrets.token_hex(4)
    placeholder_phone = f"+pending_{random_suffix}"
    placeholder_cedula = f"PENDING-{random_suffix}"

    db_user = User(
        email=user.email,
        phone=placeholder_phone,
        full_name=f"Usuario-{random_suffix[:6]}",
        cedula=placeholder_cedula,
        password_hash=hashed_password,
        role=user.role,
        profile_completed=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send verification email
    from app.services.email_service import send_email

    verify_token = create_access_token({"sub": str(db_user.id), "purpose": "email_verify"})
    db_user.email_verification_token = verify_token
    db.commit()

    settings = get_settings()
    verify_link = f"{settings.APP_URL or 'http://localhost:8000'}/api/v1/auth/verify-email?token={verify_token}"
    verify_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<div style="background:#2563EB;padding:24px;border-radius:16px 16px 0 0;text-align:center">
<span style="color:white;font-size:20px;font-weight:700">TurnoGO</span></div>
<div style="background:#fff;padding:24px;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 16px 16px">
<h2 style="color:#1F2937;margin-top:0">Verifica tu cuenta</h2>
<p style="color:#6B7280;font-size:14px">Gracias por registrarte en TurnoGO. Haz clic en el boton para verificar tu email:</p>
<div style="text-align:center;margin:24px 0">
<a href="{verify_link}" style="display:inline-block;background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">Verificar Email</a>
</div>
<p style="color:#9CA3AF;font-size:12px">O copia este enlace: {verify_link}</p>
<p style="color:#9CA3AF;font-size:12px">Este enlace expira en 24 horas.</p>
</div>
</body></html>"""
    send_email(db_user.email, "Verifica tu cuenta de TurnoGO", verify_html)

    log_action(
        db_user.id,
        "register_success",
        {"role": user.role, "verification_sent": True},
        ip=request.client.host,
    )
    return db_user


@router.patch("/complete-profile", response_model=UserResponse)
@limiter.limit("5/minute")
def complete_profile(
    request: Request,
    data: CompleteProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 2: Complete user profile with name, phone, cedula"""
    user = db.query(User).filter(User.id == current_user.id).first()
    existing = db.query(User).filter(User.phone == data.phone, User.id != user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Telefono ya registrado por otro usuario")

    # Validate cedula uniqueness
    existing = db.query(User).filter(User.cedula == data.cedula, User.id != user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cedula ya registrada por otro usuario")

    user.full_name = data.full_name
    user.phone = data.phone
    user.cedula = data.cedula
    user.address = data.address
    user.profession = data.profession
    user.latitude = data.latitude
    user.longitude = data.longitude
    user.cedula_locked = True
    user.profile_completed = True

    db.commit()
    db.refresh(user)

    log_action(user.id, "profile_completed", {"full_name": data.full_name}, ip=request.client.host)
    return user


from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    access_token: str


@router.post("/google")
@limiter.limit("5/minute")
def google_login(request: Request, body: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Login/registro con Google OAuth.
    Recibe un access_token del popup de Google y obtiene los datos del usuario.
    """
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth no configurado")

    # Usar el access_token para obtener info del usuario desde Google
    try:
        resp = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {body.access_token}"},
            timeout=10,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Token de Google invalido o expirado")
        info = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al verificar token con Google: {e}")

    google_id = info.get("sub", "")
    email = info.get("email", "")
    name = info.get("name", "")
    picture = info.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="La cuenta de Google no tiene email")

    # Buscar usuario existente por Google ID o email
    user = db.query(User).filter((User.google_id == google_id) | (User.email == email)).first()

    if user:
        # Actualizar google_id si el usuario existe pero no lo tiene
        if not user.google_id:
            user.google_id = google_id
        # Actualizar avatar si no tiene uno
        if not user.avatar_url and picture:
            user.avatar_url = picture
        db.commit()
        db.refresh(user)
    else:
        # Crear usuario nuevo desde Google
        # Generar placeholders para phone y cédula (el usuario puede cambiarlos después)
        import secrets as _secrets

        random_suffix = _secrets.token_hex(4)
        placeholder_phone = f"+google_{random_suffix}"
        placeholder_cedula = f"GOOGLE-{google_id[:12]}"
        # Password aleatorio (nunca se usa, solo para cumplir esquema)
        random_password = _secrets.token_urlsafe(32)
        hashed_password = pwd_context.hash(random_password)

        user = User(
            email=email,
            phone=placeholder_phone,
            full_name=name,
            cedula=placeholder_cedula,
            password_hash=hashed_password,
            google_id=google_id,
            role="worker",
            avatar_url=picture,
            is_active=True,
            profile_completed=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generar JWT tokens
    user.last_login_at = datetime.now(UTC)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)}, db)

    log_action(user.id, "google_login", {"email": email}, ip=request.client.host)

    needs_profile = not user.profile_completed

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "needs_profile": needs_profile,
        "user": UserResponse.model_validate(user),
    }


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        log_action(None, "login_failed", {"email": user.email}, ip=request.client.host)
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    if not pwd_context.verify(user.password, db_user.password_hash):
        log_action(None, "login_failed", {"email": user.email}, ip=request.client.host)
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    access_token = create_access_token({"sub": str(db_user.id)})
    refresh_token = create_refresh_token({"sub": str(db_user.id)}, db)

    # Track last login
    db_user.last_login_at = datetime.now(UTC)
    db.commit()

    log_action(db_user.id, "login_success", ip=request.client.host)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(db_user),
    }


@router.post("/token")
@limiter.limit("5/minute")
def token_login(
    request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Endpoint para Swagger Authorize. Usa email como username."""
    db_user = db.query(User).filter(User.email == form.username).first()
    if not db_user:
        log_action(None, "login_failed", {"email": form.username}, ip=request.client.host)
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    if not pwd_context.verify(form.password, db_user.password_hash):
        log_action(None, "login_failed", {"email": form.username}, ip=request.client.host)
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    access_token = create_access_token({"sub": str(db_user.id)})
    refresh_token = create_refresh_token({"sub": str(db_user.id)}, db)

    # Track last login
    db_user.last_login_at = datetime.now(UTC)
    db.commit()

    log_action(db_user.id, "login_success", ip=request.client.host)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/refresh")
def refresh(request: Request, refresh_token: str, db: Session = Depends(get_db)):
    """Refresca tokens. Valida contra BD y revoca el token anterior (rotación)."""
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.now(UTC),
        )
        .first()
    )

    if not db_token:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    # Revocar el token usado (rotación — cada refresh genera uno nuevo)
    db_token.is_revoked = True
    db.commit()

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)}, db)

    log_action(user.id, "token_refresh", ip=request.client.host)

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.patch("/me", response_model=UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    👤 EDITAR PERFIL

    Actualiza tu nombre y/o teléfono.
    """
    user = db.query(User).filter(User.id == current_user.id).first()

    if request.full_name:
        user.full_name = request.full_name
    if request.phone:
        existing = db.query(User).filter(User.phone == request.phone, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Teléfono ya registrado por otro usuario")
        user.phone = request.phone

    # Cedula: se puede actualizar solo si no está bloqueada
    if request.cedula:
        if user.cedula_locked:
            raise HTTPException(
                status_code=400, detail="La cédula ya fue registrada y no se puede modificar"
            )
        existing = db.query(User).filter(User.cedula == request.cedula, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cédula ya registrada por otro usuario")
        user.cedula = request.cedula
        user.cedula_locked = True

    db.commit()
    db.refresh(user)
    return user


@router.patch("/me/wallet", response_model=UserResponse)
def update_wallet(
    request: UpdateWalletRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    💼 REGISTRAR WALLET

    Guarda tu dirección de wallet en tu perfil.
    Solo podrás retirar USDT a esta dirección.
    """
    user = current_user

    user.wallet_address = request.wallet_address
    db.commit()
    db.refresh(user)
    return user


@router.patch("/me/notification-preferences", response_model=UserResponse)
def update_notification_preferences(
    email_notifications: bool = None,
    push_subscription: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """🔔 Actualizar preferencias de notificación (email + web push)"""
    user = current_user

    if email_notifications is not None:
        user.email_notifications = email_notifications
    if push_subscription is not None:
        user.push_subscription = push_subscription

    db.commit()
    db.refresh(user)
    return user


@router.post("/request-change")
def request_change(
    request: RequestChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    📧 SOLICITAR CAMBIO DE EMAIL/TELÉFONO

    Envía un código de verificación de 6 dígitos a tu correo actual.
    El código expira en 15 minutos.
    """
    from app.services.email_service import send_email

    user = current_user

    if not request.new_email and not request.new_phone and not request.new_wallet:
        raise HTTPException(
            status_code=400, detail="Debes enviar al menos email, teléfono o wallet nuevo"
        )

    # Validar que no estén ya registrados
    if request.new_email and request.new_email != user.email:
        existing = db.query(User).filter(User.email == request.new_email).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Ese email ya está registrado por otro usuario"
            )

    if request.new_phone and request.new_phone != user.phone:
        existing = db.query(User).filter(User.phone == request.new_phone).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Ese teléfono ya está registrado por otro usuario"
            )

    # Generar código de 6 dígitos
    code = str(random.randint(100000, 999999))
    code_hash = hashlib.sha256(code.encode()).hexdigest()

    # Guardar en BD (expira 15 min)
    expires_at = datetime.now(UTC) + timedelta(minutes=15)
    change = ChangeToken(
        user_id=user.id,
        token_hash=code_hash,
        new_email=request.new_email,
        new_phone=request.new_phone,
        new_wallet=request.new_wallet,
        expires_at=expires_at,
    )
    db.add(change)
    db.commit()

    # Enviar email
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<div style="background:#2563EB;padding:24px;border-radius:16px 16px 0 0;text-align:center">
<span style="color:white;font-size:20px;font-weight:700">🔐 TurnoGO</span></div>
<div style="background:#fff;padding:24px;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 16px 16px">
<h2 style="color:#1F2937;margin-top:0;font-size:18px">Código de verificación</h2>
<p style="color:#6B7280;font-size:14px">Usa este código para confirmar los cambios en tu cuenta:</p>
<div style="text-align:center;margin:24px 0">
<div style="display:inline-block;background:#EFF6FF;padding:16px 32px;border-radius:12px;font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563EB">{code}</div>
</div>
<p style="color:#6B7280;font-size:13px">Válido por <strong>15 minutos</strong>. Si no solicitaste este cambio, ignora este mensaje.</p>
</div>
<div style="text-align:center;padding:16px;color:#9CA3AF;font-size:11px">
TurnoGO — © 2026
</div></body></html>"""
    send_email(user.email, "🔐 TurnoGO — Código de verificación", html)

    return {"message": "Código enviado a tu correo", "expires_in": 15}


@router.post("/confirm-change")
def confirm_change(
    request: ConfirmChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    ✅ CONFIRMAR CAMBIO DE EMAIL/TELÉFONO

    Verifica el codigo recibido por correo y aplica los cambios.
    """
    user = current_user

    # Buscar el token pendiente más reciente
    change_request = (
        db.query(ChangeToken)
        .filter(
            ChangeToken.user_id == user.id,
            ChangeToken.used == False,
            ChangeToken.expires_at > datetime.now(UTC),
        )
        .order_by(ChangeToken.created_at.desc())
        .first()
    )

    if not change_request:
        raise HTTPException(status_code=400, detail="No hay cambios pendientes o el código expiró")

    # Verificar código
    code_hash = hashlib.sha256(request.token.encode()).hexdigest()
    if code_hash != change_request.token_hash:
        raise HTTPException(status_code=400, detail="Código incorrecto")

    # Aplicar cambios
    cambios = []
    if change_request.new_email and change_request.new_email != user.email:
        existing = db.query(User).filter(User.email == change_request.new_email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ese email ya está registrado")
        user.email = change_request.new_email
        cambios.append("email")

    if change_request.new_phone and change_request.new_phone != user.phone:
        existing = db.query(User).filter(User.phone == change_request.new_phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ese teléfono ya está registrado")
        user.phone = change_request.new_phone
        cambios.append("teléfono")

    if change_request.new_wallet and change_request.new_wallet != user.wallet_address:
        user.wallet_address = change_request.new_wallet
        cambios.append("wallet")

    # Marcar token como usado
    change_request.used = True
    db.commit()
    db.refresh(user)

    return {
        "message": f"Cambios aplicados: {' y '.join(cambios)} actualizado(s) correctamente",
        "user": user,
    }


# ═══════════════════════════════════════════════════════════
# Email Verification
# ═══════════════════════════════════════════════════════════


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify email address using the token sent after registration.
    Token expires in 24 hours.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "email_verify":
            raise HTTPException(status_code=400, detail="Token invalido")
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=400, detail="Token invalido o expirado")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.email_verified:
        return {"message": "El email ya estaba verificado", "verified": True}

    user.email_verified = True
    user.email_verification_token = None
    db.commit()

    log_action(user.id, "email_verified", ip=None)

    return {"message": "Email verificado correctamente", "verified": True}


@router.post("/resend-verification")
@limiter.limit("1/minute")
def resend_verification(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Resend email verification link.
    Limited to 1 request per minute to prevent abuse.
    """
    user = current_user

    if user.email_verified:
        return {"message": "El email ya esta verificado"}

    from app.services.email_service import send_email

    verify_token = create_access_token({"sub": str(user.id), "purpose": "email_verify"})
    user.email_verification_token = verify_token
    db.commit()

    settings = get_settings()
    verify_link = f"{settings.APP_URL or 'http://localhost:8000'}/api/v1/auth/verify-email?token={verify_token}"
    verify_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<div style="background:#2563EB;padding:24px;border-radius:16px 16px 0 0;text-align:center">
<span style="color:white;font-size:20px;font-weight:700">TurnoGO</span></div>
<div style="background:#fff;padding:24px;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 16px 16px">
<h2 style="color:#1F2937;margin-top:0">Verifica tu cuenta</h2>
<p style="color:#6B7280;font-size:14px">Haz clic para verificar tu email:</p>
<div style="text-align:center;margin:24px 0">
<a href="{verify_link}" style="display:inline-block;background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">Verificar Email</a>
</div>
<p style="color:#9CA3AF;font-size:12px">Este enlace expira en 24 horas.</p>
</div>
</body></html>"""
    send_email(user.email, "Verifica tu cuenta de TurnoGO", verify_html)

    log_action(user.id, "verification_resent", ip=request.client.host)

    return {"message": "Email de verificacion reenviado"}


# ══════════════════════════════════════════════════════════
# PASSWORD RESET (Fase 10.2)
# ══════════════════════════════════════════════════════════

RESET_TOKEN_EXPIRE_HOURS = 1


@router.post("/forgot-password")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Solicitar recuperacion de contraseña.
    Envia un email con un enlace de reset (solo si el usuario existe).
    Siempre responde igual para evitar enumeracion de usuarios.
    """
    user = db.query(User).filter(User.email == body.email).first()

    if not user or not user.is_active:
        # Siempre responder igual — no revelar si el email existe
        # Pero log si era un email valido
        if user:
            logger.info("Password reset requested for inactive user", extra={"user_id": user.id})
        else:
            logger.info(
                "Password reset requested for unknown email",
                extra={"email_hint": body.email[:3] + "***"},
            )
        return {
            "message": "Si tu email esta registrado, recibiras un enlace de recuperacion en unos minutos."
        }

    # Invalidar tokens anteriores de tipo PASSWORD_RESET
    db.query(ChangeToken).filter(
        ChangeToken.user_id == user.id,
        ChangeToken.token_type == "PASSWORD_RESET",
        ChangeToken.used == False,
    ).update({"used": True})

    # Generar token seguro
    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)

    change_token = ChangeToken(
        user_id=user.id,
        token_hash=pwd_context.hash(raw_token),
        token_type="PASSWORD_RESET",
        expires_at=expires_at,
    )
    db.add(change_token)
    db.commit()

    # Construir link de reset
    s = get_settings()
    frontend_url = s.FRONTEND_URL.rstrip("/")
    reset_link = f"{frontend_url}/auth/reset-password?token={raw_token}"

    # Enviar email
    reset_html = f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<div style="background:#2563EB;padding:24px;border-radius:16px 16px 0 0;text-align:center">
<span style="color:white;font-size:20px;font-weight:700">TurnoGO</span></div>
<div style="background:#fff;padding:24px;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 16px 16px">
<h2 style="color:#1F2937;margin-top:0">Recupera tu contraseña</h2>
<p style="color:#6B7280;font-size:14px">Haz clic para crear una nueva contraseña:</p>
<div style="text-align:center;margin:24px 0">
<a href="{reset_link}" style="display:inline-block;background:#2563EB;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">Restablecer Contraseña</a>
</div>
<p style="color:#9CA3AF;font-size:12px">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.</p>
</div>
</body></html>"""

    try:
        from app.services.email_service import send_email

        ok = send_email(user.email, "Recupera tu contraseña — TurnoGO", reset_html)
        if not ok:
            logger.warning(f"PASSWORD_RESET_EMAIL_FAILED user={user.id} send_email returned False")
    except Exception as e:
        logger.exception(f"PASSWORD_RESET_EMAIL_EXCEPTION user={user.id} error={e}")

    log_action(
        user.id,
        "password_reset_requested",
        ip=request.client.host,
    )

    logger.info(
        "Password reset token created", extra={"user_id": user.id, "token_type": "PASSWORD_RESET"}
    )

    return {
        "message": "Si tu email esta registrado, recibiras un enlace de recuperacion en unos minutos."
    }


@router.post("/reset-password")
@limiter.limit("1/5minutes")
def reset_password(request: Request, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Ejecutar el reset de contraseña con un token valido.
    """
    # Validar nueva contraseña (minimo 8 chars)
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 8 caracteres",
        )

    # Buscar tokens PASSWORD_RESET no usados
    tokens = (
        db.query(ChangeToken)
        .filter(
            ChangeToken.token_type == "PASSWORD_RESET",
            ChangeToken.used == False,
        )
        .all()
    )

    # Buscar el que haga match con el token
    valid_token = None
    user = None
    for ct in tokens:
        if pwd_context.verify(body.token, ct.token_hash):
            valid_token = ct
            user = db.query(User).filter(User.id == ct.user_id).first()
            break

    if not valid_token or not user:
        logger.warning("Invalid password reset token used")
        raise HTTPException(
            status_code=400,
            detail="Token invalido o expirado. Solicita un nuevo enlace de recuperacion.",
        )

    # Verificar expiracion
    now_naive = datetime.utcnow()
    expires_naive = (
        valid_token.expires_at.replace(tzinfo=None)
        if valid_token.expires_at.tzinfo
        else valid_token.expires_at
    )
    if now_naive > expires_naive:
        valid_token.used = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="El enlace de recuperacion expiro. Solicita uno nuevo.",
        )

    # Verificar que no es la misma contraseña
    if pwd_context.verify(body.new_password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña no puede ser igual a la anterior",
        )

    # Cambiar contraseña
    user.password_hash = pwd_context.hash(body.new_password)

    # Invalidar token
    valid_token.used = True

    # Invalidar todos los refresh tokens del usuario (forzar re-login)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()

    log_action(
        user.id,
        "password_reset_completed",
        ip=request.client.host,
    )

    logger.info("Password reset completed", extra={"user_id": user.id})

    db.commit()

    return {"message": "Contraseña cambiada exitosamente. Inicia sesion con tu nueva contraseña."}


# ═══════════════════════════════════════════════════════════
# Dependency: require verified email for critical actions
# ═══════════════════════════════════════════════════════════


def require_verified_email(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires email to be verified before critical actions.
    Allows all users to log in, but blocks critical actions for unverified emails.
    """
    if not current_user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Debes verificar tu email antes de realizar esta accion. Revisa tu bandeja de entrada.",
        )

    return current_user
