from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.user import User
from app.models.notification import Notification
from app.services.auth import get_current_user
from app.services.email_service import send_notification_email
from app.services.push_service import send_push
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
    """Crea una notificacion en la base de datos y dispara email + push."""
    db = SessionLocal()
    try:
        n = Notification(user_id=user_id, event=event, message=message, data=data)
        db.add(n)
        db.commit()

        # Obtener datos del usuario para email y push
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            # Email (si tiene preferencia activada)
            if user.email_notifications:
                send_notification_email(user.email, event, message)

            # Web Push (si tiene suscripción guardada)
            if user.push_subscription:
                send_push(user.push_subscription, "TurnoGO", message, "/dashboard")

    except Exception as e:
        print(f"Error creating notification: {e}")
    finally:
        db.close()


@router.get("/notifications/debug")
def debug_notifications():
    """Diagnóstico de configuración de notificaciones"""
    import os
    rk = os.getenv("RESEND_API_KEY", "")
    vp = os.getenv("VAPID_PRIVATE_KEY", "")
    vu = os.getenv("VAPID_PUBLIC_KEY", "")
    return {
        "resend_ok": bool(rk),
        "resend_len": len(rk),
        "vapid_ok": bool(vp and vu),
        "vapid_priv_len": len(vp),
        "vapid_pub_len": len(vu),
    }


@router.get("/notifications/test", response_model=dict)
def send_test_notification(current_user: User = Depends(get_current_user)):
    """🧪 Envía notificación de prueba al usuario autenticado"""
    create_notification(
        user_id=current_user.id,
        event="test_notification",
        message="🔔 ¡Notificación de prueba de TurnoGO! Si estás viendo esto, tus notificaciones están funcionando correctamente.",
    )
    return {
        "ok": True,
        "message": "Notificación de prueba enviada",
        "email": current_user.email,
        "email_enabled": current_user.email_notifications,
        "has_push": current_user.push_subscription is not None,
    }


@router.get("/notifications/test/{user_id}")
def admin_send_test_notification(
    user_id: int,
    secret: str = Query(None),
    db: Session = Depends(get_db),
):
    """Envía notificación de prueba con diagnóstico completo"""
    if secret != "turnogo-test-2026":
        raise HTTPException(status_code=403, detail="Se requieren permisos")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    results = {}

    # 1. Email directo con Resend
    try:
        import os, resend
        key = os.getenv("RESEND_API_KEY", "")
        resend.api_key = key
        r = resend.Emails.send({
            "from": "TurnoGO <onboarding@resend.dev>",
            "to": target.email,
            "subject": "🔔 TurnoGO — Notificación de prueba",
            "html": "<h2>¡Funciona!</h2><p>Notificación de TurnoGO enviada correctamente.</p>",
        })
        results["email"] = f"OK (id={r.get('id','?')})"
    except Exception as e:
        results["email"] = f"ERROR: {str(e)[:300]}"

    # 2. Push
    try:
        if target.push_subscription:
            from app.services.push_service import send_push
            ok = send_push(target.push_subscription, "TurnoGO", "¡Notificación de prueba!", "/dashboard")
            results["push"] = "OK" if ok else "FAIL (ver logs)"
        else:
            results["push"] = "NO_SUBSCRIPTION"
    except Exception as e:
        results["push"] = f"ERROR: {str(e)[:300]}"

    # 3. BD
    create_notification(user_id=user_id, event="test_notification",
                        message="🔔 ¡Notificación de prueba de TurnoGO!")

    return {"target": target.email, **results}


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
