import hashlib

import psycopg2

conn = psycopg2.connect(
    host="aws-1-us-west-2.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user="postgres.kojuiugfdhspdblfcmvm",
    password="28659265An$",
)
cur = conn.cursor()
cur.execute("SELECT id, email, cedula FROM users WHERE LENGTH(cedula) = 64 ORDER BY id")
targets = {}
for r in cur.fetchall():
    targets[r[0]] = {"email": r[1], "hash": r[2]}
    print(f"ID={r[0]} {r[1]:30} hash={r[2][:30]}...")

# Try different formats for numbers 1-1M (V-prefix, E-prefix, etc)
import time

start = time.time()
found = 0
for i in range(1, 1000001):
    if i % 100000 == 0:
        print(f"  {i:,}/1M ({i / 10000:.0f}%) found={found}", flush=True)
    for fmt in [f"V{i}", f"V-{i}", f"E{i}", f"E-{i}", str(i).zfill(8), str(i).zfill(7)]:
        h = hashlib.sha256(fmt.encode()).hexdigest()
        for uid, data in list(targets.items()):
            if h == data["hash"]:
                print(f"\nFOUND: ID={uid} {data['email']} -> {repr(fmt)}\n", flush=True)
                try:
                    cur.execute("UPDATE users SET cedula = %s WHERE id = %s", (str(i), uid))
                    conn.commit()
                except Exception as e:
                    print(f"  DB error: {e}", flush=True)
                del targets[uid]
                found += 1
                break
    if not targets:
        break

# Try common test strings
for ced in ["test", "admin", "contratista", "worker", "contractor", "12345678", "87654321"]:
    h = hashlib.sha256(ced.encode()).hexdigest()
    for uid, data in list(targets.items()):
        if h == data["hash"]:
            print(f"FOUND: ID={uid} {data['email']} -> {repr(ced)}", flush=True)
            del targets[uid]
            found += 1

print(f"\nDone: {found} found, {len(targets)} remaining in {time.time() - start:.0f}s")
for uid, data in targets.items():
    print(f"  NOT FOUND: ID={uid} {data['email']} hash={data['hash'][:30]}...")
cur.close()
conn.close()
