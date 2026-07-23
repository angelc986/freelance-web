import json

import requests

BASE = "http://localhost:8001/api/v1"

# Login
r = requests.post(
    BASE + "/auth/login", json={"email": "instaworkve@gmail.com", "password": "test123"}, timeout=10
)
tok = r.json()["access_token"]
r2 = requests.post(
    BASE + "/auth/login",
    json={"email": "angelcurbelo901@gmail.com", "password": "test123"},
    timeout=10,
)
ctok = r2.json()["access_token"]

# Create job
r3 = requests.post(
    BASE + "/jobs",
    headers={"Authorization": "Bearer " + ctok},
    json={
        "title": "FinalTest",
        "description": "test",
        "category": "Servicios",
        "location": "Caracas",
        "budget": 50,
        "duration": "2h",
    },
    timeout=10,
)
print("Create job:", r3.status_code)
jid = r3.json()["id"]
print("Job ID:", jid)

# Apply - try to catch the error
try:
    r4 = requests.post(
        BASE + "/jobs/" + str(jid) + "/apply",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        json={"message": "test"},
        timeout=10,
    )
    print("Apply:", r4.status_code)
    print("Body:", r4.text[:2000])
except Exception as e:
    print("Exception:", type(e).__name__, str(e))

# Now try the check-in which works
r5 = requests.get(
    BASE + "/jobs/" + str(jid) + "/applications",
    headers={"Authorization": "Bearer " + ctok},
    timeout=10,
)
print("View apps:", r5.status_code)
data = r5.json()
apps = data if isinstance(data, list) else []
print("Apps:", len(apps))
if apps:
    print("App data:", json.dumps(apps[0], indent=2, default=str))
