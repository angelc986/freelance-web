import urllib.request, json

PASSWORD = "Admin123!"
EMAIL = "admin@turnogo.com"

# Login
login_data = json.dumps({"email": EMAIL, "password": PASSWORD}).encode()
req = urllib.request.Request(
    "https://freelance-web-beta.vercel.app/api/v1/auth/login",
    data=login_data,
    headers={"Content-Type": "application/json"}
)
resp = json.loads(urllib.request.urlopen(req).read())
token = resp["access_token"]
print(f"Token length: {len(token)}")

# Cleanup
auth_prefix = "Bearer "
data = json.dumps({}).encode()
req = urllib.request.Request(
    "https://freelance-web-beta.vercel.app/api/v1/admin/cleanup-test-data",
    data=data,
    method="POST",
    headers={"Content-Type": "application/json", "Authorization": auth_prefix + token}
)
resp = json.loads(urllib.request.urlopen(req).read())
print(resp["message"])
