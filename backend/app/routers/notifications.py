from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.user import User
from app.models.notification import Notification
from app.services.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: int
    event: str
    message: str
    data: dict | None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_notification(user_id: int, event: str, message: str, data: dict | None = None):
    """Crea una notificacion en la base de datos."""
    db = SessionLocal()
    try:
        n = Notification(user_id=user_id, event=event, message=message, data=data)
        db.add(n)
        db.commit()
    except Exception as e:
        print(f"Error creating notification: {e}")
    finally:
        db.close()

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene las notificaciones del usuario actual (ultimas 3 dias)."""
    cutoff = datetime.utcnow() - timedelta(days=3)
    notifs = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.created_at >= cutoff,
        )
        .order_by(desc(Notification.created_at))
        .limit(limit)
        .all()
    )
    return notifs

@router.put("/notifications/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca una notificacion como leida."""
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    n.read = True
    db.commit()
    return {"ok": True}

@router.put("/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca todas las notificaciones como leidas."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False,
    ).update({"read": True})
    db.commit()
    return {"ok": True}

@router.get("/notifications/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cantidad de notificaciones sin leer."""
    cutoff = datetime.utcnow() - timedelta(days=3)
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False,
        Notification.created_at >= cutoff,
    ).count()
    return {"count": count}
