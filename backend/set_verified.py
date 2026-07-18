from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
db.execute(text("UPDATE users SET is_verified=1, didit_session_id=NULL WHERE id=12"))
db.commit()
print("OK - verified")
db.close()
