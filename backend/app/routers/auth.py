import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.database import SessionLocal
from app.limiter import limiter
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserCreate, UserLogin, UserResponse, UpdateProfileRequest, UpdateWalletRequest, CompleteProfileRequest
from app.services.audit import log_action
from app.config import get_settings

import requests as http_requests

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "***"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


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
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

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

    log_action(db_user.id, "register_success", {"role": user.role}, ip=request.client.host)
    return db_user



@router.patch("/complete-profile", response_model=UserResponse)
@limiter.limit("5/minute")
def complete_profile(
    request: Request,
    data: CompleteProfileRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Step 2: Complete user profile with name, phone, cedula"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Validate phone uniqueness
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
    user = db.query(User).filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()

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

    log_action(db_user.id, "login_success", ip=request.client.host)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(db_user),
    }


@router.post("/token")
def token_login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
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

    log_action(db_user.id, "login_success", ip=request.client.host)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return UserResponse.model_validate(user)


@router.post("/refresh")
def refresh(request: Request, refresh_token: str, db: Session = Depends(get_db)):
    """Refresca tokens. Valida contra BD y revoca el token anterior (rotación)."""
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False,
        RefreshToken.expires_at > datetime.now(timezone.utc),
    ).first()

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
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    👤 EDITAR PERFIL
    
    Actualiza tu nombre y/o teléfono.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

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
            raise HTTPException(status_code=400, detail="La cédula ya fue registrada y no se puede modificar")
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
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    💼 REGISTRAR WALLET
    
    Guarda tu dirección de wallet en tu perfil.
    Solo podrás retirar USDT a esta dirección.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.wallet_address = request.wallet_address
    db.commit()
    db.refresh(user)
    return user

