# Test completo del flujo TurnoGO
# Crea usuarios frescos, ejecuta 30 ciclos, reporta resultados
import requests, sys, time
from datetime import datetime

BASE = "http://localhost:8000/api/v1"

# Usar Session para conexiones persistentes
s = requests.Session()

stats = {"ok": 0, "fail": 0, "errors": []}

def check(step_name, ok, detail=""):
    if ok:
        stats["ok"] += 1
        status = "OK"
    else:
        stats["fail"] += 1
        stats["errors"].append(f"{step_name}: {detail}")
        status = "FAIL"
    extra = f" - {detail}" if detail else ""
    print(f"  [{stats['ok']+stats['fail']:3d}] {status} {step_name}{extra}", flush=True)

def req(method, path, token=None, json_data=None):
    url = f"{BASE}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if json_data is not None or method in ("POST", "PUT", "PATCH"):
        headers["Content-Type"] = "application/json"
    for attempt in range(3):
        try:
            r = s.request(method, url, headers=headers, json=json_data, timeout=15)
            return r.status_code, r.json() if r.text else {}
        except requests.exceptions.ConnectionError as e:
            if attempt < 2:
                time.sleep(1)
                continue
            return 0, {"error": str(e)}
        except Exception as e:
            return 0, {"error": str(e)}

def login(creds):
    code, data = req("POST", "/auth/login", json_data=creds)
    if code == 200:
        return data["access_token"], data["user"]
    return None, None

print("=" * 60, flush=True)
print("  TURNOGO - TEST AUTOMATIZADO (30 ciclos)", flush=True)
print(f"  {datetime.now().strftime('%H:%M:%S')}", flush=True)
print("=" * 60, flush=True)

# 1. Login como admin para resetear
print("\n[SETUP] Creando usuarios frescos...", flush=True)
r_code, data = req("POST", "/auth/register", json_data={
    "email": "test_contractor@test.com",
    "password": "test123",
    "full_name": "Test Contractor",
    "phone": f"+584141000001",
    "cedula": f"V-10000001",
    "role": "contractor"
})
if r_code not in (200, 201):
    print(f"  Nota: contractor ya existe (HTTP {r_code})", flush=True)

r_code, data = req("POST", "/auth/register", json_data={
    "email": "test_worker@test.com",
    "password": "test123",
    "full_name": "Test Worker",
    "phone": f"+584141000002",
    "cedula": f"V-10000002",
    "role": "worker"
})
if r_code not in (200, 201):
    print(f"  Nota: worker ya existe (HTTP {r_code})", flush=True)

# 2. Login
print("\n[LOGIN] Contractor...", flush=True)
contractor_token, contractor_user = login({"email": "test_contractor@test.com", "password": "test123"})
check("Login contractor", contractor_token is not None)

print("[LOGIN] Worker...", flush=True)
worker_token, worker_user = login({"email": "test_worker@test.com", "password": "test123"})
check("Login worker", worker_token is not None)

# 3. Dar balance al contractor en BD
import sqlite3
db_path = r"C:\Users\yochi\Desktop\freelance-web\backend\freelance.db"
conn = sqlite3.connect(db_path)
conn.execute("UPDATE users SET balance = 50000 WHERE email = 'test_contractor@test.com'")
conn.commit()
conn.close()
check("Balance contractor", True)

# 4. Ejecutar 30 ciclos
categories = ["Gastronomia","Logistica","Servicios","Limpieza","Eventos","Retail","Construccion","Mudanza","Oficina","Delivery"]
locations = ["Caracas","Maracay","Valencia","Barquisimeto","Maracaibo","Tacoma","Miami","Bogota","Lima","Santiago"]

print(f"\n{'='*60}", flush=True)
print("  EJECUTANDO 30 CICLOS", flush=True)
print(f"{'='*60}", flush=True)

