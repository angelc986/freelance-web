import requests

BASE = "http://127.0.0.1:8000/api/v1"
PASS = "test123"

# Login worker
r = requests.post(BASE + "/auth/login", json={"email":"worker_final@test.com","password":PASS})
if not r.ok:
    r = requests.post(BASE + "/auth/login", json={"email":"worker2@test.com","password":PASS})
if not r.ok:
    print("No worker found, creating new...")
    r = requests.post(BASE + "/auth/register", json={"email":"rate_worker@test.com","phone":"+501","full_name":"Rate Worker","cedula":"55555","password":PASS,"role":"worker"})
    r = requests.post(BASE + "/auth/login", json={"email":"rate_worker@test.com","password":PASS})
tk_w = r.json()["access_token"]
print("Worker login OK")

# Login contractor
r = requests.post(BASE + "/auth/login", json={"email":"probar@test.com","password":PASS})
if not r.ok:
    r = requests.post(BASE + "/auth/register", json={"email":"rate_contractor@test.com","phone":"+502","full_name":"Rate Contractor","cedula":"66666","password":PASS,"role":"contractor"})
    r = requests.post(BASE + "/auth/login", json={"email":"rate_contractor@test.com","password":PASS})
tk_c = r.json()["access_token"]
print("Contractor login OK")

# Find a completed job
r = requests.get(BASE + "/jobs/mine", headers={"Authorization": "Bearer " + tk_c})
jobs = r.json()
print("Jobs found:", len(jobs))
for j in jobs:
    print("  #" + str(j["id"]) + ": " + j["title"] + " [" + j["status"] + "]")
completed = [j for j in jobs if j["status"] == "completed"]
if not completed:
    # Create and complete a job
    r = requests.post(BASE + "/jobs/", json={
        "title":"Test rating job","description":"Testing rating feature. Need worker for quick test.","category":"Servicios","location":"Test","budget":10,"duration":"1-2 horas"
    }, headers={"Authorization": "Bearer " + tk_c})
    job_id = r.json()["id"]
    print("Created job #" + str(job_id))
    
    # Worker applies
    r = requests.post(BASE + "/jobs/" + str(job_id) + "/apply", json={"message":"Testing"}, headers={"Authorization":"Bearer " + tk_w})
    
    # Get application
    r = requests.get(BASE + "/jobs/" + str(job_id) + "/applications", headers={"Authorization":"Bearer " + tk_c})
    app_id = r.json()[0]["id"]
    
    # Accept
    r = requests.post(BASE + "/jobs/" + str(job_id) + "/accept/" + str(app_id), headers={"Authorization":"Bearer " + tk_c})
    
    # Check-in
    r = requests.post(BASE + "/jobs/" + str(job_id) + "/check-in", headers={"Authorization":"Bearer " + tk_w})
    
    # Complete request
    r = requests.post(BASE + "/jobs/" + str(job_id) + "/complete-request", headers={"Authorization":"Bearer " + tk_w})
    
    # Approve
    r = requests.post(BASE + "/jobs/" + str(job_id) + "/approve", headers={"Authorization":"Bearer " + tk_c})
    print("Job completed!")
else:
    job_id = completed[0]["id"]
    print("Using completed job #" + str(job_id))

# Worker rates contractor
r = requests.post(BASE + "/jobs/" + str(job_id) + "/rate",
    json={"rating": 5, "comment": "Excelente contratista"},
    headers={"Authorization": "Bearer " + tk_w})
print("Worker rates:", r.status_code, r.json().get("rating","") if r.ok else r.text[:200])

# Contractor rates worker
r = requests.post(BASE + "/jobs/" + str(job_id) + "/rate",
    json={"rating": 4, "comment": "Buen trabajador"},
    headers={"Authorization": "Bearer " + tk_c})
print("Contractor rates:", r.status_code, r.json().get("rating","") if r.ok else r.text[:200])

# Get ratings
r = requests.get(BASE + "/jobs/" + str(job_id) + "/ratings")
print("Total ratings:", len(r.json()))
for x in r.json():
    print("  #" + str(x["rater_id"]) + " -> #" + str(x["rated_id"]) + ": " + str(x["rating"]) + " stars")
