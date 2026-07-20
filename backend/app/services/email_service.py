"""
Servicio de envío de emails — SMTP Gmail (gratis, sin dominio) + Resend fallback.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def _send_smtp(to: str, subject: str, html: str) -> bool:
    """Envía vía SMTP Gmail. Sin costo, sin dominio. Solo necesita app password."""
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASS", "")

    if not user or not password:
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"TurnoGO <{user}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(user, to, msg.as_string())

        print(f"[EMAIL] SMTP -> {to}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] SMTP error: {e}")
        return False


def _send_resend(to: str, subject: str, html: str) -> bool:
    """Fallback con Resend API si hay API key configurada."""
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        return False
    try:
        import resend
        resend.api_key = api_key
        resend.Emails.send({
            "from": "TurnoGO <onboarding@resend.dev>",
            "to": to, "subject": subject, "html": html,
        })
        print(f"[EMAIL] Resend -> {to}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] Resend error ({to}): {e}")
        return False


def send_email(to: str, subject: str, html: str) -> bool:
    """Envía email: primero SMTP, si falla intenta Resend."""
    if _send_smtp(to, subject, html):
        return True
    return _send_resend(to, subject, html)


def send_notification_email(to: str, event: str, message: str) -> bool:
    """Template de email para notificaciones."""
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
