"""Seed: crea un usuario administrador."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from passlib.context import CryptContext

from app.database import Base, SessionLocal, engine
from app.models.user import User

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

Base.metadata.create_all(bind=engine)

db = SessionLocal()

admin = db.query(User).filter(User.is_admin == True).first()
if admin:
    print("OK Admin ya existe: " + admin.email)
else:
    admin = User(
        email="admin@turnogo.com",
        phone="+584120000000",
        full_name="Admin TurnoGO",
        cedula="V-00000000",
        password_hash=pwd_ctx.hash("Admin123!"),
        role="both",
        is_admin=True,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print("OK Admin creado: admin@turnogo.com / Admin123!")

db.close()
