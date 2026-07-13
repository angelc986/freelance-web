"""
Script para activar admin en Railway.
Correr: python seed_admin.py
"""
import os
import sys

# Asegurar que podemos importar app/
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == "admin@turnogo.com").first()

if user:
    user.is_admin = True
    db.commit()
    print(f"✅ Admin activado! User ID: {user.id}, Email: {user.email}")
else:
    print("❌ Usuario no encontrado. Registra admin@turnogo.com primero.")

db.close()
