import json

from app.database import SessionLocal
from app.models.audit_log import AuditLog


def log_action(
    user_id: int | None, action: str, details: dict | None = None, ip: str | None = None
):
    """Registra una acción sensible en la tabla audit_logs."""
    db = SessionLocal()
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            details=json.dumps(details) if details else None,
            ip_address=ip,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"[AUDIT ERROR] {e}")
    finally:
        db.close()
