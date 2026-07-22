"""
Servicio de envío de emails — SendGrid + fallback SMTP Gmail + Resend.
Configuración por variables de entorno:
  SENDGRID_API_KEY (principal, gratis 100/día, sin dominio)
  SMTP_USER / SMTP_PASS (fallback Gmail app password)
  RESEND_API_KEY (fallback, requiere dominio verificado)
"""
import os
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError


from app.config import get_settings


def _send_sendgrid(to: str, subject: str, html: str) -> bool:
    """Envía vía SendGrid API. Gratis 100 emails/día, sin dominio necesario."""
    key = get_settings().SENDGRID_API_KEY
    if not key:
        return False
    try:
        data = json.dumps({
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": "instaworkve@gmail.com", "name": "TurnoGO"},
            "subject": subject,
            "content": [{"type": "text/html", "value": html}],
        }).encode("utf-8")
        req = Request(
            "https://api.sendgrid.com/v3/mail/send",
            data=data,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
        )
        with urlopen(req, timeout=15) as resp:
            print(f"[EMAIL] SendGrid -> {to}: {subject} (HTTP {resp.status})")
            return True
    except HTTPError as e:
        body = e.read().decode()[:200]
        print(f"[EMAIL] SendGrid HTTP {e.code}: {body}")
        return False
    except Exception as e:
        print(f"[EMAIL] SendGrid error: {e}")
        return False


def _send_smtp(to: str, subject: str, html: str) -> bool:
    """Fallback vía SMTP Gmail."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

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
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as s:
            s.starttls()
            s.login(user, password)
            s.sendmail(user, to, msg.as_string())
        print(f"[EMAIL] SMTP -> {to}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] SMTP error: {e}")
        return False


def _send_resend(to: str, subject: str, html: str) -> bool:
    """Fallback vía Resend API."""
    api_key = get_settings().RESEND_API_KEY
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
        print(f"[EMAIL] Resend error: {e}")
        return False


def send_email(to: str, subject: str, html: str) -> bool:
    """Envía email: SendGrid → SMTP → Resend."""
    if _send_sendgrid(to, subject, html):
        return True
    if _send_smtp(to, subject, html):
        return True
    return _send_resend(to, subject, html)


def send_notification_email(to: str, event: str, message: str) -> bool:
    """Template de email para notificaciones."""
    subject_map = {
        "job_assigned": "Has sido contratado en TurnoGO",
        "job_applied": "Nuevo candidato para tu trabajo",
        "job_completed": "Trabajo completado en TurnoGO",
        "payment_received": "Pago recibido en TurnoGO",
        "new_message": "Nuevo mensaje en TurnoGO",
        "job_cancelled": "Trabajo cancelado en TurnoGO",
    }
    subject = subject_map.get(event, f"TurnoGO — {message}")

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
