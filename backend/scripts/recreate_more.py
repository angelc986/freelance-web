import sqlite3
import sys
import time

import requests

BASE = "http://localhost:8002/api/v1"

r = requests.post(
    BASE + "/auth/login",
    json={"email": "angelcurbelo901@gmail.com", "password": "test123"},
    timeout=10,
)
ctok = r.json()["access_token"]
r = requests.post(
    BASE + "/auth/login", json={"email": "instaworkve@gmail.com", "password": "test123"}, timeout=10
)
wtok = r.json()["access_token"]


def hdr(tok):
    return {"Authorization": "Bearer " + tok, "Content-Type": "application/json"}


# Balance
conn = sqlite3.connect(r"C:\Users\yochi\Desktop\freelance-web\backend\freelance.db")
conn.execute("UPDATE users SET balance = 50000 WHERE id = 3")
conn.commit()
conn.close()

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

# First make a deposit
r = requests.post(
    BASE + "/payments/deposit",
    headers=hdr(ctok),
    json={"amount": 1000, "tx_hash": "0xabc123demo" + str(int(time.time()))},
    timeout=10,
)
print("Deposito: HTTP " + str(r.status_code))

ok = 0
for i in range(5):
    cat = cats[(i + 10) % 10]
    loc = locs[(i + 10) % 10]
    budget = round(50 + i * 10, 2)

    r = requests.post(
        BASE + "/jobs",
        headers=hdr(ctok),
        json={
            "title": "Demo " + str(11 + i) + " - " + cat,
            "description": "Trabajo demo #" + str(11 + i),
            "category": cat,
            "location": loc,
            "budget": budget,
            "duration": "3h",
        },
        timeout=10,
    )
    if r.status_code not in (200, 201):
        print(str(i + 1) + "/5: FAIL create " + str(r.status_code))
        continue
    jid = r.json()["id"]
    time.sleep(0.1)

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/apply",
        headers=hdr(wtok),
        json={"message": "test"},
        timeout=10,
    )
    if r.status_code not in (200, 201):
        print(str(i + 1) + "/5: FAIL apply " + str(r.status_code))
        continue
    time.sleep(0.08)

    r = requests.get(BASE + "/jobs/" + str(jid) + "/applications", headers=hdr(ctok), timeout=10)
    apps = r.json()
    app_id = apps[0]["id"] if (isinstance(apps, list) and len(apps) > 0) else None
    if not app_id:
        continue

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/accept/" + str(app_id),
        headers=hdr(ctok),
        json={},
        timeout=10,
    )
    if r.status_code != 200:
        continue
    time.sleep(0.08)

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/check-in", headers=hdr(wtok), json={}, timeout=10
    )
    if r.status_code != 200:
        continue
    time.sleep(0.08)

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/complete-request", headers=hdr(wtok), json={}, timeout=10
    )
    if r.status_code != 200:
        continue
    time.sleep(0.08)

    r = requests.post(
        BASE + "/jobs/" + str(jid) + "/approve", headers=hdr(ctok), json={}, timeout=10
    )
    if r.status_code != 200:
        continue
    time.sleep(0.08)

    r = requests.post(BASE + "/payments/release/" + str(jid), headers=hdr(ctok), timeout=10)
    if r.status_code != 200:
        print(str(i + 1) + "/5: FAIL release " + str(r.status_code))
        continue

    ok += 1
    print(str(i + 1) + "/5: OK Job #" + str(jid) + " $" + str(budget))
    time.sleep(0.1)

print()
print("Resultado: " + str(ok) + "/5")

sys.path.insert(0, r"C:\Users\yochi\Desktop\freelance-web\backend")
from app.database import SessionLocal
from app.models.audit_log import AuditLog
from app.models.job import Job
from app.models.transaction import Transaction

db = SessionLocal()
print("Jobs: " + str(db.query(Job).count()))
print("Completados: " + str(db.query(Job).filter(Job.status == "completed").count()))
print("Transacciones: " + str(db.query(Transaction).count()))
print("Audit Logs: " + str(db.query(AuditLog).count()))
db.close()
