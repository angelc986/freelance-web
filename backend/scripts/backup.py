"""Backup automático de la base de datos SQLite.
Programar en Windows Task Scheduler para ejecución diaria.

Cómo programar en Task Scheduler:
1. Open Task Scheduler
2. Create Task → Name: "TurnoGO Backup DB"
3. Trigger: Daily, 4:00 AM
4. Action: Start a program
   - Program: C:\Users\yochi\Desktop\freelance-web\backend\venv\Scripts\python.exe
   - Arguments: C:\Users\yochi\Desktop\freelance-web\backend\scripts\backup.py
"""

import shutil
import os
from datetime import datetime

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "..", "backups")
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "freelance.db")

os.makedirs(BACKUP_DIR, exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_path = os.path.join(BACKUP_DIR, f"freelance_{timestamp}.db")

shutil.copy2(DB_PATH, backup_path)
print(f"✅ Backup creado: {backup_path}")

# Limpiar backups > 7 días
cleaned = 0
for f in os.listdir(BACKUP_DIR):
    path = os.path.join(BACKUP_DIR, f)
    if os.path.isfile(path) and f.endswith(".db"):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(path))
        if age.days > 7:
            os.remove(path)
            cleaned += 1
            print(f"🗑️ Backup viejo eliminado: {f}")

print(f"\n📊 Total: 1 creado, {cleaned} limpiados")
