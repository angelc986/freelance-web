"""
Migración mínima: agrega columna google_id a la tabla users.
SQLite soporta ALTER TABLE ADD COLUMN para columnas nullable.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.database import engine

def migrate():
    conn = engine.connect()
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)"))
        conn.commit()
        print("[OK] Columna google_id agregada a users")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            print("[INFO] Columna google_id ya existe")
        else:
            print(f"[WARN] {e}")
    conn.close()

if __name__ == "__main__":
    migrate()
