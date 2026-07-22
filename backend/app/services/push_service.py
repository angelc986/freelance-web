"""
Servicio de Web Push Notifications — Multi-dispositivo.
Envía a todas las suscripciones push de un usuario.
Elimina automáticamente suscripciones expiradas (410 Gone).
"""
import json
import os
from typing import Optional

from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.models.push_subscription import PushSubscription

settings = get_settings()
VAPID_CLAIMS = {"sub": "mailto:notificaciones@turnogo.com"}


def _send_to_one(subscription_json: str, title: str, body: str, url: str = "/dashboard") -> bool:
    """
    Envía a una única suscripción. Retorna True si OK, False si falló.
    """
    vapid_private = settings.VAPID_PRIVATE_KEY
    if not vapid_private:
        print("[PUSH] Sin VAPID_PRIVATE_KEY — push no enviado")
        return False

    try:
        subscription = json.loads(subscription_json)
        data = json.dumps({
            "title": title,
            "body": body,
            "icon": "/icons/icon-192x192.png",
            "badge": "/icons/icon-192x192.png",
            "data": {"url": url},
            "actions": [
                {"action": "open", "title": "Ver"},
            ],
        })

        webpush(
            subscription_info=subscription,
            data=data,
            vapid_private_key=vapid_private,
            vapid_claims=VAPID_CLAIMS,
            timeout=10,
        )
        print(f"[PUSH] Enviado: {title}")
        return True
    except WebPushException as e:
        if hasattr(e, "response") and e.response is not None:
            status = e.response.status_code
            body_text = e.response.text[:200]
            print(f"[PUSH] Error HTTP {status}: {body_text}")
            # 410 Gone = suscripción expirada / inválida
            if status == 410:
                return "GONE"
        else:
            print(f"[PUSH] WebPushException: {e}")
        return False
    except Exception as e:
        print(f"[PUSH] Error inesperado: {e}")
        return False


def send_to_user(user_id: int, title: str, body: str, url: str = "/dashboard", db: Optional[Session] = None) -> int:
    """
    Envía notificación push a TODAS las suscripciones de un usuario.
    Retorna cantidad de envíos exitosos.
    Elimina automáticamente suscripciones expiradas (410 Gone).
    """
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True

    try:
        subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
        if not subs:
            print(f"[PUSH] User {user_id}: sin suscripciones push")
            return 0

        sent = 0
        expired: list[int] = []  # ids de suscripciones a eliminar

        for sub in subs:
            sub_json = json.dumps({
                "endpoint": sub.endpoint,
                "keys": {
                    "auth": sub.auth,
                    "p256dh": sub.p256dh,
                },
                # expirationTime puede ser null, pywebpush lo tolera
            })

            result = _send_to_one(sub_json, title, body, url)
            if result is True:
                sent += 1
            elif result == "GONE":
                expired.append(sub.id)

        # Limpiar suscripciones expiradas
        if expired:
            db.query(PushSubscription).filter(PushSubscription.id.in_(expired)).delete(synchronize_session=False)
            db.commit()
            print(f"[PUSH] Limpiadas {len(expired)} suscripciones expiradas del user {user_id}")

        return sent
    finally:
        if own_session:
            db.close()


# ─── Backward compat ───
def send_push(subscription_json: str, title: str, body: str, url: str = "/dashboard") -> bool:
    """
    (Legacy) Envía a una sola suscripción. Mantenido para compatibilidad.
    Usar send_to_user() para multi-dispositivo.
    """
    return _send_to_one(subscription_json, title, body, url) is True
