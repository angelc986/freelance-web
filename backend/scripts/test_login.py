import requests, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

r = requests.post('http://localhost:8000/api/v1/auth/login',
                  json={'email':'angelcurbelo901@gmail.com','password':'test123'}, timeout=10)
print(f'Status: {r.status_code}')
if r.status_code == 200:
    d = r.json()
    print(f'User: {d["user"]["full_name"]} (ID={d["user"]["id"]})')
    print(f'Token OK: {d["access_token"][:20]}...')
else:
    print(f'Error: {r.text}')
