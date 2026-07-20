"""
Servicio de Web Push Notifications.
Usa pywebpush para enviar notificaciones push a navegadores suscritos.
"""
import json
import os
from typing import Optional

from pywebpush import webpush, WebPushException
from app.config import get_settings

settings = get_settings()

# VAPID keys — generar con: openssl ecparam -genkey -name prime256v1 -out private.pem
# Para desarrollo usamos keys del entorno. En producción, generar keys propias.
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {"sub": "mailto:notificaciones@turnogo.com"}


def send_push(subscription_json: str, title: str, body: str, url: str = "/dashboard") -> bool:
    """
    Envía una notificación push a un suscriptor.
    
    Args:
        subscription_json: JSON string con la PushSubscription del navegador
        title: Título de la notificación
        body: Cuerpo de la notificación  
        url: URL a abrir al hacer clic
    
    Returns: True si se envió, False si no.
    """
    if not VAPID_PRIVATE_KEY:
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
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
            timeout=10,
        )
        print(f"[PUSH] Enviado: {title}")
        return True
    except WebPushException as e:
        print(f"[PUSH] Error: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"[PUSH] Response: {e.response.status_code} {e.response.text}")
        return False
    except Exception as e:
        print(f"[PUSH] Error inesperado: {e}")
        return False
