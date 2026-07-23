import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, SessionLocal, engine
from app.models.user import User
from app.services.auth import pwd_context

Base.metadata.create_all(bind=engine)
db = SessionLocal()

db.query(User).filter(User.email == "admin@turnogo.com").delete()
db.commit()

u = User(
    email="admin@turnogo.com",
    phone="+584120000000",
    full_name="Admin TurnoGO",
    cedula="V-00000000",
    password_hash=pwd_context.hash("Admin123!"),
    role="both",
    is_admin=True,
    is_active=True,
)
db.add(u)
db.commit()
db.close()
