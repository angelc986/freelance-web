import sqlite3
import sys
import time

import requests

BASE = "http://localhost:8002/api/v1"

# Login
r = requests.post(
    BASE + "/auth/login",
    json={"email": "angelcurbelo901@gmail.com", "password": "test123"},
    timeout=10,
)
ctok = r.json()["access_token"]
print("[OK] Contractor: alex")

r = requests.post(
    BASE + "/auth/login", json={"email": "instaworkve@gmail.com", "password": "test123"}, timeout=10
)
wtok = r.json()["access_token"]
print("[OK] Worker: daniel")

# Balance
conn = sqlite3.connect(r"C:\Users\yochi\Desktop\freelance-web\backend\freelance.db")
conn.execute("UPDATE users SET balance = 50000 WHERE id = 3")
conn.commit()
conn.close()
print("[OK] Balance contractor: 50000")

cats = [
    "Gastronomia",
    "Logistica",
    "Servicios",
    "Limpieza",
    "Eventos",
    "Retail",
    "Construccion",
    "Mudanza",
    "Oficina",
    "Delivery",
]
locs = [
    "Caracas",
    "Maracay",
    "Valencia",
    "Barquisimeto",
    "Maracaibo",
    "Tacoma",
    "Miami",
    "Bogota",
    "Lima",
    "Santiago",
]


def auth_hdr(tok):
    return {"Authorization": "Bearer " + tok, "Content-Type": "application/json"}


print()
print("--- CREANDO 15 TRABAJOS DE PRUEBA ---")
print()

ok = 0
for i in range(15):
    cat = cats[i % 10]
    loc = locs[i % 10]
    budget = round(15 + i * 5, 2)
    title = "Demo " + str(i + 1) + " - " + cat

    r = requests.post(
        BASE + "/jobs",
        headers=auth_hdr(ctok),
        json={
            "title": title,
            "description": "Trabajo demo #" + str(i + 1),
            "category": cat,
            "location": loc,
            "budget": budget,
            "duration": "3h",
        },
        timeout=10,
    )
    if r.status_code not in (200, 201):
        print("  " + str(i + 1) + "/15: FAIL create HTTP " + str(r.status_code))
        continue
    jid = r.json()["id"]
    time.sleep(0.15)

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/apply",
        headers=auth_hdr(wtok),
        json={"message": "Me interesa!"},
        timeout=10,
    )
    if r.status_code not in (200, 201):
        print("  " + str(i + 1) + "/15: FAIL apply HTTP " + str(r.status_code))
        continue
    time.sleep(0.1)

    r = requests.get(
        BASE + "/jobs/" + str(jid) + "/applications", headers=auth_hdr(ctok), timeout=10
    )
    apps = r.json()
    app_id = apps[0]["id"] if (isinstance(apps, list) and len(apps) > 0) else None
    if not app_id:
        print("  " + str(i + 1) + "/15: FAIL no apps")
        continue

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/accept/" + str(app_id),
        headers=auth_hdr(ctok),
        json={},
        timeout=10,
    )
    if r.status_code != 200:
        print("  " + str(i + 1) + "/15: FAIL accept HTTP " + str(r.status_code))
        continue
    time.sleep(0.1)

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/check-in", headers=auth_hdr(wtok), json={}, timeout=10
    )
    if r.status_code != 200:
        print("  " + str(i + 1) + "/15: FAIL checkin HTTP " + str(r.status_code))
        continue
    time.sleep(0.1)

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/complete-request",
        headers=auth_hdr(wtok),
        json={},
        timeout=10,
    )
    if r.status_code != 200:
        print("  " + str(i + 1) + "/15: FAIL complete HTTP " + str(r.status_code))
        continue
    time.sleep(0.1)

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/approve", headers=auth_hdr(ctok), json={}, timeout=10
    )
    if r.status_code != 200:
        print("  " + str(i + 1) + "/15: FAIL approve HTTP " + str(r.status_code))
        continue
    time.sleep(0.1)

    r = requests.post(BASE + "/payments/release/" + str(jid), headers=auth_hdr(ctok), timeout=10)
    if r.status_code != 200:
        print(
            "  " + str(i + 1) + "/15: FAIL release HTTP " + str(r.status_code) + " - " + r.text[:80]
        )
        continue

    ok += 1
    print("  " + str(i + 1) + "/15: OK - Job #" + str(jid) + " $" + str(budget) + " - " + cat)
    time.sleep(0.15)

print()
print("--- RESULTADO: " + str(ok) + "/15 completados ---")
print()

sys.path.insert(0, r"C:\Users\yochi\Desktop\freelance-web\backend")
from app.database import SessionLocal
from app.models.audit_log import AuditLog
from app.models.job import Job
from app.models.transaction import Transaction

db = SessionLocal()
jobs = db.query(Job).count()
tx = db.query(Transaction).count()
completed = db.query(Job).filter(Job.status == "completed").count()
logs = db.query(AuditLog).count()
print("ESTADO BD:")
print("  Jobs: " + str(jobs))
print("  Completados: " + str(completed))
print("  Transacciones: " + str(tx))
print("  Audit Logs: " + str(logs))
print()
print("Ultimos audit logs:")
for log in db.query(AuditLog).order_by(AuditLog.id.desc()).limit(10).all():
    print(
        "  #"
        + str(log.id)
        + " user="
        + str(log.user_id)
        + " action="
        + log.action
        + " ip="
        + str(log.ip_address or "-")
    )
db.close()
