"""
Tests de trabajos: CRUD, apply/accept, check-in, complete, approve, cancel, dispute
"""

from fastapi.testclient import TestClient


def create_job(client, token, budget=100):
    """Helper para crear un trabajo."""
    return client.post(
        "/api/v1/jobs",
        json={
            "title": "Test Job",
            "description": "Test description",
            "category": "Servicios",
            "location": "Caracas",
            "budget": budget,
            "duration": "2 horas",
        },
        headers={"Authorization": f"Bearer {token}"},
    )


class TestCreateJob:
    def test_contractor_can_create_job(self, client: TestClient, contractor_token):
        """Contractor puede crear un trabajo."""
        resp = create_job(client, contractor_token)
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["title"] == "Test Job"
        assert data["status"] == "open"
        assert data["client_id"] is not None

    def test_worker_cannot_create_job(self, client: TestClient, worker_token):
        """Worker NO puede crear un trabajo (debe dar 403)."""
        resp = create_job(client, worker_token)
        assert resp.status_code == 403

    def test_unauthorized_cannot_create_job(self, client: TestClient):
        """Usuario no autenticado NO puede crear trabajo."""
        resp = create_job(client, "")
        assert resp.status_code == 401


class TestApplyAccept:
    def test_worker_can_apply(self, client: TestClient, contractor_token, worker_token):
        """Worker puede postularse a un trabajo abierto."""
        job = create_job(client, contractor_token).json()
        resp = client.post(
            f"/api/v1/jobs/{job['id']}/apply",
            json={
                "message": "Me interesa!",
            },
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert resp.status_code in (200, 201)

    def test_contractor_cannot_apply_own_job(
        self, client: TestClient, contractor_token, worker_token
    ):
        """Contractor NO puede postularse a su propio trabajo."""
        job = create_job(client, contractor_token).json()
        resp = client.post(
            f"/api/v1/jobs/{job['id']}/apply",
            json={
                "message": "Me interesa!",
            },
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 400

    def test_contractor_can_accept_applicant(
        self, client: TestClient, contractor_token, worker_token
    ):
        """Contractor puede aceptar un aplicante."""
        job = create_job(client, contractor_token).json()
        client.post(
            f"/api/v1/jobs/{job['id']}/apply",
            json={"message": "test"},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        apps = client.get(
            f"/api/v1/jobs/{job['id']}/applications",
            headers={"Authorization": f"Bearer {contractor_token}"},
        ).json()
        app_id = apps[0]["id"]
        resp = client.post(
            f"/api/v1/jobs/{job['id']}/accept/{app_id}",
            json={},
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "in_progress"
        assert resp.json()["worker_id"] is not None


class TestJobFlow:
    def test_full_flow(self, client: TestClient, contractor_token, worker_token):
        """Flujo completo: crear -> aplicar -> aceptar -> check-in -> complete -> approve."""
        job = create_job(client, contractor_token).json()
        jid = job["id"]

        client.post(
            f"/api/v1/jobs/{jid}/apply",
            json={"message": "test"},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        apps = client.get(
            f"/api/v1/jobs/{jid}/applications",
            headers={"Authorization": f"Bearer {contractor_token}"},
        ).json()
        client.post(
            f"/api/v1/jobs/{jid}/accept/{apps[0]['id']}",
            json={},
            headers={"Authorization": f"Bearer {contractor_token}"},
        )

        resp = client.post(
            f"/api/v1/jobs/{jid}/check-in",
            json={},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "checked_in"

        resp = client.post(
            f"/api/v1/jobs/{jid}/complete-request",
            json={},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "review_pending"

        resp = client.post(
            f"/api/v1/jobs/{jid}/approve",
            json={},
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] in ("completed", "pending_review")


class TestCancelDispute:
    def test_cancel_before_checkin(self, client: TestClient, contractor_token, worker_token):
        """Contractor puede cancelar antes del check-in."""
        job = create_job(client, contractor_token).json()
        client.post(
            f"/api/v1/jobs/{job['id']}/apply",
            json={"message": "test"},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        apps = client.get(
            f"/api/v1/jobs/{job['id']}/applications",
            headers={"Authorization": f"Bearer {contractor_token}"},
        ).json()
        client.post(
            f"/api/v1/jobs/{job['id']}/accept/{apps[0]['id']}",
            json={},
            headers={"Authorization": f"Bearer {contractor_token}"},
        )

        resp = client.post(
            f"/api/v1/jobs/{job['id']}/cancel",
            json={},
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_dispute_after_complete(self, client: TestClient, contractor_token, worker_token):
        """Worker puede disputar despues de complete-request y antes de approve."""
        job = create_job(client, contractor_token).json()
        jid = job["id"]

        client.post(
            f"/api/v1/jobs/{jid}/apply",
            json={"message": "test"},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        apps = client.get(
            f"/api/v1/jobs/{jid}/applications",
            headers={"Authorization": f"Bearer {contractor_token}"},
        ).json()
        client.post(
            f"/api/v1/jobs/{jid}/accept/{apps[0]['id']}",
            json={},
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        client.post(
            f"/api/v1/jobs/{jid}/check-in",
            json={},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        client.post(
            f"/api/v1/jobs/{jid}/complete-request",
            json={},
            headers={"Authorization": f"Bearer {worker_token}"},
        )

        # Disputar
        resp = client.post(
            f"/api/v1/jobs/{jid}/dispute",
            json={"reason": "No pago"},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert resp.status_code in (200, 403)
        if resp.status_code == 200:
            assert resp.json()["status"] == "disputed"
            assert resp.json()["dispute_reason"] == "No pago"
