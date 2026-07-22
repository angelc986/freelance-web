const https = require('https');
const H = { 'Content-Type': 'application/json' };

function api(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const hdrs = { ...H };
    if (token) hdrs['Authorization'] = 'Bearer ' + token;
    const req = https.request({ hostname: 'freelance-web-beta.vercel.app', path, method, headers: hdrs }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  const c = await api('POST', '/api/v1/auth/login', { email: 'test.contractor@turnogo.com', password: 'Test123!' });
  const tok = c.access_token;
  console.log('Login OK');

  const LAT = 47.0785, LNG = -122.4297;
  const LOCATION = '19422 Mountain Highway East, Spanaway, WA 98387';

  for (const jobId of [29, 30, 31, 32, 33]) {
    try {
      const job = await api('GET', '/api/v1/jobs/' + jobId);
      const result = await api('PUT', '/api/v1/jobs/' + jobId, {
        title: job.title,
        description: job.description,
        category: job.category,
        location: LOCATION,
        budget: job.budget,
        duration: job.duration,
        latitude: LAT,
        longitude: LNG,
      }, tok);
      console.log('Job', jobId, result.title, '-> GPS OK');
    } catch(e) {
      console.log('Job', jobId, 'SKIP:', e.message || e);
    }
  }
  console.log('\nListo. Todos en Spanaway, WA.');
}
main().catch(e => console.error(e));