for i in range(30):
    cat = categories[i % 10]
    loc = locations[i % 10]
    budget = round(10 + i * 3.5, 2)
    title = f"Test Ciclo {i+1} - {cat} en {loc}"
    
    print(f"\n--- Ciclo {i+1}/30: ${budget} ---", flush=True)
    
    # 1. Contractor crea trabajo
    code, data = req("POST", "/jobs", contractor_token, {
        "title": title, "description": f"Trabajo #{i+1}",
        "category": cat, "location": loc, "budget": budget, "duration": "4h"
    })
    if code not in (200, 201):
        check(f"1. Crear trabajo", False, f"HTTP {code}")
        continue
    job_id = data.get("id")
    check(f"1. Crear trabajo (ID={job_id})", job_id is not None)
    time.sleep(0.2)
    
    # 2. Worker aplica
    code, data = req("POST", f"/jobs/{job_id}/apply", worker_token, {"message": "Me interesa!"})
    check(f"2. Aplicar", code in (200, 201), f"HTTP {code}")
    time.sleep(0.2)
    
    # 3. Contractor ve aplicantes
    code, data = req("GET", f"/jobs/{job_id}/applications", contractor_token)
    apps = data if isinstance(data, list) else (data.get("applications") or data.get("data") or [])
    app_id = None
    if apps and len(apps) > 0:
        a = apps[0]
        app_id = a.get("id") if isinstance(a, dict) else None
    check(f"3. Ver aplicantes ({len(apps) if apps else 0})", app_id is not None)
    if not app_id:
        continue
    
    # 4. Contractor acepta
    code, data = req("POST", f"/jobs/{job_id}/accept/{app_id}", contractor_token, {})
    check(f"4. Aceptar worker", code == 200, f"HTTP {code}")
    time.sleep(0.2)
    
    # 5. Worker check-in
    code, data = req("POST", f"/jobs/{job_id}/check-in", worker_token, {})
    check(f"5. Check-in", code == 200, f"HTTP {code}")
    time.sleep(0.2)
    
    # 6. Worker complete-request
    code, data = req("POST", f"/jobs/{job_id}/complete-request", worker_token, {})
    check(f"6. Complete-request", code == 200, f"HTTP {code}")
    time.sleep(0.2)
    
    # 7. Contractor aprueba
    code, data = req("POST", f"/jobs/{job_id}/approve", contractor_token, {})
    check(f"7. Approve", code == 200, f"HTTP {code}")
    time.sleep(0.2)
    
    # 8. Contractor libera pago
    code, data = req("POST", f"/payments/release/{job_id}", contractor_token)
    check(f"8. Release pago", code == 200, f"HTTP {code}")
    time.sleep(0.3)

# Resultados
print(f"\n{'='*60}", flush=True)
print("  RESULTADOS FINALES", flush=True)
print(f"{'='*60}", flush=True)
print(f"  Pasos OK:   {stats['ok']}", flush=True)
print(f"  Pasos FAIL: {stats['fail']}", flush=True)
print(f"  Total:      {stats['ok']+stats['fail']}", flush=True)
print(f"{'='*60}", flush=True)

if stats["errors"]:
    print(f"\n  Errores ({len(stats['errors'])}):", flush=True)
    for err in stats["errors"][:20]:
        print(f"    - {err}", flush=True)

# Verificacion final
print(f"\n{'='*60}", flush=True)
print("  VERIFICACION FINAL (BD)", flush=True)
print(f"{'='*60}", flush=True)

sys.path.insert(0, r"C:\Users\yochi\Desktop\freelance-web\backend")
from app.database import SessionLocal
from app.models.audit_log import AuditLog
from app.models.transaction import Transaction
from app.models.job import Job

db = SessionLocal()
log_count = db.query(AuditLog).count()
tx_count = db.query(Transaction).count()
completed = db.query(Job).filter(Job.status == "completed").count()
print(f"  Audit logs:   {log_count}", flush=True)
print(f"  Transacciones: {tx_count}", flush=True)
print(f"  Jobs completados: {completed}", flush=True)
print(f"\n  Ultimos 15 audit logs:", flush=True)
for log in db.query(AuditLog).order_by(AuditLog.id.desc()).limit(15).all():
    print(f"    [{log.id:3d}] user={log.user_id:2d} {log.action:25s} ip={log.ip_address or '-'}", flush=True)
db.close()

print(f"\n  FIN - {datetime.now().strftime('%H:%M:%S')}", flush=True)
