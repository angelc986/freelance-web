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

# Check both accounts
cur.execute(
    "SELECT id, email, full_name, cedula, cedula_locked FROM users WHERE email IN ('Angel@gmail.com', 'angelcurbelos901@gmail.com')"
)
for r in cur.fetchall():
    print(f"  ID={r[0]} {r[1]:30} {r[2]:20} cedula='{str(r[3])[:25]}' locked={r[4]}")

# Delete Angel@gmail.com (ID=10)
cur.execute("DELETE FROM users WHERE email = 'Angel@gmail.com'")
print(f"\nDeleted Angel@gmail.com: {cur.rowcount} row(s)")

# Update angelcurbelos901@gmail.com: set real cedula and lock it
cur.execute(
    "UPDATE users SET cedula = '28659265', cedula_locked = TRUE WHERE email = 'angelcurbelos901@gmail.com'"
)
print(f"Updated angelcurbelos901@gmail.com: {cur.rowcount} row(s)")

# Verify
cur.execute(
    "SELECT id, email, full_name, cedula, cedula_locked FROM users WHERE email = 'angelcurbelos901@gmail.com'"
)
for r in cur.fetchall():
    print(f"\nVerified: ID={r[0]} {r[1]} cedula={r[3]} locked={r[4]}")

print("\nDone!")
cur.close()
conn.close()
