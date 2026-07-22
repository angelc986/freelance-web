"""
Job lifecycle tests — FASE 3C
Covers: apply, accept, check-in, complete-request, verify, approve, dispute (12 tests)

Pre-existing bug: accept() modifies current_user from auth session but
commits via a different get_db session → held_balance never persisted.
Approve/Cancel affected. Workaround: set held_balance via db fixture.
"""
from app.models.user import User
from app.models.job import Job


JOB_PAYLOAD = {
    "title": "Lifecycle Job",
    "description": "Testing full lifecycle",
    "category": "Servicios",
    "location": "Caracas",
    "budget": 50.0,
    "duration": "2h",
}


def _create_job(client, token):
    resp = client.post("/api/v1/jobs/", json=JOB_PAYLOAD,
                       headers={"Authorization": f"Bearer {token}"})
    return resp.json()["id"]


def _apply(client, worker_token, job_id):
    return client.post(f"/api/v1/jobs/{job_id}/apply",
        json={"message": "I can do this"},
        headers={"Authorization": f"Bearer {worker_token}"})


def _get_first_app(client, contractor_token, job_id):
    resp = client.get(f"/api/v1/jobs/{job_id}/applications",
        headers={"Authorization": f"Bearer {contractor_token}"})
    apps = resp.json()
    return apps[0]["id"] if apps else None


def _accept(client, contractor_token, job_id, app_id, db=None):
    """Accept worker."""
    resp = client.post(f"/api/v1/jobs/{job_id}/accept/{app_id}",
        json={},
        headers={"Authorization": f"Bearer {contractor_token}"})
    return resp


# ─────────────────────────────────────────────────────
# APPLICATION FLOW (5 tests)
# ─────────────────────────────────────────────────────


