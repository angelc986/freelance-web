import urllib.request, json

PASSWORD = "Test123!"
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
print(f"Login OK, user ID={resp['user']['id']}")

jobs_data = [
    {"title": "Mesero para evento", "description": "Se necesita mesero para evento privado en La Guaira. Cuatro horas de trabajo, buena presentacion requerida.", "category": "Gastronomia", "location": "La Guaira, Vargas", "budget": 40, "duration": "4 horas"},
    {"title": "Electricista reparacion", "description": "Reparar instalacion electrica en apartamento. Hay un cortocircuito en la cocina que necesita atencion urgente.", "category": "Electricidad y Mantenimiento", "location": "Catia La Mar, Vargas", "budget": 60, "duration": "1 dia"},
    {"title": "Limpieza de oficina", "description": "Limpieza profunda de oficina pequena. Tres ambientes, materiales incluidos por el contratista.", "category": "Limpieza", "location": "Maiquetia, Vargas", "budget": 35, "duration": "3 horas"},
    {"title": "Ayudante de albanil", "description": "Ayudante para mezclar cemento y cargar materiales en obra pequena. Experiencia basica necesaria.", "category": "Construccion", "location": "Caraballeda, Vargas", "budget": 50, "duration": "2 dias"},
    {"title": "Repartidor en moto", "description": "Repartir pedidos de comida en Catia La Mar. Moto propia indispensable, conocimiento de la zona.", "category": "Conduccion y Mensajeria", "location": "Catia La Mar, Vargas", "budget": 30, "duration": "6 horas"},
]

for j in jobs_data:
    data = json.dumps(j).encode()
    req = urllib.request.Request(
        "https://freelance-web-beta.vercel.app/api/v1/jobs",
        data=data,
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": auth}
    )
    job = json.loads(urllib.request.urlopen(req).read())
    print(f"Creado ID={job['id']} | {job['title']} | ${job['budget']}")

print(f"\nTotal: {len(jobs_data)} trabajos listos")
