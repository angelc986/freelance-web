import urllib.request, json

BASE = "https://freelance-web-production-add4.up.railway.app/api/v1"

# First, try to register the test users
users = [
    {"email": "admin@turnogo.com", "password": "Admin123!", "full_name": "Admin TurnoGO", "phone": "+584141111111", "cedula": "V-11111111", "role": "contractor"},
    {"email": "contratista@test.com", "password": "Test123!", "full_name": "Carlos Contratista", "phone": "+584142222222", "cedula": "V-22222222", "role": "contractor"},
    {"email": "empleado@test.com", "password": "Test123!", "full_name": "Maria Empleada", "phone": "+584143333333", "cedula": "V-33333333", "role": "worker"},
]

results = []
for user in users:
    data = json.dumps(user).encode()
    req = urllib.request.Request(BASE + "/auth/register", data=data, headers={"Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req)
        result = json.loads(r.read())
        results.append(f"OK: {user['email']} - {result.get('user', {}).get('full_name', '?')}")
    except urllib.request.HTTPError as e:
        body = e.read().decode()
        results.append(f"ERR: {user['email']} - {e.code}: {body}")
    except Exception as e:
        results.append(f"FAIL: {user['email']} - {str(e)}")

with open("C:\\Users\\yochi\\Desktop\\freelance-web\\backend\\seed_result.txt", "w") as f:
    for r in results:
        f.write(r + "\n")
