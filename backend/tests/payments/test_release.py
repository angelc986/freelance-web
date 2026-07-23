"""
Release / Escrow tests — FASE 3B
Covers: completed job release, insufficient funds, non-owner rejected

Note: The job flow (create→approve) has a pre-existing bug (approve returns 400).
      These tests bypass it by creating completed jobs directly in the DB.
"""

from app.models.job import Job
from app.models.user import User


def _create_completed_job_db(
    db, contractor_email="contractor@test.com", worker_email="worker@test.com", budget=50.0
):
    """Create a completed job directly in DB (bypasses broken job flow)."""
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

    # Give contractor enough held_balance for escrow
    contractor.held_balance = budget
    contractor.balance = budget  # total balance >= held_balance

    job = Job(
        title="Test Job Release",
        description="DB-created completed job",
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


class TestRelease:
    """POST /api/v1/payments/release/{job_id} — payment release."""

    def test_release_completed_job_success(self, client, contractor_token, db):
        """Contractor releases payment for completed job."""
        jid = _create_completed_job_db(db)

        resp = client.post(
            f"/api/v1/payments/release/{jid}",
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "release"
        assert data["amount"] == 50.0

    def test_release_wrong_owner_rejected(self, client, contractor_token, worker_token, db):
        """Worker cannot release payment for job they don't own."""
        jid = _create_completed_job_db(db)

        resp = client.post(
            f"/api/v1/payments/release/{jid}", headers={"Authorization": f"Bearer {worker_token}"}
        )
        assert resp.status_code == 403

    def test_release_insufficient_held_balance(self, client, contractor_token, db):
        """Release fails if contractor has insufficient held_balance."""
        jid = _create_completed_job_db(db, budget=200.0)
        # held_balance set to 200 but contractor only has balance=200
        # Override: set held_balance too low
        contractor = db.query(User).filter(User.email == "contractor@test.com").first()
        contractor.held_balance = 10.0  # Not enough for 200 budget
        db.commit()

        resp = client.post(
            f"/api/v1/payments/release/{jid}",
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 400
