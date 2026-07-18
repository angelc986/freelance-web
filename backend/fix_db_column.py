import psycopg2
import os

# Connection from MEMORY - Supabase pooler
conn = psycopg2.connect(
    host="aws-1-us-west-2.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user="postgres.kojuiugfdhspdblfcmvm",
    password="28659265An$"
)
conn.autocommit = True
cur = conn.cursor()

# Check if column exists
cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name='users' AND column_name='avatar_verified'
""")
exists = cur.fetchone()

if not exists:
    cur.execute("ALTER TABLE users ADD COLUMN avatar_verified BOOLEAN DEFAULT FALSE")
    print("[OK] Column avatar_verified added")
else:
    print("[OK] Column avatar_verified already exists")

# Verify
cur.execute("SELECT id, email, avatar_verified FROM users LIMIT 5")
for row in cur.fetchall():
    print(f"  User {row[0]}: {row[1]} -> avatar_verified={row[2]}")

cur.close()
conn.close()
print("Done!")
