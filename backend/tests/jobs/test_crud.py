"""
Job CRUD tests — FASE 3C
Covers: create, read, update, delete/cancel (6 tests)
"""

JOB_PAYLOAD = {
    "title": "Test Job CRUD",
    "description": "Testing CRUD operations",
    "category": "Servicios",
    "location": "Caracas",
    "budget": 50.0,
    "duration": "2h",
}


def _create_job(client, token):
    resp = client.post(
        "/api/v1/jobs/", json=JOB_PAYLOAD, headers={"Authorization": f"Bearer {token}"}
    )
    return resp


class TestJobCreate:
    """POST /api/v1/jobs/ — job creation."""

    def test_create_job_success(self, client, contractor_token):
        """Contractor can create a job."""
        resp = _create_job(client, contractor_token)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == JOB_PAYLOAD["title"]
        assert data["budget"] == JOB_PAYLOAD["budget"]
        assert data["status"] == "open"
        assert data["client_id"] is not None

    def test_worker_cannot_create_job(self, client, worker_token):
        """Worker gets 403 when creating job."""
        resp = _create_job(client, worker_token)
        assert resp.status_code == 403

    def test_create_job_without_auth(self, client):
        """No token returns 401/403."""
        resp = client.post("/api/v1/jobs/", json=JOB_PAYLOAD)
        assert resp.status_code in (401, 403)

    def test_create_job_missing_fields(self, client, contractor_token):
        """Missing required fields returns 422."""
        resp = client.post(
            "/api/v1/jobs/",
            json={"title": "x"},
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 422


class TestJobUpdate:
    """PUT /api/v1/jobs/{id} — job editing."""

    def test_update_own_job(self, client, contractor_token):
        """Owner can update their open job."""
        jid = _create_job(client, contractor_token).json()["id"]
        resp = client.put(
            f"/api/v1/jobs/{jid}",
            json={
                **JOB_PAYLOAD,
                "title": "Updated Title",
                "budget": 75.0,
            },
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    def test_update_not_owner(self, client, contractor_token, worker_token):
        """Non-owner cannot update job."""
        jid = _create_job(client, contractor_token).json()["id"]
        resp = client.put(
            f"/api/v1/jobs/{jid}",
            json={**JOB_PAYLOAD, "title": "Hacked!"},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert resp.status_code == 403
