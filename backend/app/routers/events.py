from fastapi import APIRouter, Depends, Request, Query, HTTPException
from fastapi.responses import StreamingResponse
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.services.event_manager import event_generator
from app.services.auth import SECRET_KEY, ALGORITHM, get_current_user as _get_current_user
from app.config import get_settings

router = APIRouter(tags=["events"])

def _get_user_from_token(token: str = Query(...)) -> User:
    """Obtiene el usuario desde un token JWT. Usado para SSE (no puede usar headers)."""
    # Dev-token guard (same as get_current_user)
    if token.startswith("dev-"):
        settings = get_settings()
        if settings.ENVIRONMENT == "production":
            raise HTTPException(status_code=401, detail="Dev tokens are not allowed in production")
        try:
            user_id = int(token[4:])
        except (ValueError, IndexError):
            raise HTTPException(status_code=401, detail="Invalid dev token format")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user is None:
                raise HTTPException(status_code=401, detail="Usuario no encontrado")
            return user
        finally:
            db.close()

@router.get("/api/v1/events")
async def sse_events(
    request: Request,
    current_user: User = Depends(_get_user_from_token),
):
    """SSE endpoint para notificaciones en tiempo real."""
    return StreamingResponse(
        event_generator(current_user.id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
