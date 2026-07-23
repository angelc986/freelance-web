import psycopg2

conn = psycopg2.connect(
    host="aws-1-us-west-2.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user="postgres.kojuiugfdhspdblfcmvm",
    password="28659265An$",
)
conn.autocommit = True
cur = conn.cursor()

# See current values
cur.execute(
    "SELECT id, email, cedula FROM users WHERE email LIKE '%angel%' OR email LIKE '%gmail%'"
)
rows = cur.fetchall()
for row in rows:
    print(f"  ID={row[0]} email={row[1]} cedula(truncated)={str(row[2])[:30]}")

# Update Angel's cedula
cur.execute("UPDATE users SET cedula = '28659265' WHERE email = 'Angel@gmail.com'")
print(f"Updated: {cur.rowcount} user(s)")

# Verify
cur.execute("SELECT id, email, cedula FROM users WHERE email = 'Angel@gmail.com'")
for row in cur.fetchall():
    print(f"  Now: ID={row[0]} email={row[1]} cedula='{row[2]}'")

cur.close()
conn.close()
print("Done!")
