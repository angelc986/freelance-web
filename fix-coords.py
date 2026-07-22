import urllib.request, json

PASSWORD = "***"
EMAIL = "test.contractor@turnogo.com"

login_data = json.dumps({"email": EMAIL, "password": PASSWORD}).encode()
req = urllib.request.Request(
    "https://freelance-web-beta.vercel.app/api/v1/auth/login",
    data=login_data,
    headers={"Content-Type": "application/json"}
)
resp = json.loads(urllib.request.urlopen(req).read())
token = resp["access_token"]
auth = "Bearer " + token

# Direccion de Angel en Spanaway, WA
LAT = 47.0785
LNG = -122.4297
LOCATION = "19422 Mountain Highway East, Spanaway, WA 98387"

for job_id in [29, 30, 31, 32, 33]:
    try:
        req = urllib.request.Request(f"https://freelance-web-beta.vercel.app/api/v1/jobs/{job_id}")
        job = json.loads(urllib.request.urlopen(req).read())
        
        data = json.dumps({
            "title": job["title"],
            "description": job["description"],
            "category": job["category"],
            "location": LOCATION,
            "budget": job["budget"],
            "duration": job["duration"],
            "latitude": LAT,
            "longitude": LNG,
        }).encode()
        
        req = urllib.request.Request(
            f"https://freelance-web-beta.vercel.app/api/v1/jobs/{job_id}",
            data=data, method="PUT",
            headers={"Content-Type": "application/json", "Authorization": auth}
        )
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"Job {job_id}: {resp['title']} -> GPS OK")
    except Exception as e:
        print(f"Job {job_id}: SKIP - {e}")

print("\nTodos los trabajos apuntan a tu ubicacion en Spanaway. Proba el check-in ahora.")
