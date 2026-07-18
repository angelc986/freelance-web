import psycopg2
import json

conn = psycopg2.connect(
    host="aws-1-us-west-2.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user="postgres.kojuiugfdhspdblfcmvm",
    password="28659265An$"
)
conn.autocommit = True
cur = conn.cursor()

# Add cedula_locked column
cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name='users' AND column_name='cedula_locked'
""")
if not cur.fetchone():
    cur.execute("ALTER TABLE users ADD COLUMN cedula_locked BOOLEAN DEFAULT FALSE")
    print("[OK] Column cedula_locked added")
else:
    print("[OK] Column cedula_locked already exists")

# Find users with hashed cedulas (64-char hex strings)
cur.execute("""
    SELECT id, email, full_name FROM users 
    WHERE LENGTH(cedula) = 64
""")
hashed_users = cur.fetchall()
print(f"\nUsers with hashed cedulas: {len(hashed_users)}")

# Create notification for each
created = 0
for u in hashed_users:
    cur.execute("""
        INSERT INTO notifications (user_id, event, message, data, read, created_at)
        VALUES (%s, 'update_cedula', %s, %s, FALSE, NOW())
    """, (
        u[0],
        "Actualiza tu numero de cedula — Tu documento de identidad necesita ser actualizado en tu perfil.",
        json.dumps({"action": "update_cedula", "redirect": "/dashboard/settings"}),
    ))
    created += 1
    print(f"  Created notification for ID={u[0]} {u[1]} ({u[2]})")

# Mark Angel@gmail.com (ID=10) as locked since it already has valid cedula
cur.execute("UPDATE users SET cedula_locked = TRUE WHERE email = 'Angel@gmail.com'")
print(f"\n[OK] Locked cedula for Angel@gmail.com")

conn.commit()
print(f"Done! {created} notifications created")
cur.close()
conn.close()
