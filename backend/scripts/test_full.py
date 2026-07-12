import requests, json, urllib.request

BASE = "http://127.0.0.1:8000/api/v1"
FRONT = "http://localhost:3000"

def test(name, ok, detail=""):
    status = "✅" if ok else "❌"
    print(f"  {status} {name}" + (f" — {detail}" if detail else ""))

print("="*60)
print("PRUEBA COMPLETA — TurnoGO")
print("="*60)

# ─── BACKEND ───

r = requests.get(BASE + "/health")
test("Health check", r.ok)

# Register contractor
r = requests.post(BASE + "/auth/register", json={
    "email":"prueba_final@test.com","phone":"+5012345678",
    "full_name":"Test Final","cedula":"11111111",
    "password":"test123","role":"contractor"
})
test("Register contractor", r.ok, r.json()["full_name"] if r.ok else "")

# Register worker
r = requests.post(BASE + "/auth/register", json={
    "email":"worker_final@test.com","phone":"+5087654321",
    "full_name":"Worker Final","cedula":"22222222",
    "password":"test123","role":"worker"
})
test("Register worker", r.ok, r.json()["full_name"] if r.ok else "")

# Login contractor
r = requests.post(BASE + "/auth/login", json={"email":"prueba_final@test.com","password":"test123"})
if not r.ok: print("  ❌ Login contractor failed:", r.text[:200]); exit(1)
tk_c = r.json()["access_token"]
test("Login contractor", True)

# Login worker
r = requests.post(BASE + "/auth/login", json={"email":"worker_final@test.com","password":"test123"})
if not r.ok: print("  ❌ Login worker failed:", r.text[:200]); exit(1)
tk_w = r.json()["access_token"]
test("Login worker", True)

# PATCH /me (profile)
r = requests.patch(BASE + "/auth/me", json={"full_name":"Test Final Actualizado"},
    headers={"Authorization": f"Bearer {tk_c}"})
test("PATCH /me (profile update)", r.ok, r.json()["full_name"] if r.ok else "")

# PATCH /me/wallet
r = requests.patch(BASE + "/auth/me/wallet", json={"wallet_address":"0x1111222233334444555566667777888899990000"},
    headers={"Authorization": f"Bearer {tk_c}"})
test("PATCH /me/wallet", r.ok, r.json()["wallet_address"][:20] + "..." if r.ok else "")

# GET /me
r = requests.get(BASE + "/auth/me", headers={"Authorization": f"Bearer {tk_c}"})
d = r.json()
test("GET /me", r.ok, f'{d["full_name"]} | wallet: {d["wallet_address"][:10]}...')

# CREATE JOB
r = requests.post(BASE + "/jobs/", json={
    "title":"Mesero para evento corporativo",
    "description":"Necesito mesero con experiencia para evento de 50 personas. 6pm-11pm.",
    "category":"Eventos","location":"Caracas","budget":80.0,"duration":"4-6 horas"
}, headers={"Authorization": f"Bearer {tk_c}"})
if not r.ok: print("  ❌ Create job failed:", r.text[:200]); exit(1)
job_id = r.json()["id"]
test("Create JOB", True, f"Job #{job_id}")

# APPLY TO JOB
r = requests.post(BASE + f"/jobs/{job_id}/apply", json={"message":"Hola, me interesa!"},
    headers={"Authorization": f"Bearer {tk_w}"})
test("Apply to job", r.ok)

# LIST APPLICATIONS
r = requests.get(BASE + f"/jobs/{job_id}/applications", headers={"Authorization": f"Bearer {tk_c}"})
apps = r.json()
test("List applications", r.ok and len(apps) > 0, f"{len(apps)} applicant(s)")
if apps:
    app_id = apps[0]["id"]
    worker_id = apps[0]["worker_id"]
    worker_name = apps[0]["worker"]["full_name"]
    test("Worker info in application", True, f"#{worker_id} - {worker_name}")

# ACCEPT APPLICATION
r = requests.post(BASE + f"/jobs/{job_id}/accept/{app_id}",
    headers={"Authorization": f"Bearer {tk_c}"})
test("Accept application", r.ok, r.json()["status"] if r.ok else "")

# CHECK-IN
r = requests.post(BASE + f"/jobs/{job_id}/check-in",
    headers={"Authorization": f"Bearer {tk_w}"})
test("Check-in", r.ok, r.json()["status"] if r.ok else "")

# COMPLETE REQUEST
r = requests.post(BASE + f"/jobs/{job_id}/complete-request",
    headers={"Authorization": f"Bearer {tk_w}"})
test("Complete request", r.ok, r.json()["status"] if r.ok else "")

# APPROVE
r = requests.post(BASE + f"/jobs/{job_id}/approve",
    headers={"Authorization": f"Bearer {tk_c}"})
test("Approve", r.ok, r.json()["status"] if r.ok else "")

# PUBLIC PROFILE (NO wallet)
r = requests.get(BASE + f"/users/{worker_id}")
d = r.json()
has_wallet = "wallet_address" in d
test("Public profile (no wallet)", r.ok and not has_wallet,
    f"wallet_address presente: {has_wallet}")

# RATE LIMITING
hit = False
for i in range(6):
    r = requests.post(BASE + "/auth/login", json={"email":"prueba_final@test.com","password":"WRONG"})
    if r.status_code == 429:
        test("Rate limiting", True, f"activado en intento #{i+1}")
        hit = True
        break
if not hit:
    test("Rate limiting", False, "No se activo en 6 intentos")

# ─── FRONTEND ───

pages = {
    "Landing": "/",
    "Jobs list": "/jobs",
    "Register": "/auth/register",
    "Login": "/auth/login",
    "New job": "/jobs/new",
}
print()
print("─" * 60)
print("FRONTEND — Páginas")
print("─" * 60)
for name, path in pages.items():
    try:
        r = urllib.request.urlopen(FRONT + path, timeout=5)
        test(name, r.status == 200, f"{r.status}")
    except Exception as e:
        test(name, False, str(e))

# PWA manifest
try:
    r = urllib.request.urlopen(FRONT + "/manifest.json", timeout=5)
    d = json.loads(r.read())
    test("PWA manifest", True, f'{d["name"]} — display: {d["display"]}')
except Exception as e:
    test("PWA manifest", False, str(e))

# Service Worker
try:
    r = urllib.request.urlopen(FRONT + "/sw.js", timeout=5)
    test("Service worker", r.status == 200, f"{len(r.read())} bytes")
except Exception as e:
    test("Service worker", False, str(e))

print()
print("="*60)
print("PRUEBA COMPLETADA")
print("="*60)
