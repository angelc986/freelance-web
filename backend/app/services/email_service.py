"""
Servicio de envío de emails con Resend.
Usa RESEND_API_KEY del entorno. Sin API key = no-op silencioso.
"""
import os
import resend
from app.config import get_settings

settings = get_settings()
resend.api_key = os.getenv("RESEND_API_KEY", "")

FROM_EMAIL = "TurnoGO <notificaciones@turnogo.com>"


def send_email(to: str, subject: str, html: str) -> bool:
    """Envía un email transaccional. Retorna True si se envió, False si no."""
    if not resend.api_key:
        print(f"[EMAIL] Sin RESEND_API_KEY — email a {to} no enviado")
        return False

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html,
        })
        print(f"[EMAIL] Enviado a {to}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] Error enviando a {to}: {e}")
        return False


def send_notification_email(to: str, event: str, message: str) -> bool:
    """Template de email para notificaciones de la plataforma."""
    subject_map = {
        "job_assigned": "🎉 ¡Te contrataron!",
        "job_applied": "👋 Alguien aplicó a tu trabajo",
        "job_completed": "✅ Trabajo completado",
        "payment_received": "💰 Recibiste un pago",
        "new_message": "💬 Nuevo mensaje",
        "job_cancelled": "⚠️ Trabajo cancelado",
    }
    subject = subject_map.get(event, f"📢 TurnoGO — {message}")

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Inter,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#2563EB,#1D4ED8);padding:24px;border-radius:16px 16px 0 0;text-align:center">
    <span style="color:white;font-size:20px;font-weight:700">TurnoGO</span>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 16px 16px">
    <p style="font-size:16px;color:#1E293B;line-height:1.6">{message}</p>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E2E8F0">
      <a href="https://freelance-web-beta.vercel.app/dashboard"
         style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px">
        Ir a TurnoGO
      </a>
    </div>
    <p style="margin-top:16px;font-size:11px;color:#94A3B8">
      Recibiste este email porque tienes notificaciones activadas en TurnoGO.
      <br><a href="https://freelance-web-beta.vercel.app/dashboard/settings" style="color:#2563EB">Configurar preferencias</a>
    </p>
  </div>
</body>
</html>"""
    return send_email(to, subject, html)