class TestApplicationFlow:
    """Apply → view applicants → accept."""

    def test_worker_can_apply(self, client, contractor_token, worker_token):
        """Worker applies to open job."""
        jid = _create_job(client, contractor_token)
        resp = _apply(client, worker_token, jid)
        assert resp.status_code == 201

    def test_duplicate_application_rejected(self, client, contractor_token, worker_token):
        """Worker cannot apply twice to same job."""
        jid = _create_job(client, contractor_token)
        _apply(client, worker_token, jid)
        resp = _apply(client, worker_token, jid)
        assert resp.status_code == 400

    def test_contractor_cannot_apply_own_job(self, client, contractor_token):
        """Owner cannot apply to own job."""
        jid = _create_job(client, contractor_token)
        resp = _apply(client, contractor_token, jid)
        assert resp.status_code == 400

    def test_client_can_view_applicants(self, client, contractor_token, worker_token):
        """Contractor sees applicants for their job."""
        jid = _create_job(client, contractor_token)
        _apply(client, worker_token, jid)
        resp = client.get(f"/api/v1/jobs/{jid}/applications",
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    def test_accept_worker(self, client, contractor_token, worker_token, db):
        """Contractor accepts worker → job goes in_progress."""
        jid = _create_job(client, contractor_token)
        _apply(client, worker_token, jid)
        app_id = _get_first_app(client, contractor_token, jid)
        assert app_id is not None

        resp = _accept(client, contractor_token, jid, app_id, db)
        assert resp.status_code == 200
        assert resp.json()["status"] == "in_progress"


# ─────────────────────────────────────────────────────
# LIFECYCLE (7 tests)
# ─────────────────────────────────────────────────────


class TestLifecycle:
    """Check-in → complete-request → verify/approve → dispute."""

    def _setup_accepted_job(self, client, contractor_token, worker_token, db):
        jid = _create_job(client, contractor_token)
        _apply(client, worker_token, jid)
        app_id = _get_first_app(client, contractor_token, jid)
        _accept(client, contractor_token, jid, app_id, db)
        return jid

    def test_check_in(self, client, contractor_token, worker_token, db):
        """Worker checks in → status becomes checked_in."""
        jid = self._setup_accepted_job(client, contractor_token, worker_token, db)
        resp = client.post(f"/api/v1/jobs/{jid}/check-in", json={},
            headers={"Authorization": f"Bearer {worker_token}"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "checked_in"

    def test_check_in_wrong_worker(self, client, contractor_token, worker_token, db):
        """Non-assigned worker cannot check in."""
        jid = self._setup_accepted_job(client, contractor_token, worker_token, db)
        resp = client.post(f"/api/v1/jobs/{jid}/check-in", json={},
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 403

    def test_complete_request(self, client, contractor_token, worker_token, db):
        """Worker requests completion → review_pending with code."""
        jid = self._setup_accepted_job(client, contractor_token, worker_token, db)
        client.post(f"/api/v1/jobs/{jid}/check-in", json={},
            headers={"Authorization": f"Bearer {worker_token}"})
        resp = client.post(f"/api/v1/jobs/{jid}/complete-request", json={},
            headers={"Authorization": f"Bearer {worker_token}"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "review_pending"
        assert resp.json()["completion_code"] is not None

    def test_complete_request_wrong_worker(self, client, contractor_token, worker_token, db):
        """Non-assigned worker cannot request completion."""
        jid = self._setup_accepted_job(client, contractor_token, worker_token, db)
        resp = client.post(f"/api/v1/jobs/{jid}/complete-request", json={},
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 403

    def test_verify_completion_with_code(self, client, contractor_token, worker_token, db):
        """Worker verifies with correct code → job completes, payment released."""
        jid = self._setup_accepted_job(client, contractor_token, worker_token, db)
        client.post(f"/api/v1/jobs/{jid}/check-in", json={},
            headers={"Authorization": f"Bearer {worker_token}"})
        cr = client.post(f"/api/v1/jobs/{jid}/complete-request", json={},
            headers={"Authorization": f"Bearer {worker_token}"})
        code = cr.json()["completion_code"]

        # Set held_balance via DB (workaround session bug)
        contractor = db.query(User).filter(User.email == "contractor@test.com").first()
        contractor.held_balance = 50.0
        db.commit()

        resp = client.post(f"/api/v1/jobs/{jid}/verify-completion",
            json={"code": code},
            headers={"Authorization": f"Bearer {worker_token}"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    def test_verify_completion_wrong_code(self, client, contractor_token, worker_token, db):
        """Wrong verification code is rejected."""
        jid = self._setup_accepted_job(client, contractor_token, worker_token, db)
        client.post(f"/api/v1/jobs/{jid}/check-in", json={},
            headers={"Authorization": f"Bearer {worker_token}"})
        client.post(f"/api/v1/jobs/{jid}/complete-request", json={},
            headers={"Authorization": f"Bearer {worker_token}"})

        resp = client.post(f"/api/v1/jobs/{jid}/verify-completion",
            json={"code": "000000"},
            headers={"Authorization": f"Bearer {worker_token}"})
        assert resp.status_code == 400

    def test_dispute_job(self, client, contractor_token, worker_token, db):
        """Either party can dispute → status becomes disputed."""
        jid = self._setup_accepted_job(client, contractor_token, worker_token, db)
        resp = client.post(f"/api/v1/jobs/{jid}/dispute",
            json={"reason": "Poor quality work"},
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "disputed"
        assert resp.json()["dispute_reason"] == "Poor quality work"


# --- Regression: BUG held_balance session ---

class TestHeldBalanceRegression:
    """Verify that BUG: held_balance not persisted after accept is fixed."""

    def test_accept_persists_held_balance(self, client, contractor_token, worker_token, db):
        """After accepting worker, held_balance must be persisted in DB."""
        jid = _create_job(client, contractor_token)
        _apply(client, worker_token, jid)
        app_id = _get_first_app(client, contractor_token, jid)

        resp = client.post(f"/api/v1/jobs/{jid}/accept/{app_id}",
            json={},
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 200

        from app.models.user import User
        contractor = db.query(User).filter(
            User.email == "contractor@test.com").first()
        assert contractor.held_balance == 50.0, (
            f"held_balance should be 50.0, got {contractor.held_balance}"
        )

    def test_accept_no_available_balance(self, client, contractor_token, worker_token, db):
        """Accept fails if available < job budget."""
        from app.models.user import User
        contractor = db.query(User).filter(
            User.email == "contractor@test.com").first()
        contractor.balance = 30.0
        db.commit()

        jid = _create_job(client, contractor_token)
        _apply(client, worker_token, jid)
        app_id = _get_first_app(client, contractor_token, jid)

        resp = client.post(f"/api/v1/jobs/{jid}/accept/{app_id}",
            json={},
            headers={"Authorization": f"Bearer {contractor_token}"})
        assert resp.status_code == 400
