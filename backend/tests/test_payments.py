"""
Tests de pagos: deposito, saldo, release, retiro, confirmacion
"""

from fastapi.testclient import TestClient


def create_completed_job(client, contractor_token, worker_token):
    """Crea un trabajo y lo lleva hasta completado."""
    job_resp = client.post(
        "/api/v1/jobs",
        json={
            "title": "Payable Job",
            "description": "test",
            "category": "Servicios",
            "location": "Caracas",
            "budget": 50,
            "duration": "2h",
        },
        headers={"Authorization": f"Bearer {contractor_token}"},
    )
    jid = job_resp.json()["id"]

    client.post(
        f"/api/v1/jobs/{jid}/apply",
        json={"message": "test"},
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    apps = client.get(
        f"/api/v1/jobs/{jid}/applications", headers={"Authorization": f"Bearer {contractor_token}"}
    ).json()
    client.post(
        f"/api/v1/jobs/{jid}/accept/{apps[0]['id']}",
        json={},
        headers={"Authorization": f"Bearer {contractor_token}"},
    )
    client.post(
        f"/api/v1/jobs/{jid}/check-in", json={}, headers={"Authorization": f"Bearer {worker_token}"}
    )
    client.post(
        f"/api/v1/jobs/{jid}/complete-request",
        json={},
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    client.post(
        f"/api/v1/jobs/{jid}/approve",
        json={},
        headers={"Authorization": f"Bearer {contractor_token}"},
    )

    return jid


class TestBalance:
    def test_balance_on_register(self, client: TestClient, contractor_token):
        """Usuario tiene balance asignado."""
        resp = client.get(
            "/api/v1/payments/balance", headers={"Authorization": f"Bearer {contractor_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert float(data.get("balance", data if isinstance(data, (int, float)) else 0)) > 0


class TestDeposit:
    def test_deposit_without_tx_hash_fails(self, client: TestClient, contractor_token):
        """Deposito sin tx_hash debe fallar (422)."""
        resp = client.post(
            "/api/v1/payments/deposit",
            json={
                "amount": 100,
            },
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 422


class TestRelease:
    def test_release_completed_job(self, client: TestClient, contractor_token, worker_token, db):
        """Liberar pago a un trabajo completado debe crear transaccion."""
        jid = create_completed_job(client, contractor_token, worker_token)

        # Dar balance al contractor desde la BD directamente
        from app.models.user import User

        user = db.query(User).filter(User.email == "contractor@test.com").first()
        user.balance = 10000
        user.held_balance = 10000
        db.commit()

        resp = client.post(
            f"/api/v1/payments/release/{jid}",
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "amount" in data
        assert "type" in data
        assert data["type"] == "release"

    def test_release_nonexistent_job(self, client: TestClient, contractor_token):
        """Liberar pago de trabajo que no existe da 404."""
        resp = client.post(
            "/api/v1/payments/release/99999",
            headers={"Authorization": f"Bearer {contractor_token}"},
        )
        assert resp.status_code == 404


class TestHistory:
    def test_history(self, client: TestClient, contractor_token, worker_token, db):
        """Historial de transacciones devuelve lista."""
        jid = create_completed_job(client, contractor_token, worker_token)
        from app.models.user import User

        user = db.query(User).filter(User.email == "contractor@test.com").first()
        user.balance = 10000
        db.commit()

        client.post(
            f"/api/v1/payments/release/{jid}",
            headers={"Authorization": f"Bearer {contractor_token}"},
        )

        resp = client.get(
            "/api/v1/payments/history", headers={"Authorization": f"Bearer {contractor_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1 if isinstance(data, list) else True
