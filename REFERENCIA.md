# Freelance App 🇻🇪 — Referencia Rápida

> Stack: FastAPI + SQLite (dev) + JWT Auth + Polygon (USDT)
> Ubicación: C:\Users\yochi\Desktop\freelance-web\
> Frontend: Next.js 16.2.10 + Tailwind CSS + TypeScript
> Estado: Fase 4 — Frontend 🚧 (11 jul 2026)
> Vault Obsidian: C:\Users\yochi\Desktop\Freelance-App-Vault

## Cómo correr

### Backend
`ash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
`

### Frontend
`ash
cd frontend
npm run dev
`

## Endpoints (31 total)

### Auth (5)
| Endpoint | Descripción |
|---|---|
| POST /api/v1/auth/register | Crear cuenta (email, phone, cedula, role) |
| POST /api/v1/auth/login | Login → JWT (access 15min + refresh 7d) |
| POST /api/v1/auth/token | Login para Swagger |
| GET /api/v1/auth/me | Perfil del usuario autenticado |
| POST /api/v1/auth/refresh | Refrescar tokens |

### Users (3)
| Endpoint | Descripción |
|---|---|
| PATCH /api/v1/auth/me | Actualizar perfil (nombre, teléfono) |
| PATCH /api/v1/auth/me/wallet | Actualizar wallet address |
| GET /api/v1/auth/my-applications | Postulaciones del worker |

### Jobs (12)
| Endpoint | Quién | Cambia status |
|---|---|---|
| POST /api/v1/jobs/ | Contractor | Crea open |
| GET /api/v1/jobs | Cualquiera | - |
| GET /api/v1/jobs/mine | Contractor/Worker | - |
| GET /api/v1/jobs/{id} | Cualquiera | - |
| POST /api/v1/jobs/{id}/apply | Worker | Crea Application |
| GET /api/v1/jobs/{id}/applications | Contractor dueño | - |
| POST /api/v1/jobs/{id}/accept/{app_id} | Contractor dueño | → in_progress |
| POST /api/v1/jobs/{id}/check-in | Worker asignado | → checked_in |
| POST /api/v1/jobs/{id}/complete-request | Worker asignado | → 
eview_pending |
| POST /api/v1/jobs/{id}/approve | Contractor dueño | → completed |
| POST /api/v1/jobs/{id}/dispute | Contractor dueño | → disputed |
| POST /api/v1/jobs/{id}/cancel | Contractor dueño | → cancelled |
| POST /api/v1/jobs/process-timeouts | Sistema | Timeout 48h |

### Ratings (2)
| Endpoint | Descripción |
|---|---|
| POST /api/v1/ratings/{job_id} | Calificar trabajo completado |
| GET /api/v1/ratings/mine | Mis calificaciones recibidas |

### Payments (10)
| Endpoint | Quién | Qué hace |
|---|---|---|
| GET /api/v1/payments/health | Cualquiera | Verifica conexión a Polygon |
| POST /api/v1/payments/deposit | Contractor | Verifica tx on-chain → acredita |
| GET /api/v1/payments/balance | Cualquiera | Saldo del usuario |
| POST /api/v1/payments/release/{job_id} | Contractor | Libera pago al worker |
| POST /api/v1/payments/refund/{job_id} | Admin | Reembolso |
| POST /api/v1/payments/withdraw | Worker | Retira a wallet externa |
| GET /api/v1/payments/history | Cualquiera | Historial transacciones |
| POST /api/v1/payments/confirm/{tx_id} | Cualquiera | Confirma >  (token) |
| POST /api/v1/payments/scan-deposits | Admin | Escanea blockchain |
| POST /api/v1/payments/webhook/deposit | Sistema | Webhook depósitos externos |

## Mapa de estados

`
open → in_progress → checked_in → review_pending → completed ✅
                               ↘                  → disputed ❌
open → cancelled ❌
in_progress → cancelled ❌ (no si checked_in)
`

## Frontend — Rutas (9)

| Ruta | Descripción |
|---|---|
| / | Landing page TurnoGO |
| /auth/login | Iniciar sesión |
| /auth/register | Registrarse |
| /dashboard | Panel principal (stats + acciones + actividad) |
| /dashboard/jobs | Mis trabajos (Activos/Completados/Cancelados) |
| /dashboard/wallet | Wallet (balance, retirar, historial) |
| /dashboard/settings | Perfil (editar info, wallet, cerrar sesión) |
| /dashboard/ratings | Calificaciones + comentarios recibidos |
| /jobs | Buscar trabajos (filtro por categoría) |
| /jobs/new | Publicar trabajo (solo contratista) |
| /jobs/[id] | Detalle + aplicar + acciones |

## Archivos del proyecto

| Archivo | Ruta |
|---|---|
| Roadmap | reelance-app-roadmap.md |
| Referencia | REFERENCIA.md (este) |
| Código backend | ackend/app/ |
| Código frontend | rontend/ |
| Vault Obsidian | ..\Freelance-App-Vault\ |
