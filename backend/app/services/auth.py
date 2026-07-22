from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.database import SessionLocal
from app.models.user import User
from app.config import get_settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

_settings = get_settings()
SECRET_KEY = _settings.SECRET_KEY
ALGORITHM = _settings.ALGORITHM


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # -- Dev-token guard --
    # Reject dev-* tokens in production.
    # In development, dev-tokens are allowed as mock bypasses.
    if token.startswith("dev-"):
        settings = get_settings()  # Lazy: always reads current ENVIRONMENT
        if settings.ENVIRONMENT == "production":
            raise HTTPException(status_code=401, detail="Dev tokens are not allowed in production")
        # In development: dev tokens are valid mock bypasses (for testing only)
        try:
            user_id_str = token[4:]  # Remove "dev-" prefix
            user_id = int(user_id_str)
        except (ValueError, IndexError):
            raise HTTPException(status_code=401, detail="Invalid dev token format. Use: dev-{user_id}")
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return user

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

    return user


def get_current_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user
