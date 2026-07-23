# Prueba limpia del flujo completo de TurnoGO
import time

import requests

BASE = "http://localhost:8000/api/v1"
results = []


def test(name, fn):
    try:
        fn()
        results.append((name, "PASS", ""))
        print("  PASS  " + name)
    except Exception as e:
        results.append((name, "FAIL", str(e)))
        print("  FAIL  " + name + ": " + str(e))


# Login
r = requests.post(
    BASE + "/auth/login",
    json={"email": "angelcurbelo901@gmail.com", "password": "test123"},
    timeout=10,
)
CTOK = r.json()["access_token"]
print("[SETUP] Contractor logueado")

r = requests.post(
    BASE + "/auth/login", json={"email": "instaworkve@gmail.com", "password": "test123"}, timeout=10
)
WTOK = r.json()["access_token"]
print("[SETUP] Worker logueado")

# Dar balance
import sqlite3

conn = sqlite3.connect(r"C:\Users\yochi\Desktop\freelance-web\backend\freelance.db")
conn.execute("UPDATE users SET balance = 50000 WHERE email = 'angelcurbelo901@gmail.com'")
conn.commit()
conn.close()

# Crear trabajo
ts = str(int(time.time() * 1000))
r = requests.post(
    BASE + "/jobs",
    headers={"Authorization": "Bearer " + CTOK, "Content-Type": "application/json"},
    json={
        "title": "Prueba Flujo " + ts,
        "description": "Test del flujo completo",
        "category": "Servicios",
        "location": "Caracas",
        "budget": 50,
        "duration": "2h",
    },
    timeout=10,
)
JOB_ID = r.json()["id"]
print("[SETUP] Trabajo creado ID=" + str(JOB_ID))

time.sleep(0.5)

print()
print("--- EJECUTANDO FLUJO ---")
print()

APP_ID = None


# 1. Aplicar
def step1():
    r = requests.post(
        BASE + "/jobs/" + str(JOB_ID) + "/apply",
        headers={"Authorization": "Bearer " + WTOK, "Content-Type": "application/json"},
        json={"message": "Me interesa!"},
        timeout=10,
    )
    assert r.status_code in (200, 201), "HTTP " + str(r.status_code) + ": " + r.text[:200]


test("1. Aplicar al trabajo", step1)

time.sleep(0.5)


# 2. Ver aplicantes
def step2():
    global APP_ID
    r = requests.get(
        BASE + "/jobs/" + str(JOB_ID) + "/applications",
        headers={"Authorization": "Bearer " + CTOK},
        timeout=10,
    )
    data = r.json()
    apps = data if isinstance(data, list) else []
    assert len(apps) > 0, "No hay aplicantes"
    APP_ID = apps[0].get("id")
    assert APP_ID, "No se encontro app_id"


test("2. Ver aplicantes", step2)

time.sleep(0.5)


# 3. Aceptar
def step3():
    r = requests.post(
        BASE + "/jobs/" + str(JOB_ID) + "/accept/" + str(APP_ID),
        headers={"Authorization": "Bearer " + CTOK, "Content-Type": "application/json"},
        json={},
        timeout=10,
    )
    assert r.status_code == 200, "HTTP " + str(r.status_code) + ": " + r.text[:200]


test("3. Aceptar worker", step3)

time.sleep(0.5)


# 4. Check-in
def step4():
    r = requests.post(
        BASE + "/jobs/" + str(JOB_ID) + "/check-in",
        headers={"Authorization": "Bearer " + WTOK, "Content-Type": "application/json"},
        json={},
        timeout=10,
    )
    assert r.status_code == 200, "HTTP " + str(r.status_code) + ": " + r.text[:200]


test("4. Check-in", step4)

time.sleep(0.5)


# 5. Complete-request
def step5():
    r = requests.post(
        BASE + "/jobs/" + str(JOB_ID) + "/complete-request",
        headers={"Authorization": "Bearer " + WTOK, "Content-Type": "application/json"},
        json={},
        timeout=10,
    )
    assert r.status_code == 200, "HTTP " + str(r.status_code) + ": " + r.text[:200]


test("5. Solicitar completar", step5)

time.sleep(0.5)


# 6. Approve
def step6():
    r = requests.post(
        BASE + "/jobs/" + str(JOB_ID) + "/approve",
        headers={"Authorization": "Bearer " + CTOK, "Content-Type": "application/json"},
        json={},
        timeout=10,
    )
    assert r.status_code == 200, "HTTP " + str(r.status_code) + ": " + r.text[:200]


test("6. Aprobar completado", step6)

time.sleep(0.5)


# 7. Release
def step7():
    r = requests.post(
        BASE + "/payments/release/" + str(JOB_ID),
        headers={"Authorization": "Bearer " + CTOK},
        timeout=10,
    )
    assert r.status_code == 200, "HTTP " + str(r.status_code) + ": " + r.text[:200]
    d = r.json()
    st = d.get("status")
    assert st in ("confirmed", "pending_confirmation"), "Status transaccion: " + str(st)


test("7. Liberar pago", step7)

print()
print("=" * 50)
passed = sum(1 for _, s, _ in results if s == "PASS")
failed = sum(1 for _, s, _ in results if s == "FAIL")
print("  Resultado: " + str(passed) + "/7 pasos exitosos")
if failed > 0:
    print("  Fallos: " + str(failed))
    for name, status, err in results:
        if status == "FAIL":
            print("    - " + name + ": " + err)
print("=" * 50)
