import urllib.request, json

PASSWORD = "Admin123!"
EMAIL = "admin@turnogo.com"

# Login as admin
login_data = json.dumps({"email": EMAIL, "password": PASSWORD}).encode()
req = urllib.request.Request(
    "https://freelance-web-beta.vercel.app/api/v1/auth/login",
    data=login_data,
    headers={"Content-Type": "application/json"}
)
resp = json.loads(urllib.request.urlopen(req).read())
token = resp["access_token"]
auth = "Bearer " + token
print("Admin login OK")

# Coordinates for the 5 test jobs (La Guaira area, Venezuela)
coords = {
    29: (10.5990, -66.9340),   # Mesero - La Guaira
    30: (10.6000, -67.0333),   # Electricista - Catia La Mar
    31: (10.5954, -66.9579),   # Limpieza - Maiquetia
    32: (10.6112, -66.8528),   # Albanil - Caraballeda
    33: (10.6038, -67.0305),   # Repartidor - Catia La Mar
}

for job_id, (lat, lng) in coords.items():
    # Update job with coordinates
    data = json.dumps({"latitude": lat, "longitude": lng}).encode()
    req = urllib.request.Request(
        f"https://freelance-web-beta.vercel.app/api/v1/jobs/{job_id}",
        data=data,
        method="PUT",
        headers={"Content-Type": "application/json", "Authorization": auth}
    )
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"Job {job_id}: {resp['title']} -> ({lat}, {lng})")
    except Exception as e:
        print(f"Job {job_id}: ERROR - {e}")

print("\nDone! All jobs now have GPS coordinates.")
