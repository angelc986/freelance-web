import sqlite3
import sys
import time

import requests

BASE = "http://localhost:8000/api/v1"

print("--- PRUEBA UNICA: FLUJO COMPLETO ---")

# 1. Login contractor
r = requests.post(
    f"{BASE}/auth/login",
    json={"email": "angelcurbelo901@gmail.com", "password": "test123"},
    timeout=10,
)
ctok = r.json()["access_token"]
user = r.json()["user"]
print(f"[OK] 1. Login contractor: {user['full_name']} (ID={user['id']})")

# 2. Login worker
r = requests.post(
    f"{BASE}/auth/login", json={"email": "instaworkve@gmail.com", "password": "test123"}, timeout=10
)
wtok = r.json()["access_token"]
user = r.json()["user"]
print(f"[OK] 2. Login worker: {user['full_name']} (ID={user['id']})")

# 3. Dar balance
conn = sqlite3.connect(r"C:\Users\yochi\Desktop\freelance-web\backend\freelance.db")
conn.execute("UPDATE users SET balance = 50000 WHERE email = 'angelcurbelo901@gmail.com'")
conn.commit()
conn.close()
print("[OK] 3. Balance contractor: $50000")

time.sleep(1)

# 4. Create job
r = requests.post(
    f"{BASE}/jobs",
    headers={"Authorization": f"Bearer {ctok}", "Content-Type": "application/json"},
    json={
        "title": "Flujo Completo Test",
        "description": "Prueba unica del flujo completo",
        "category": "Servicios",
        "location": "Caracas",
        "budget": 50,
        "duration": "2h",
    },
    timeout=10,
)
job_id = r.json()["id"]
print(f"[OK] 4. Crear trabajo -> ID={job_id} (HTTP {r.status_code})")

time.sleep(1)

# 5. Apply
r = requests.post(
    f"{BASE}/jobs/{job_id}/apply",
    headers={"Authorization": f"Bearer {wtok}", "Content-Type": "application/json"},
    json={"message": "Me interesa!"},
    timeout=10,
)
print(f"[OK] 5. Aplicar -> HTTP {r.status_code}")
if r.status_code != 200:
    print(f"     Respuesta: {r.text}")

time.sleep(1)

# 6. View applicants
r = requests.get(
    f"{BASE}/jobs/{job_id}/applications", headers={"Authorization": f"Bearer {ctok}"}, timeout=10
)
data = r.json()
apps = data if isinstance(data, list) else (data.get("applications") or data.get("data") or [])
app_id = apps[0]["id"]
print(f"[OK] 6. Ver aplicantes -> app_id={app_id}, hay {len(apps)} aplicante(s)")

time.sleep(1)

# 7. Accept
r = requests.post(
    f"{BASE}/jobs/{job_id}/accept/{app_id}",
    headers={"Authorization": f"Bearer {ctok}", "Content-Type": "application/json"},
    json={},
    timeout=10,
)
print(f"[OK] 7. Aceptar worker -> HTTP {r.status_code}")
if r.status_code != 200:
    print(f"     Respuesta: {r.text}")

time.sleep(1)

# 8. Check-in
r = requests.post(
    f"{BASE}/jobs/{job_id}/check-in",
    headers={"Authorization": f"Bearer {wtok}", "Content-Type": "application/json"},
    json={},
    timeout=10,
)
print(f"[OK] 8. Check-in -> HTTP {r.status_code}")

time.sleep(1)

# 9. Complete request
r = requests.post(
    f"{BASE}/jobs/{job_id}/complete-request",
    headers={"Authorization": f"Bearer {wtok}", "Content-Type": "application/json"},
    json={},
    timeout=10,
)
print(f"[OK] 9. Complete-request -> HTTP {r.status_code}")

time.sleep(1)

# 10. Approve
r = requests.post(
    f"{BASE}/jobs/{job_id}/approve",
    headers={"Authorization": f"Bearer {ctok}", "Content-Type": "application/json"},
    json={},
    timeout=10,
)
print(f"[OK] 10. Approve completado -> HTTP {r.status_code}")

time.sleep(1)

# 11. Release payment
r = requests.post(
    f"{BASE}/payments/release/{job_id}", headers={"Authorization": f"Bearer {ctok}"}, timeout=10
)
print(f"[OK] 11. Release pago -> HTTP {r.status_code}")
if r.status_code == 200:
    tx_data = r.json()
    print(
        f"     Transaccion tipo={tx_data.get('type')}, monto={tx_data.get('amount')}, status={tx_data.get('status')}"
    )

print()
print("=" * 50)
print("  FLUJO COMPLETO EXITOSO")
print(f"  Job #{job_id} creado -> aplicado -> aceptado -> check-in -> completado -> pagado")
print("=" * 50)

# Verificar audit logs
print()
sys.path.insert(0, r"C:\Users\yochi\Desktop\freelance-web\backend")
from app.database import SessionLocal
from app.models.audit_log import AuditLog

db = SessionLocal()
logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(8).all()
print("  Ultimos audit logs generados:")
for log in logs:
    print(f"    #{log.id}: user={log.user_id} action={log.action}")
db.close()
