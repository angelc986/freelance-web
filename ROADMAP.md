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

### 0.1 Entorno de desarrollo

```bash
# Editor
VS Code + extensiones:
  - Python                    ✅
  - ESLint                    ✅
  - Prettier                  ✅
  - Thunder Client (probar APIs) ✅
  - GitLens                   ✅
  - SQLite Viewer             ❌ No necesaria (usamos PostgreSQL)

# Lenguajes y herramientas
Node.js v20+                  ✅ (v24.18.0)
Python 3.12+                  ✅ (3.11.5)
Git + GitHub                  ✅ (repo: freelance-web)
Docker (opcional pero recomendado) ❌ Pendiente
```

### 0.2 Aprender lo mínimo indispensable — ✅ Backend listo

**Semana 1 — Python avanzado (si ya sabes lo básico):**
- FastAPI: https://fastapi.tiangolo.com/tutorial/          ✅
- Pydantic models (validación de datos)                    ✅
- SQLAlchemy básico (models + queries)                     ✅
- Alembic (migraciones)                                    ❌ Pendiente
- JWT + OAuth2                                             ✅

**Semana 2 — Next.js + TypeScript:**
- https://nextjs.org/learn (oficial, empieza desde aquí)
- Componentes, Server Components, API Routes
- Tailwind CSS (aprende viendo la documentación)
- TypeScript básico (tipado de props, interfaces)

**Semana 3 — Blockchain básico (solo lo necesario):**
- Qué es una wallet (MetaMask)
- Cómo funciona USDT en Polygon
- Diferencias entre redes: Polygon, BEP-20, TRC-20
- ethers.js (leer saldo, enviar transacciones)
- web3.py (backend para verificar transacciones)

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

## Fase 1 — Backend: Auth + Usuarios (2-3 semanas) 👈 SIGUIENTE

### 1.1 Setup del proyecto

```
freelance-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app ✅
│   │   ├── config.py            # Settings + env vars ❌
│   │   ├── database.py          # Conexión PostgreSQL ❌
│   │   ├── models/              # SQLAlchemy models ❌
│   │   ├── schemas/             # Pydantic schemas ❌
│   │   ├── routers/             # API endpoints ❌
│   │   ├── services/            # Lógica de negocio ❌
│   │   ├── utils/               # Helpers ❌
│   │   └── middleware/           # Rate limiting, CORS, etc. ❌
│   ├── alembic/                 # Migraciones ❌
│   ├── tests/                   # Tests ❌
│   ├── requirements.txt         # ❌
│   └── Dockerfile               # ❌
├── frontend/
│   ├── app/                     # Next.js App Router ❌
│   ├── components/              # Componentes reutilizables ❌
│   ├── lib/                     # Clientes API, utils ❌
│   ├── public/                  # Assets estáticos ❌
│   └── ...
├── .github/workflows/           # CI/CD ❌
└── README.md                    # ❌
```

### 1.2 Modelos de datos iniciales

```python
# users/models.py
class User(Base):
    id: UUID (pk)
    email: str (unique, indexed)
    phone: str (unique, indexed)  # WhatsApp
    full_name: str
    role: enum("worker", "contractor", "both")
    cedula: str (unique)
    cedula_verified: bool (default False)
    selfie_url: str (nullable)
    password_hash: str
    wallet_address: str (nullable)  # Wallet USDT
    rating_avg: float (default 0.0)
    total_jobs: int (default 0)
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### 1.3 Endpoints de auth

```
POST   /api/v1/auth/register        # Crear cuenta
POST   /api/v1/auth/login           # Login → JWT tokens
POST   /api/v1/auth/refresh         # Refresh token
POST   /api/v1/auth/verify-cedula   # Subir foto de cédula + selfie
GET    /api/v1/auth/me              # Perfil del usuario autenticado
PATCH  /api/v1/auth/me              # Actualizar perfil
```

**Seguridad en auth:**
- Passwords con bcrypt/argon2
- JWT con access token (15 min) + refresh token (7 días)
- Rate limiting por IP: 5 intentos de login por minuto
- Cédula: se almacena hasheada + se verifica manualmente al inicio
- 2FA opcional con TOTP (Google Authenticator)

---

## Fase 2 — Backend: Jobs + Aplicaciones (2-3 semanas)

### 2.1 Modelos ✅

```python
# models/job.py
class Job(Base):
    id: int
    title: str
    description: str
    category: str
    location: str
    budget: float
    duration: str
    status: enum("open", "in_progress", "completed", "cancelled")
    client_id: int (FK → users)
    worker_id: int (nullable, FK → users)
    created_at: datetime
    updated_at: datetime
