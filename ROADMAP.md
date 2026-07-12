# Freelance App 🇻🇪 — Roadmap Profesional
> Proyecto activo de Ángel. Prioridad máxima.
> Aprendiendo Python, FastAPI, Next.js, blockchain en el proceso.
> Inicio: 9 julio 2026

## App de trabajos por día con pago en USDT (Polygon) y escrow

---

## Stack Tecnológico Definitivo

```
Frontend:     Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:      Python + FastAPI + SQLAlchemy + Pydantic
Base Datos:   PostgreSQL (Supabase o Neon.tech — ambos tienen tier gratis)
ORM:          SQLAlchemy 2.0 + Alembic (migraciones)
Auth:         JWT con refresh tokens + 2FA opcional
Cache:        Redis (sesiones, rate limiting)
Pagos:        USDT en Polygon (red principal) + opcional BEP-20 — ethers.js + web3.py
Wallet:       WalletConnect (no custodial) O Binance Pay API
PWA:          next-pwa (funciona como app en el celular sin Play Store)
Hosting:      Vercel (frontend) + Railway/Render (backend)
Dominio:      custom domain (+ SSL automático)
Monitoreo:    Sentry (errores) + Logfire o similar
Testing:      Pytest (backend) + Playwright/Cypress (frontend)
CI/CD:        GitHub Actions (tests automáticos antes de deploy)
```

---

## Fase 0 — Fundación ✅ COMPLETADA

### 0.1 Entorno de desarrollo ✅

### 0.2 Aprender lo mínimo indispensable ✅

---

## Arquitectura del Sistema

```
┌──────────────────────────────────────────┐
│              Frontend (Next.js)           │
│  PWA ─ Browser → Mobile Home Screen      │
│                                           │
│  Pages:                                   │
│  / → Landing + register                   │
│  /jobs → listar trabajos                  │
│  /jobs/new → publicar trabajo             │
│  /jobs/[id] → detalle + aplicar           │
│  /dashboard → perfil, wallet, historial   │
│  /disputes → sistema de disputas          │
└──────────────────┬───────────────────────┘
                   │ HTTP + WebSocket
┌──────────────────▼───────────────────────┐
│           Backend (FastAPI + Python)       │
│                                            │
│  Módulos:                                  │
│  auth/ → registro, login, 2FA, JWT        │
│  users/ → perfiles, verificación ID       │
│  jobs/ → CRUD trabajos, aplicar, aceptar  │
│  payments/ → escrow, wallet, transacciones│
│  disputes/ → sistema de disputas          │
│  notifications/ → emails, notifs in-app   │
│  admin/ → panel de administración         │
└──────────────────┬───────────────────────┘
                   │ SQL + Redis
┌──────────────────▼───────────────────────┐
│     PostgreSQL + Redis                    │
│                                            │
│  Tablas principales:                       │
│  users, workers, contractors              │
│  jobs, applications                       │
│  transactions, escrows                    │
│  disputes, reviews                        │
└──────────────────────────────────────────┘

Blockchain Layer (Polygon + opcional BEP-20):
  - Smart contract de escrow (o wallet custodial)
  - Verificación de transacciones USDT on-chain
  - Soportar ambas redes desde el inicio en la wallet central
```

---

## Fase 1 — Backend: Auth + Usuarios ✅ COMPLETADA

### 1.1 Setup del proyecto ✅

```
freelance-app/
├── backend/
│   ├── app/
│   │   ├── main.py              ✅
│   │   ├── config.py            ❌ Pendiente
│   │   ├── database.py          ✅
│   │   ├── models/              ✅
│   │   ├── schemas/             ✅
│   │   ├── routers/             ✅
│   │   ├── services/            ✅
│   │   └── middleware/          ❌ Pendiente
│   ├── alembic/                 ❌ Pendiente
│   ├── tests/                   ❌ Pendiente
│   ├── requirements.txt         ❌ Pendiente
│   └── Dockerfile               ❌ Pendiente
├── frontend/                    ❌ Pendiente
├── .github/workflows/           ❌ Pendiente
└── README.md                    ❌ Pendiente
```

### 1.2-1.3 Auth completo ✅

Registro, Login, JWT (access 15min + refresh 7d), GET /me, POST /refresh, endpoint /token para Swagger. bcrypt para passwords.

---

## Fase 2 — Backend: Jobs + Aplicaciones ✅ COMPLETADA (10 jul 2026)

### 2.1 Modelos ✅

- **Job** — title, description, category, location, budget, duration, status (`open` → `in_progress` → `checked_in` → `review_pending` → `completed`/`disputed`), client_id, worker_id, dispute_reason
- **Application** — job_id, worker_id, message, status (`pending` → `accepted`/`rejected`)

