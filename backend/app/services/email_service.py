"""
Servicio de envío de emails con Resend.
"""
import os
import resend

FROM_EMAIL = "TurnoGO <onboarding@resend.dev>"


def send_email(to: str, subject: str, html: str) -> bool:
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        print(f"[EMAIL] Sin RESEND_API_KEY")
        return False
    try:
        resend.api_key = api_key
        resend.Emails.send({"from": FROM_EMAIL, "to": to, "subject": subject, "html": html})
        print(f"[EMAIL] OK -> {to}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] Error: {e}")
        return False


def send_notification_email(to: str, event: str, message: str) -> bool:
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
<html><head><meta charset="utf-8"></head>
<body style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<div style="background:#2563EB;padding:24px;border-radius:16px 16px 0 0;text-align:center">
<span style="color:white;font-size:20px;font-weight:700">TurnoGO</span></div>
<div style="background:#fff;padding:24px;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 16px 16px">
<p style="font-size:16px;color:#1E293B;line-height:1.6">{message}</p>
<a href="https://freelance-web-beta.vercel.app/dashboard" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:16px">Ir a TurnoGO</a>
<p style="margin-top:16px;font-size:11px;color:#94A3B8">Recibiste este email porque tienes notificaciones activadas en TurnoGO.</p>
</div></body></html>"""
    return send_email(to, subject, html)
