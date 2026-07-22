import urllib.request, json

def api(method, path, data=None, token=None):
    url = f'https://freelance-web-beta.vercel.app{path}'
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.data = json.dumps(data).encode()
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Login as test.contractor
c = api('POST', '/api/v1/auth/login', {'email': 'test.contractor@turnogo.com', 'password': 'Test123!'})
tok = c['access_token']
print('Login OK')

jobs_data = [
    {'title': 'Mesero para evento', 'description': 'Se necesita mesero para evento privado en La Guaira. 4 horas de trabajo, buena presentacion.', 'category': 'Gastronomia', 'location': 'La Guaira, Vargas', 'budget': 40, 'duration': '4 horas'},
    {'title': 'Electricista reparacion', 'description': 'Reparar instalacion electrica en apartamento. Hay un cortocircuito en la cocina.', 'category': 'Electricidad', 'location': 'Catia La Mar, Vargas', 'budget': 60, 'duration': '1 dia'},
    {'title': 'Limpieza de oficina', 'description': 'Limpieza profunda de oficina pequeña. 3 ambientes. Materiales incluidos.', 'category': 'Limpieza', 'location': 'Maiquetia, Vargas', 'budget': 35, 'duration': '3 horas'},
    {'title': 'Ayudante de albanil', 'description': 'Ayudante para mezclar cemento y cargar materiales. Obra pequeña.', 'category': 'Construccion', 'location': 'Caraballeda, Vargas', 'budget': 50, 'duration': '2 dias'},
    {'title': 'Repartidor en moto', 'description': 'Repartir pedidos de comida en Catia La Mar. Moto propia indispensable.', 'category': 'Delivery', 'location': 'Catia La Mar, Vargas', 'budget': 30, 'duration': '6 horas'},
]

for j in jobs_data:
    job = api('POST', '/api/v1/jobs', j, tok)
    print(f'Creado: ID={job["id"]} | {job["title"]} | ${job["budget"]}')

print(f'\nTotal: {len(jobs_data)} trabajos creados')
