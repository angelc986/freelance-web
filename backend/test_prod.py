import urllib.request, json

BASE = "https://freelance-web-production-add4.up.railway.app/api/v1"

# Test with wrong creds
data = json.dumps({'email':'test@test.com','password':'wrong'}).encode()
req = urllib.request.Request(BASE + '/auth/login', data=data, headers={'Content-Type':'application/json'})
try:
    r = urllib.request.urlopen(req)
    result = json.loads(r.read())
    with open('C:\\Users\\yochi\\Desktop\\freelance-web\\backend\\test_output.txt', 'w') as f:
        f.write('Status: ' + str(r.status) + '\n')
        f.write('Result: ' + json.dumps(result) + '\n')
except urllib.request.HTTPError as e:
    body = e.read().decode()
    with open('C:\\Users\\yochi\\Desktop\\freelance-web\\backend\\test_output.txt', 'w') as f:
        f.write('Code: ' + str(e.code) + '\n')
        f.write('Body: ' + body + '\n')