### 2.2 Endpoints ✅ (11 endpoints de jobs)

```
POST   /jobs                         # Crear trabajo (solo contractors)
GET    /jobs                         # Listar (filtro por status)
GET    /jobs/{id}                    # Detalle
POST   /jobs/{id}/apply              # Worker aplica
GET    /jobs/{id}/applications       # Contractor ve aplicantes
POST   /jobs/{id}/accept/{app_id}    # Contractor acepta worker
POST   /jobs/{id}/check-in           # Worker llega (bloquea cancel)
POST   /jobs/{id}/complete-request   # Worker pide completar
POST   /jobs/{id}/approve            # Contractor aprueba
POST   /jobs/{id}/dispute            # Contractor disputa (con razón)
POST   /jobs/{id}/cancel             # Contractor cancela
```

### Flujo de estados

```
open → in_progress → checked_in → review_pending → completed ✅
                               ↓                  → disputed ❌
open → cancelled ❌
in_progress → cancelled ❌ (no si checked_in)
```

### Validaciones

- Solo contractors crean jobs
- No auto-apply ni duplicados
- Contractor no puede cancelar después de check-in
- Al aceptar worker, demás apps rechazadas automáticamente
- Disputa guarda razón en BD (`dispute_reason`)

---

## Fase 3 — Pagos + Escrow (3-4 semanas) 🚧 INICIADA (10 jul 2026)

### Stack
- web3.py 7.16.0 → conexión a Polygon
- Wallet custodial: `0x31EF80...C7c0` (Amoy Testnet)
- Config en `.env` (python-dotenv + pydantic-settings)
- USDT ERC-20 en Polygon

### Archivos nuevos
- `models/transaction.py` — Transaction (tx_hash, network, confirmations, status)
- `services/blockchain.py` — verify_transaction(), send_usdt(), is_connected()
- `routers/payments.py` — 6 endpoints de pagos
- `schemas/payment.py` — DepositRequest, TransactionResponse, etc.
- `.env` — Wallet + RPC + config

### Endpoints (6)
| Endpoint | Método | Función |
|----------|--------|--------|
| `/payments/health` | GET | Verificar conexión a Polygon |
| `/payments/deposit` | POST | Contractor deposita (verificado on-chain) |
| `/payments/balance` | GET | Saldo del usuario |
| `/payments/release/{job_id}` | POST | Liberar pago al worker |
| `/payments/refund/{job_id}` | POST | Reembolso (solo admin) |
| `/payments/withdraw` | POST | Retirar a wallet externa |
| `/payments/history` | GET | Historial de transacciones |

### Seguridad implementada
- Private key solo en `.env`
- Verificación on-chain (mín 12 confirmaciones)
- Máx 3 retiros/día, mínimo $1
- Solo contractors depositan
- Solo admin reembolsa

### Pendiente próxima sesión
- [ ] Timeout 48h
- [ ] Whitelist wallets
- [ ] Envío real USDT (send_usdt)
- [ ] Webhook detección automática

---

## Fase 4 — Frontend (4-6 semanas)

Next.js + Tailwind + TypeScript

---

## Fase 5-7 — Seguridad, Testing, Despliegue

---

## Timeline Total

```
Fase 0: Fundación + aprendizaje     Semana 1-2 ✅ (9 jul 2026)
Fase 1: Backend auth + usuarios     Semana 3-5 ✅ (9 jul 2026)
Fase 2: Backend jobs + apps         Semana 6-8 ✅ (10 jul 2026)
Fase 3: Pagos + escrow              Semana 9-12 👈 EN PROGRESO
Fase 4: Frontend completo           Semana 13-18
Fase 5: Seguridad (integrada)       Semana 1-18
Fase 6: Testing + CI/CD             Semana 12-18
Fase 7: Despliegue                  Semana 19
──────────────────────────────────────────────
Total: ~4-5 meses (si le dedicas 2-3h diarias)
```

---

## Historial del proyecto

| Fecha | Avance |
|-------|--------|
| 9 jul 2026 | FUNDACIÓN + FASE 1 COMPLETA ✅. Auth completo. Modelo Job + CRUD básico. |
| 10 jul 2026 | ✅ SISTEMA APPLY/ACCEPT + FASE 2 COMPLETA. Application model. Apply, accept, check-in, complete-request, approve, dispute, cancel. 17 endpoints total. |
| 10 jul 2026 | 🚧 FASE 3 INICIADA. web3.py, wallet sistema, Transaction model, blockchain service, 6 payments endpoints. 24 endpoints total. |

---

*Versión 1.2 — Actualizado 10 jul 2026*
