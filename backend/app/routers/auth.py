from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

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


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    db_user = db.query(User).filter(User.cedula == user.cedula).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Cédula ya registrada")

    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        email=user.email,
        phone=user.phone,
        full_name=user.full_name,
        cedula=user.cedula,
        password_hash=hashed_password,
        role=user.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    if not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    access_token = create_access_token({"sub": str(db_user.id)})
    refresh_token = create_refresh_token({"sub": str(db_user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(db_user),
    }


@router.post("/token")
def token_login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Endpoint para Swagger Authorize. Usa email como username."""
    db_user = db.query(User).filter(User.email == form.username).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    if not pwd_context.verify(form.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    access_token = create_access_token({"sub": str(db_user.id)})
    refresh_token = create_refresh_token({"sub": str(db_user.id)})

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
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }
