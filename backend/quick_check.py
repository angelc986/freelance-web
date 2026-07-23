import hashlib

import psycopg2

conn = psycopg2.connect(
    host="aws-1-us-west-2.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user="postgres.kojuiugfdhspdblfcmvm",
    password="28659265An$",
    connect_timeout=5,
)
cur = conn.cursor()
cur.execute("SELECT id, email, full_name, cedula FROM users WHERE LENGTH(cedula) = 64 ORDER BY id")
rows = cur.fetchall()
print(f"Found {len(rows)} hashed users")
for r in rows:
    print(f"  ID={r[0]} {r[3][:20]}... {r[1]} {r[2]}")

# Quick check: test known number
test_hash = hashlib.sha256(b"28659265").hexdigest()
for r in rows:
    if r[3] == test_hash:
        print(f"\nConfirmed: 28659265 matches ID={r[0]}")

cur.close()
conn.close()
