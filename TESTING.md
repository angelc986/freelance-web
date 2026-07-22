# 🧪 Testing Guide — TurnoGO Backend

## Quick Start

```bash
cd backend
.\venv\Scripts\python.exe -m pytest
```

## Run by Suite

```bash
# Solo una suite
pytest tests/security    # 60 tests — contraseñas, JWT, headers, email, webhooks
pytest tests/admin       # 17 tests — panel admin, usuarios, disputas, wallet
pytest tests/auth        # 11 tests — registro, login, tokens, profile
pytest tests/payments    # 19 tests — balance, historial, retiros, releases
pytest tests/jobs        # 30 tests — CRUD, ciclo de vida, approve, cancel
```

## Run a Single Test

```bash
pytest tests/jobs/test_lifecycle.py::TestApproveWorkflow::test_approve_accepted_worker
pytest tests/auth/test_profile.py::TestLoginTokens::test_login_returns_tokens
```

## Run with Verbose Output

```bash
pytest tests/jobs -v
pytest tests/auth/test_profile.py -v --tb=long
```

## Coverage

```bash
# Full coverage report
pytest --cov=app --cov-report=term

# Single module coverage
pytest tests/jobs --cov=app.routers.jobs --cov-report=term

# HTML report (opens in browser)
pytest --cov=app --cov-report=html
start htmlcov/index.html
```

## Test Database

- **SQLite file**: `test_freelance.db` (auto-created, auto-cleaned)
- Cada test recibe una BD completamente limpia (`drop_all` + `create_all`)
- Se borra automáticamente entre ejecuciones de suites

## Fixtures Disponibles

| Fixture | Descripción |
|---------|-------------|
| `client` | HTTP TestClient (session-scoped) |
| `db` | Sesión SQLAlchemy compartida |
| `contractor_token` | JWT de usuario contractor |
| `worker_token` | JWT de usuario worker |
| `admin_token` | JWT de usuario admin |
| `verified_user_token` | JWT de usuario con email verificado |
| `unverified_user_token` | JWT de usuario sin verificar email |

## Convenciones

- **Nombres**: `test_<accion>_<resultado_esperado>` (ej: `test_contractor_blocked_from_stats`)
- **Clases**: Agrupan por endpoint/funcionalidad (ej: `TestAdminAccessControl`)
- **Arreglos**: `test_<bug>_regression` o en el mismo test con comentario
- **Fix de bug**: mínimo 1 test de regresión que fallaba ANTES del fix

## CI/CD (próximamente)

```bash
pytest --cov=app --cov-report=term --cov-fail-under=65
```
