# 30 ciclos completos del flujo TurnoGO
import requests, time, sqlite3, sys

BASE = 'http://localhost:8002/api/v1'
stats = {'ok': 0, 'fail': 0, 'errors': []}

# Login
r = requests.post(BASE + '/auth/login', json={'email':'instaworkve@gmail.com','password':'test123'}, timeout=10)
worker_tok = r.json()['access_token']
print('[OK] Worker logueado')

r = requests.post(BASE + '/auth/login', json={'email':'angelcurbelo901@gmail.com','password':'test123'}, timeout=10)
contractor_tok = r.json()['access_token']
print('[OK] Contractor logueado')

# Dar balance
conn = sqlite3.connect(r'C:\Users\yochi\Desktop\freelance-web\backend\freelance.db')
conn.execute("UPDATE users SET balance = 50000 WHERE email = 'angelcurbelo901@gmail.com'")
conn.commit()
conn.close()
print('[OK] Balance: $50000')

categories = ['Gastronomia','Logistica','Servicios','Limpieza','Eventos','Retail','Construccion','Mudanza','Oficina','Delivery']
locations = ['Caracas','Maracay','Valencia','Barquisimeto','Maracaibo','Tacoma','Miami','Bogota','Lima','Santiago']

print()
print('=' * 60)
print('  EJECUTANDO 30 CICLOS')
print('=' * 60)

step_total = 0
cycle_ok = 0

for i in range(30):
    cat = categories[i % 10]
    loc = locations[i % 10]
    budget = round(10 + i * 3.5, 2)
    ts = str(int(time.time() * 1000)) + str(i)
    
    # 1. Create job
    r = requests.post(BASE + '/jobs', headers={'Authorization':'Bearer '+contractor_tok},
        json={'title':'Ciclo '+str(i+1)+' '+cat,'description':'test '+ts,
              'category':cat,'location':loc,'budget':budget,'duration':'4h'}, timeout=10)
    if r.status_code not in (200,201):
        print(f'  Ciclo {i+1}/30: FAIL create job HTTP {r.status_code}')
        stats['fail'] += 1
        continue
    jid = r.json()['id']
    time.sleep(0.15)
    
    # 2. Apply
    r = requests.post(BASE + '/jobs/'+str(jid)+'/apply',
        headers={'Authorization':'Bearer '+worker_tok,'Content-Type':'application/json'},
        json={'message':'Me interesa!'}, timeout=10)
    if r.status_code not in (200,201):
        print(f'  Ciclo {i+1}/30: FAIL apply HTTP {r.status_code}')
        stats['fail'] += 1
        continue
    time.sleep(0.15)
    
    # 3-4. View + Accept
    r = requests.get(BASE + '/jobs/'+str(jid)+'/applications', headers={'Authorization':'Bearer '+contractor_tok}, timeout=10)
    apps = r.json()
    app_id = apps[0]['id'] if (isinstance(apps, list) and len(apps) > 0) else None
    if not app_id:
        print(f'  Ciclo {i+1}/30: FAIL no applications')
        stats['fail'] += 1
        continue
    
    r = requests.post(BASE + '/jobs/'+str(jid)+'/accept/'+str(app_id),
        headers={'Authorization':'Bearer '+contractor_tok,'Content-Type':'application/json'}, json={}, timeout=10)
    if r.status_code != 200:
        print(f'  Ciclo {i+1}/30: FAIL accept HTTP {r.status_code}')
        stats['fail'] += 1
        continue
    time.sleep(0.15)
    
    # 5. Check-in
    r = requests.post(BASE + '/jobs/'+str(jid)+'/check-in',
        headers={'Authorization':'Bearer '+worker_tok,'Content-Type':'application/json'}, json={}, timeout=10)
    if r.status_code != 200:
        print(f'  Ciclo {i+1}/30: FAIL checkin HTTP {r.status_code}')
        stats['fail'] += 1
        continue
    time.sleep(0.15)
    
    # 6. Complete request
    r = requests.post(BASE + '/jobs/'+str(jid)+'/complete-request',
        headers={'Authorization':'Bearer '+worker_tok,'Content-Type':'application/json'}, json={}, timeout=10)
    if r.status_code != 200:
        print(f'  Ciclo {i+1}/30: FAIL complete HTTP {r.status_code}')
        stats['fail'] += 1
        continue
    time.sleep(0.15)
    
    # 7. Approve
    r = requests.post(BASE + '/jobs/'+str(jid)+'/approve',
        headers={'Authorization':'Bearer '+contractor_tok,'Content-Type':'application/json'}, json={}, timeout=10)
    if r.status_code != 200:
        print(f'  Ciclo {i+1}/30: FAIL approve HTTP {r.status_code}')
        stats['fail'] += 1
        continue
    time.sleep(0.15)
    
    # 8. Release (give balance first if needed)
    r = requests.post(BASE + '/payments/release/'+str(jid),
        headers={'Authorization':'Bearer '+contractor_tok}, timeout=10)
    if r.status_code != 200:
        print(f'  Ciclo {i+1}/30: FAIL release HTTP {r.status_code} - {r.text[:80]}')
        stats['fail'] += 1
        continue
    
    cycle_ok += 1
    stats['ok'] += 8
    print(f'  Ciclo {i+1}/30: OK (8 pasos) - ${budget}')
    time.sleep(0.2)

print()
print('=' * 60)
print('  RESULTADOS FINALES')
print('=' * 60)
print(f'  Ciclos completos: {cycle_ok}/30')
print(f'  Pasos exitosos:   {stats["ok"]}')
print(f'  Pasos fallidos:   {stats["fail"]}')
print('=' * 60)

# Ver BD
print()
sys.path.insert(0, r'C:\Users\yochi\Desktop\freelance-web\backend')
from app.database import SessionLocal
from app.models.audit_log import AuditLog
from app.models.transaction import Transaction
from app.models.job import Job

db = SessionLocal()
log_count = db.query(AuditLog).count()
tx_count = db.query(Transaction).count()
completed = db.query(Job).filter(Job.status == 'completed').count()
print(f'  Audit logs:   {log_count}')
print(f'  Transacciones: {tx_count}')
print(f'  Jobs completados: {completed}')
print()
print('  Ultimos audit logs:')
for log in db.query(AuditLog).order_by(AuditLog.id.desc()).limit(10).all():
    print(f'    #{log.id:3d} user={log.user_id:2d} action={log.action:25s}')
db.close()
