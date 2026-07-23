# 🦞 TurnoGO — Freelance App 🇻🇪

[![CI](https://github.com/angelc986/freelance-web/actions/workflows/ci.yml/badge.svg)](https://github.com/angelc986/freelance-web/actions/workflows/ci.yml)
[![Deploy](https://github.com/angelc986/freelance-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/angelc986/freelance-web/actions/workflows/deploy.yml)

Plataforma de trabajos por día con pago en USDT (Polygon) — Construida para Venezuela.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2.0 |
| Base de Datos | PostgreSQL (Supabase) |
| Blockchain | Polygon Amoy Testnet (USDT ERC-20) |
| Hosting | Vercel (frontend) + Railway (backend) |
| Monitoreo | Sentry |

## Estructura

```
freelance-web/
├── backend/           # FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── models/    # SQLAlchemy models (10 tablas)
│   │   ├── routers/   # API endpoints (9 módulos)
│   │   ├── schemas/   # Pydantic v2 schemas
│   │   └── services/  # Lógica de negocio + blockchain
│   ├── tests/         # 137 tests (5 suites)
│   └── alembic/       # Migraciones
├── frontend/          # Next.js 16 App Router
│   └── src/
│       ├── app/       # Páginas y layouts
│       └── components/# Componentes reutilizables
└── .github/workflows/ # CI/CD (Tests + Lint + Deploy)
```

## CI/CD Pipeline

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| **CI** | PR → main, push a develop | Backend: pytest + coverage. Lint: ESLint + TypeScript + Ruff + Mypy |
| **Deploy** | CI pasa en main | Gate → Deploy Railway + Vercel |

El workflow de CI debe pasar ✅ para que el deploy se ejecute.

## Desarrollo Local

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

### Tests

```bash
cd backend
pytest tests/ -v
```

## Enlaces

- **Frontend:** [freelance-web-beta.vercel.app](https://freelance-web-beta.vercel.app)
- **API Docs:** [freelance-web-beta.vercel.app/api/docs](https://freelance-web-beta.vercel.app/api/docs)
- **Roadmap:** [ROADMAP.md](./ROADMAP.md)

---

*Proyecto activo. Mantenido por [@angelc986](https://github.com/angelc986).*
