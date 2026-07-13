import requests, sys, time
BASE = 'http://localhost:8002/api/v1'

# Login
r = requests.post(BASE + '/auth/login', json={'email':'instaworkve@gmail.com','password':'test123'}, timeout=10)
tok = r.json()['access_token']
r2 = requests.post(BASE + '/auth/login', json={'email':'angelcurbelo901@gmail.com','password':'test123'}, timeout=10)
ctok = r2.json()['access_token']

# Create job
r3 = requests.post(BASE + '/jobs', headers={'Authorization':'Bearer '+ctok},
    json={'title':'FixTest','description':'test','category':'Servicios','location':'Caracas','budget':50,'duration':'2h'}, timeout=10)
jid = r3.json()['id']
print('1. Create job: ' + str(jid) + ' HTTP ' + str(r3.status_code))

# Apply
r4 = requests.post(BASE + '/jobs/'+str(jid)+'/apply', 
    headers={'Authorization':'Bearer '+tok,'Content-Type':'application/json'},
    json={'message':'test'}, timeout=10)
print('2. Apply: HTTP ' + str(r4.status_code) + ' ' + (r4.text[:200] if r4.status_code != 200 else ''))

if r4.status_code != 200:
    print('FIX FAILED - server still has bug')
    sys.exit(1)

time.sleep(0.5)

# View apps
r5 = requests.get(BASE + '/jobs/'+str(jid)+'/applications', headers={'Authorization':'Bearer '+ctok}, timeout=10)
apps = r5.json()
apps_list = apps if isinstance(apps, list) else []
app_id = apps_list[0]['id']
print('3. View apps: app_id=' + str(app_id))

time.sleep(0.5)

# Accept
r6 = requests.post(BASE + '/jobs/'+str(jid)+'/accept/'+str(app_id),
    headers={'Authorization':'Bearer '+ctok}, json={}, timeout=10)
print('4. Accept: HTTP ' + str(r6.status_code) + ' ' + (r6.text[:200] if r6.status_code != 200 else ''))

time.sleep(0.5)

# Check-in
r7 = requests.post(BASE + '/jobs/'+str(jid)+'/check-in',
    headers={'Authorization':'Bearer '+tok}, json={}, timeout=10)
print('5. Check-in: HTTP ' + str(r7.status_code))

time.sleep(0.5)

# Complete-request
r8 = requests.post(BASE + '/jobs/'+str(jid)+'/complete-request',
    headers={'Authorization':'Bearer '+tok}, json={}, timeout=10)
print('6. Complete: HTTP ' + str(r8.status_code) + ' ' + (r8.text[:200] if r8.status_code != 200 else ''))

time.sleep(0.5)

# Approve
r9 = requests.post(BASE + '/jobs/'+str(jid)+'/approve',
    headers={'Authorization':'Bearer '+ctok}, json={}, timeout=10)
print('7. Approve: HTTP ' + str(r9.status_code) + ' ' + (r9.text[:200] if r9.status_code != 200 else ''))

time.sleep(0.5)

# Release
import sqlite3
conn = sqlite3.connect(r'C:\Users\yochi\Desktop\freelance-web\backend\freelance.db')
conn.execute("UPDATE users SET balance = 50000 WHERE email = 'angelcurbelo901@gmail.com'")
conn.commit()
conn.close()

r10 = requests.post(BASE + '/payments/release/'+str(jid),
    headers={'Authorization':'Bearer '+ctok}, timeout=10)
print('8. Release: HTTP ' + str(r10.status_code) + ' ' + (r10.text[:200] if r10.status_code != 200 else ''))

print()
print('=== FLUJO COMPLETO ' + ('OK' if all(x >= 200 for x in [r4.status_code, r6.status_code, r7.status_code, r8.status_code, r9.status_code, r10.status_code]) else 'FAIL') + ' ===')
