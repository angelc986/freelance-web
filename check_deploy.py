import requests

# Check Vercel frontend for API URL in compiled JS
r = requests.get('https://freelance-web-beta.vercel.app/auth/login', timeout=10)
html = r.text
print(f"HTML length: {len(html)}")
print(f"Contains railway.app: {'railway.app' in html}")
print(f"Contains 127.0.0.1: {'127.0.0.1' in html}")
print(f"Contains localhost: {'localhost' in html}")
print(f"Contains 8002: {'8002' in html}")

# Also verify Railway backend
r2 = requests.get('https://freelance-web-production-add4.up.railway.app/api/v1/health', timeout=10)
print(f"\nBackend health: {r2.status_code}")
