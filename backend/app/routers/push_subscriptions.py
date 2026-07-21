"""
API endpoints para gestionar suscripciones push multi-dispositivo.
POST  /api/v1/push/subscribe   → agregar suscripción del dispositivo actual
DELETE /api/v1/push/subscribe   → eliminar suscripción (por endpoint)
GET   /api/v1/push/subscriptions → listar dispositivos suscritos
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import SessionLocal
from app.models.user import User
from app.models.push_subscription import PushSubscription
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/v1/push", tags=["push"])


class PushKeys(BaseModel):
    auth: str
    p256dh: str


class PushSubscriptionIn(BaseModel):
    endpoint: str
    keys: PushKeys


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/subscribe")
def add_push_subscription(
    data: PushSubscriptionIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Agrega una suscripción push para el usuario autenticado.
    Si el endpoint ya existe (otro dispositivo lo registró), se actualiza.
    """
    # Verificar si el endpoint ya está registrado
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint
    ).first()

    if existing:
        # Actualizar keys (podrían haber cambiado)
        existing.auth = data.keys.auth
        existing.p256dh = data.keys.p256dh
        if existing.user_id != current_user.id:
            # El endpoint pertenecía a otro usuario — reasignar
            existing.user_id = current_user.id
        db.commit()
        return {"ok": True, "action": "updated"}
    
    # Crear nueva suscripción
    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=data.endpoint,
        auth=data.keys.auth,
        p256dh=data.keys.p256dh,
    )
    db.add(sub)
    db.commit()
    return {"ok": True, "action": "created"}


@router.delete("/subscribe")
def remove_push_subscription(
    endpoint: str = Query(..., description="Endpoint de la suscripción a eliminar"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Elimina una suscripción push por su endpoint.
    Solo el dueño de la suscripción puede eliminarla.
    """
    sub = db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint,
        PushSubscription.user_id == current_user.id,
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")

    db.delete(sub)
    db.commit()
    return {"ok": True}


@router.get("/subscriptions")
def list_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista todos los dispositivos suscritos del usuario autenticado.
    """
    subs = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id
    ).order_by(PushSubscription.created_at.desc()).all()

    return {
        "subscriptions": [
            {
                "id": s.id,
                "endpoint_preview": s.endpoint[:50] + "...",
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in subs
        ],
        "count": len(subs),
    }
