import sys

sys.path.insert(0, r"C:\Users\yochi\Desktop\freelance-web\backend")
from app.database import SessionLocal
from app.models.application import Application
from app.models.audit_log import AuditLog
from app.models.job import Job
from app.models.transaction import Transaction
from app.models.user import User

db = SessionLocal()

# 1. Eliminar usuarios de prueba (test_contractor, test_worker)
for u in db.query(User).filter(User.email.like("test_%@test.com")).all():
    print(f"Eliminando usuario: {u.full_name} ({u.email})")
    db.delete(u)

# 2. Eliminar jobs de prueba (Ciclo, Flujo Completo Test)
for j in db.query(Job).filter(Job.title.like("Ciclo%")).all():
    db.query(Application).filter(Application.job_id == j.id).delete()
    db.query(Transaction).filter(Transaction.job_id == j.id).delete()
    print(f"Eliminado job ciclo: {j.id} {j.title}")
    db.delete(j)

j = db.query(Job).filter(Job.title == "Flujo Completo Test").first()
if j:
    db.query(Application).filter(Application.job_id == j.id).delete()
    db.query(Transaction).filter(Transaction.job_id == j.id).delete()
    print("Eliminado job: Flujo Completo Test")
    db.delete(j)

j = db.query(Job).filter(Job.title == "FinalTest").first()
if j:
    db.query(Application).filter(Application.job_id == j.id).delete()
    db.delete(j)
    print("Eliminado job: FinalTest")

db.commit()

# 3. Mostrar estado final
print()
print("=== ESTADO FINAL ===")
print(f"Usuarios: {db.query(User).count()}")
print(f"Jobs: {db.query(Job).count()}")
print(f"Transacciones: {db.query(Transaction).count()}")
print(f"Aplicaciones: {db.query(Application).count()}")
print(f"Audit Logs: {db.query(AuditLog).count()}")
print()

print("JOBS RESTANTES:")
for j in db.query(Job).all():
    print(f'  ID={j.id} "{j.title}" status={j.status} budget={j.budget}')

print()
print("TRANSACCIONES RESTANTES:")
for t in db.query(Transaction).all():
    print(f"  ID={t.id} job={t.job_id} tipo={t.type} monto={t.amount} status={t.status}")

print()
print("USUARIOS:")
for u in db.query(User).all():
    if u.is_admin:
        print(f"  ID={u.id} {u.full_name} (ADMIN) balance={u.balance}")
    else:
        print(f"  ID={u.id} {u.full_name} ({u.email}) balance={u.balance} role={u.role}")

db.close()
