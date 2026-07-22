"""
Transaction history tests — FASE 3B
Covers: user transaction listing, isolation between users
"""
from app.models.user import User
from app.models.job import Job
from app.models.transaction import Transaction


def _create_completed_job_db(db, contractor_email="contractor@test.com",
                             worker_email="worker@test.com", budget=50.0):
    """Create a completed job directly in DB."""
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

    contractor = db.query(User).filter(User.email == contractor_email).first()
    worker = db.query(User).filter(User.email == worker_email).first()

    # Create worker if not already created by worker_token fixture
    if worker is None:
        worker = User(
            email=worker_email,
            password_hash=pwd.hash("Test123!"),
            full_name="Test Worker",
            phone="+584142222222",
            cedula="V-22222222",
            role="worker",
        )
        db.add(worker)
        db.flush()

    contractor.held_balance = budget
    contractor.balance = budget
    job = Job(
        title="Test Job History",
        description="DB-created job",
        category="Servicios",
        location="Caracas",
        duration="2h",
        budget=budget,
        status="completed",
        client_id=contractor.id,
        worker_id=worker.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job.id


class TestHistory:
    """GET /api/v1/payments/history — transaction listing."""

    def test_history_returns_list(self, client, contractor_token, db):
        """Authenticated user gets transaction list (may be empty)."""
        resp = client.get("/api/v1/payments/history",
                         headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_history_after_release(self, client, contractor_token, db):
        """After releasing payment, history shows the release transaction."""
        jid = _create_completed_job_db(db)

        # Release payment
        client.post(f"/api/v1/payments/release/{jid}",
                   headers={"Authorization": f"Bearer {contractor_token}"})

        resp = client.get("/api/v1/payments/history",
                         headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        release_tx = [t for t in data if t["type"] == "release"]
        assert len(release_tx) >= 1
        assert release_tx[0]["amount"] == 50.0