```

### 2.2 Endpoints ✅ (básicos)

```
POST   /api/v1/jobs               # Crear trabajo (client_id hardcodeado temporalmente)
GET    /api/v1/jobs               # Listar trabajos (filtro por status)
GET    /api/v1/jobs/{id}          # Detalle del trabajo
```

### Pendiente

- [ ] Proteger rutas con token (client_id del usuario autenticado)
- [ ] POST /api/v1/jobs/{id}/apply (trabajador aplica)
- [ ] GET /api/v1/jobs/{id}/applications (contratista ve aplicantes)
- [ ] POST /api/v1/jobs/{id}/accept (contratista acepta trabajador)
- [ ] POST /api/v1/jobs/{id}/complete (contratista confirma completado)
- [ ] POST /api/v1/jobs/{id}/cancel (cancelar trabajo)
- [ ] POST /api/v1/jobs/{id}/dispute (iniciar disputa)

---

## Fase 3 — Pagos + Escrow (3-4 semanas)

Esta es la parte más crítica y la que da valor real a la app.

### Opción recomendada (Fase 1): Wallet Custodial

**Cómo funciona:**
1. Creas una wallet USDT en Polygon (red principal) + wallet USDT en BEP-20 (alternativa)
2. Contratista deposita USDT en la wallet central desde Binance (elige Polygon o BEP-20)
3. Tu backend detecta la red y registra: "depósito de $15 del contratista X para el trabajo Y"
4. Cuando el trabajo se completa, tu backend autoriza la transferencia al trabajador en la misma red
5. Automatizas con web3.py

**Por qué Polygon como red principal:**
- Comisiones más bajas que TRC-20 (~$0.01 vs ~$1+)
- Binance soporta retiro USDT a Polygon sin problemas
- BEP-20 como respaldo por si alguien prefiere BNB Chain

**Por qué wallet custodial primero:**
- No necesitas smart contract (menos superficie de ataque)
- Puedes reversar pagos en caso de disputa
- Más fácil de implementar
- Migras a smart contract después cuando tengas volumen

### Endpoints de pagos

```
POST   /api/v1/payments/deposit       # Contratista deposita USDT (Polygon o BEP-20)
GET    /api/v1/payments/balance       # Saldo del usuario
POST   /api/v1/payments/release       # Liberar pago al trabajador
POST   /api/v1/payments/refund        # Reembolsar al contratista
POST   /api/v1/payments/withdraw      # Trabajador retira a su wallet externa
GET    /api/v1/payments/history       # Historial de transacciones
```

### Seguridad en pagos

```
- Wallets centrales (Polygon + BEP-20) en variables de entorno, NUNCA en código
- Cada transacción se firma desde el backend con la private key
- Log de todas las transacciones en BD + en blockchain (hash de tx)
- Rate limiting estricto: máx 3 retiros por día por usuario
- Whitelist de wallets permitidas para retiros
- Doble confirmación para montos > $100
- Las private keys se rotan cada 90 días
```

### Migración futura a Smart Contract

```solidity
// contracts/Escrow.sol (para después)
contract FreelanceEscrow {
    struct Escrow {
        address contractor;
        address worker;
        uint256 amount;
        bool completed;
        bool disputed;
    }
    
    mapping(uint256 => Escrow) public escrows;
    
    function deposit(uint256 jobId) external payable;
    function confirmComplete(uint256 jobId) external;
    function release(uint256 jobId) external;
    function dispute(uint256 jobId) external;
    function resolveDispute(uint256 jobId, address winner) external; // solo admin
}
```

---

## Fase 4 — Frontend (4-6 semanas)

### 4.1 Setup

```bash
npx create-next-app@latest frontend --typescript --tailwind --app
```

### 4.2 Páginas

```
/                   → Landing page profesional
/auth/register      → Registro (email, phone, cédula, selfie)
/auth/login         → Login
/jobs               → Lista de trabajos disponibles
/jobs/new           → Publicar trabajo (solo contratistas)
/jobs/[id]          → Detalle + aplicar
/dashboard          → Perfil del usuario
/dashboard/jobs     → Mis trabajos publicados (contratista)
/dashboard/applications → Mis aplicaciones (trabajador)
/dashboard/wallet   → Saldo, depósitos, retiros
/dashboard/history  → Historial de transacciones
/dashboard/settings → Configuración, 2FA, etc.
/disputes/[id]      → Detalle de disputa
/admin/*            → Panel admin (solo tú)
```

### 4.3 Componentes críticos

```
WalletConnect.tsx    → Botón "Connect Wallet" (MetaMask, WalletConnect)
JobCard.tsx          → Card de trabajo en lista
JobForm.tsx          → Formulario de publicación
PaymentModal.tsx     → Modal para depositar/confirmar pago
RatingStars.tsx      → Componente de rating
VerificationBadge.tsx → Badge de verificado
ChatButton.tsx       → Botón de contacto por WhatsApp
```

### 4.4 Diseño

- **Colores:** Azul marino profundo (#0f172a) + blanco + verde éxito (#10b981)
- **Tono:** Profesional, serio, que inspire confianza
- **Tipografía:** Inter (Google Fonts) — moderna y legible
- **Logo:** Un escudo con un rayo (seguridad + velocidad)
- **Estilo:** Minimalista, espaciado generoso, bordes redondeados

---

## Fase 5 — Seguridad (integrada desde el día 1)

### Checklist de seguridad obligatorio

```
☐ HTTPS obligatorio (Vercel + Railway lo dan gratis)
☐ CORS configurado solo para tu dominio
☐ Rate limiting en todos los endpoints (slowapi para FastAPI)
☐ Validación de todos los inputs con Pydantic
☐ SQL injection prevenido (SQLAlchemy lo maneja)
☐ XSS prevenido (Next.js lo maneja por defecto)
☐ JWT con expiración corta (15 min access, 7 días refresh)
☐ Refresh tokens almacenados en BD con hash
☐ Password con bcrypt (12 rounds mínimo)
☐ 2FA opcional (TOTP)
☐ Logs de todas las acciones sensibles (login, pagos, cambios de rol)
☐ No almacenar private keys en el código (variables de entorno)
☐ No almacenar datos sensibles sin hash (cédula, wallet addresses)
☐ Backup automático de BD cada 24h
☐ Detectar red automáticamente en depósitos (Polygon vs BEP-20)
☐ Monitoreo de errores con Sentry
☐ Pruebas de seguridad antes del lanzamiento
```

### Pruebas de seguridad recomendadas

1. **OWASP Top 10** — revisar cada punto contra tu app
2. **Pentest manual** — pregúntame cuando estés listo y reviso tu código
3. **Rate limiting testing** — asegurar que no se puede bruteforcear
4. **Wallet security** — la private key de la wallet central NUNCA toca el frontend

---

## Fase 6 — Testing (integrado desde el día 1)

### Backend (Pytest)

```python
# tests/test_auth.py
def test_register_success(client):
    response = client.post("/api/v1/auth/register", json={...})
    assert response.status_code == 201

def test_register_duplicate_email(client):
    # Crear usuario, luego intentar crear otro con mismo email
    assert response.status_code == 409

def test_login_wrong_password(client):
    assert response.status_code == 401

# tests/test_jobs.py
def test_create_job_unauthorized(client):
    assert response.status_code == 401

def test_create_job_as_worker(client):
    # Un trabajador no debería poder publicar trabajos
    assert response.status_code == 403
```

### Frontend (Playwright)

```typescript
// tests/register.spec.ts
test('user can register', async ({ page }) => {
  await page.goto('/auth/register');
  await page.fill('[name="email"]', 'test@test.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=app tests/
      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm run test
      - name: Check types
        run: |
          cd frontend
          npm run type-check
```

---

## Fase 7 — Despliegue (1 semana)

### Frontend → Vercel

```bash
# Conectar repositorio de GitHub a Vercel
# Configurar variables de entorno
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_POLYGON_RPC=https://polygon-rpc.com
# Si soportas BEP-20:
# NEXT_PUBLIC_BSC_RPC=https://bsc-dataseed.binance.org
```

### Backend → Railway o Render

```yaml
# railway.json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  }
}
```

### Base de datos → Supabase o Neon.tech

Ambos dan tier gratis de PostgreSQL con:
- 500MB-1GB de almacenamiento
- SSL/TLS
- Backup automático
- Panel web para gestionar

### Dominio

```
Comprar:    Namecheap o GoDaddy (~$10/año)
DNS:       apuntar a Vercel (frontend) + Railway (backend)
SSL:       Automático con Vercel + Railway
```

---

## Timeline Total

```
Fase 0: Fundación + aprendizaje     Semana 1-2 ✅ (9 jul 2026)
Fase 1: Backend auth + usuarios     Semana 3-5 👈 EN PROGRESO
Fase 2: Backend jobs + apps         Semana 6-8
Fase 3: Pagos + escrow              Semana 9-12
Fase 4: Frontend completo           Semana 13-18
Fase 5: Seguridad (integrada)       Semana 1-18
Fase 6: Testing + CI/CD             Semana 12-18
Fase 7: Despliegue                  Semana 19
──────────────────────────────────────────────
Total: ~4-5 meses (si le dedicas 2-3h diarias)
```

---

## Orden de aprendizaje recomendado

Para que cuando llegues a cada fase ya sepas lo necesario:

| Cuando estés en | Aprende esto primero |
|----------------|---------------------|
| Fase 0 | Python + FastAPI tutorial oficial |
| Fase 1 | SQLAlchemy, Alembic, JWT, Pydantic |
| Fase 2 | SQL queries, filtros, paginación |
| Fase 3 | Web3.py, ethers.js, Polygon + BEP-20 docs |
| Fase 4 | Next.js App Router, Tailwind, TypeScript |
| Fase 5 | OWASP Top 10, seguridad en APIs |
| Fase 6 | Pytest, Playwright, GitHub Actions |
| Fase 7 | Docker, Vercel, Railway, DNS |

---

## Cómo empezar HOY

1. ✅ Instala Node.js v20+ y Python 3.12+
2. ✅ Crea un repositorio en GitHub: `freelance-web`
3. ✅ Inicializa el backend: `mkdir backend && cd backend && python -m venv venv`
4. ✅ Instala FastAPI: `pip install fastapi uvicorn`
5. ✅ Crea tu primer endpoint: `GET /api/v1/health` → `{"status": "ok"}`
6. ✅ Avísame cuando tengas el endpoint funcionando y empezamos con auth

---

## Historial del proyecto

| Fecha | Avance |
|-------|--------|
| 9 jul 2026 | FUNDACIÓN + FASE 1 COMPLETA ✅ + FASE 2 INICIADA. Entorno listo (Node.js v24, Python 3.11, Git, VS Code). Backend estructurado. SQLAlchemy + SQLite. Modelo User completo. Registro, Login, GET /me, POST /refresh con JWT. Modelo Job creado (title, description, category, location, budget, duration, status, client/worker FK). Endpoints: POST /jobs (crear), GET /jobs (listar), GET /jobs/{id} (detalle). Pendiente: proteger rutas con token, aplicar a trabajo, aceptar trabajador. |

---

## Notas finales

- **No construyas todo de una vez.** Cada fase debe ser funcional antes de pasar a la siguiente.
- **No te obsesiones con la perfección.** Una app que funciona al 80% es mejor que una perfecta que nunca se lanza.
- **Pregúntame en cada fase.** Cuando llegues a pagos, cuando tengas bugs, cuando no sepas qué hacer. Para eso estoy.
- **Este roadmap es flexible.** Si una fase te toma más tiempo, está bien. Si quieres saltarte algo, me dices.

---

*Documento creado el 8 de julio de 2026. Actualizado: USDT/Polygon como red principal, BEP-20 como alternativa opcional. Versión 1.1.*
