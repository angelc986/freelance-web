"""Fix sequences in Supabase after migration"""
import psycopg2

DST_URL = "postgresql://postgres:28659265An$@db.kojuiugfdhspdblfcmvm.supabase.co:5432/postgres"

dst = psycopg2.connect(DST_URL)
dst.autocommit = True
cur = dst.cursor()

tables = ['applications', 'audit_logs', 'jobs', 'notifications', 'ratings', 'refresh_tokens', 'transactions', 'users']
for t in tables:
    try:
        cur.execute("SELECT setval('{}_id_seq', COALESCE((SELECT MAX(id) FROM {}), 0) + 1)".format(t, t))
        print("Sequence {}_id_seq OK".format(t))
    except Exception as e:
        print("{}: {}".format(t, e))

# Check notifications
cur.execute("SELECT id, notification_type, title FROM notifications")
rows = cur.fetchall()
print("\nNotifications: {} rows".format(len(rows)))
for r in rows:
    print("  id={}, type={}, title={}".format(r[0], r[1], r[2]))

# Check users
cur.execute("SELECT id, email, full_name, avatar_url FROM users")
rows = cur.fetchall()
print("\nUsers:")
for r in rows:
    print("  id={}, email={}, name={}, avatar={}".format(r[0], r[1], r[2], r[3]))

cur.close()
dst.close()
print("\nDone")
