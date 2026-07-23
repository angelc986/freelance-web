import requests

BASE = "http://127.0.0.1:8000/api/v1"

# Login workers
for email in ["worker_final@test.com", "worker2@test.com", "worker@test.com"]:
    r = requests.post(BASE + "/auth/login", json={"email": email, "password": "test123"})
    if r.ok:
        tk_w = r.json()["access_token"]
        print("Worker: " + email)

        # Test /jobs/mine
        r = requests.get(BASE + "/jobs/mine", headers={"Authorization": "Bearer " + tk_w})
        data = r.json()
        print("  /jobs/mine: " + str(len(data)) + " jobs")
        for j in data:
            print("    Job #" + str(j["id"]) + ": " + j["title"] + " [" + j["status"] + "]")

        # Test /jobs/my-applications
        r = requests.get(
            BASE + "/jobs/my-applications", headers={"Authorization": "Bearer " + tk_w}
        )
        data = r.json()
        print("  /jobs/my-applications: " + str(len(data)) + " apps")
        for a in data:
            print("    Job #" + str(a["job_id"]) + ": " + a["status"])
        break

# Login contractor
r = requests.post(BASE + "/auth/login", json={"email": "probar@test.com", "password": "test123"})
tk_c = r.json()["access_token"]
print("Contractor: probar@test.com")

r = requests.get(BASE + "/jobs/mine", headers={"Authorization": "Bearer " + tk_c})
data = r.json()
print("  /jobs/mine: " + str(len(data)) + " jobs")
for j in data:
    print("    Job #" + str(j["id"]) + ": " + j["title"] + " [" + j["status"] + "]")
