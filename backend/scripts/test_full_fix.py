import requests, time, sqlite3, sys

BASE = 'http://localhost:8002/api/v1'

# Login
r = requests.post(BASE + '/auth/login', json={'email':'instaworkve@gmail.com','password':'test123'}, timeout=10)
tok = r.json()['access_token']
r2 = requests.post(BASE + '/auth/login', json={'email':'angelcurbelo901@gmail.com','password':'test123'}, timeout=10)
ctok = r2.json()['access_token']

# Give balance
conn = sqlite3.connect(r'C:\Users\yochi\Desktop\freelance-web\backend\freelance.db')
conn.execute("UPDATE users SET balance = 50000 WHERE email = 'angelcurbelo901@gmail.com'")
conn.commit()
conn.close()

results = []

# 1. Create job
r = requests.post(BASE + '/jobs', headers={'Authorization':'Bearer '+ctok},
    json={'title':'FinalTest','description':'test','category':'Servicios','location':'Caracas','budget':50,'duration':'2h'}, timeout=10)
jid = r.json()['id']
print('1. Crear trabajo:      HTTP ' + str(r.status_code) + ' ID=' + str(jid))
results.append(('Crear trabajo', r.status_code in (200,201)))

time.sleep(0.3)

# 2. Apply
r = requests.post(BASE + '/jobs/'+str(jid)+'/apply',
    headers={'Authorization':'Bearer '+tok,'Content-Type':'application/json'}, json={'message':'test'}, timeout=10)
ok = r.status_code in (200,201)
print('2. Aplicar:            HTTP ' + str(r.status_code) + (' OK' if ok else ' FAIL'))
results.append(('Aplicar', ok))

time.sleep(0.3)

# 3. View apps
r = requests.get(BASE + '/jobs/'+str(jid)+'/applications', headers={'Authorization':'Bearer '+ctok}, timeout=10)
apps = r.json()
app_id = None
if isinstance(apps, list) and len(apps) > 0:
    app_id = apps[0]['id']
print('3. Ver aplicantes:     app_id=' + str(app_id) + ' HTTP ' + str(r.status_code))
results.append(('Ver aplicantes', app_id is not None and r.status_code == 200))

time.sleep(0.3)

# 4. Accept
if app_id:
    r = requests.post(BASE + '/jobs/'+str(jid)+'/accept/'+str(app_id),
        headers={'Authorization':'Bearer '+ctok,'Content-Type':'application/json'}, json={}, timeout=10)
    ok = r.status_code == 200
    print('4. Aceptar worker:     HTTP ' + str(r.status_code) + (' OK' if ok else ' FAIL: ' + r.text[:100]))
    results.append(('Aceptar', ok))

time.sleep(0.3)

# 5. Check-in
r = requests.post(BASE + '/jobs/'+str(jid)+'/check-in',
    headers={'Authorization':'Bearer '+tok,'Content-Type':'application/json'}, json={}, timeout=10)
ok = r.status_code == 200
print('5. Check-in:           HTTP ' + str(r.status_code) + (' OK' if ok else ' FAIL'))
results.append(('Check-in', ok))

time.sleep(0.3)

# 6. Complete request
r = requests.post(BASE + '/jobs/'+str(jid)+'/complete-request',
    headers={'Authorization':'Bearer '+tok,'Content-Type':'application/json'}, json={}, timeout=10)
ok = r.status_code == 200
print('6. Complete-request:   HTTP ' + str(r.status_code) + (' OK' if ok else ' FAIL: ' + r.text[:100]))
results.append(('Complete-request', ok))

time.sleep(0.3)

# 7. Approve
r = requests.post(BASE + '/jobs/'+str(jid)+'/approve',
    headers={'Authorization':'Bearer '+ctok,'Content-Type':'application/json'}, json={}, timeout=10)
ok = r.status_code == 200
print('7. Approve completado: HTTP ' + str(r.status_code) + (' OK' if ok else ' FAIL: ' + r.text[:100]))
results.append(('Approve', ok))

time.sleep(0.3)

# 8. Release
r = requests.post(BASE + '/payments/release/'+str(jid),
    headers={'Authorization':'Bearer '+ctok}, timeout=10)
ok = r.status_code == 200
print('8. Release pago:       HTTP ' + str(r.status_code) + (' OK' if ok else ' FAIL: ' + r.text[:100]))
results.append(('Release', ok))

print()
print('=' * 50)
passed = sum(1 for _, ok in results if ok)
failed = sum(1 for _, ok in results if not ok)
print('RESULTADO: ' + str(passed) + '/' + str(len(results)) + ' exitosos')
for name, ok in results:
    print('  ' + ('OK' if ok else 'FAIL') + '  ' + name)
print('=' * 50)
