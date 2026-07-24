# 🦞 TurnoGO — Roadmap Integral v2.0
> Consolidación de 4 análisis: OpenClaw + GPT + Devin (Cascade) + Gemini
> Proyecto activo de Ángel — Prioridad máxima
> Inicio: 9 julio 2026 | Última actualización: 23 julio 2026

---

## Stack Tecnológico Definitivo

```
Frontend:       Next.js 16.2.10 (App Router) + TypeScript + Tailwind CSS v4
Backend:        Python 3.11 + FastAPI 0.139.0 + SQLAlchemy 2.0 + Pydantic v2
Base Datos:     PostgreSQL (Supabase) — en producción | SQLite — en desarrollo
ORM Migraciones: Alembic 1.18.5 ✅ CONFIGURADO (Railway + Supabase)
Auth:           JWT (python-jose) + bcrypt (passlib) + refresh token rotation
Cache:          Redis ❌ NO IMPLEMENTADO
Colas:          Celery / RQ ❌ NO IMPLEMENTADO
Blockchain:     web3.py 7.16.0 + Polygon Amoy Testnet (USDT ERC-20)
KYC:            Didit (business.didit.me) — integrado, sin API Key ❌
Avatares:       Cloudinary 1.41.0 — integrado, sin credenciales ❌
Monitoreo:      Sentry 2.64.0 ✅ CONFIGURADO
PWA:            Service Worker + manifest.json ✅
Hosting:        Vercel (frontend) + Railway Docker (backend) ✅
Testing:        pytest 9.1.1 — 137 tests ✅ (5 suites, cobertura ~65%)
CI/CD:          GitHub Actions — FASE 9.3 ✅ COMPLETADA (23 Jul 2026)
```

---

## ✅ Fases Completadas (0-7)

### Fase 0 — Fundación
- Entorno de desarrollo configurado
- Stack elegido: FastAPI + Next.js + PostgreSQL + Polygon
- Aprendizaje de conceptos básicos

### Fase 1 — Backend: Auth + Usuarios ✅
- Modelo User (email, phone, cedula, password_hash, role, balance, wallet_address, is_verified)
- Registro con validación de campos únicos y bcrypt
- Login con JWT access token (15min) + refresh token rotation (7 días)
- Endpoints: register, login, /me, refresh, PATCH /me, PATCH /me/wallet, /token
- Audit logging
- Rate limiting por endpoint

### Fase 2 — Backend: Jobs + Aplicaciones ✅
- Modelos Job, Application con flujo completo de estados
- 11 endpoints: CRUD jobs, apply, accept, check-in, complete-request, approve, dispute, cancel
- Auto-timeout 48h si contractor no responde
- Validaciones: solo contractors crean, no auto-apply, no duplicados

### Fase 3 — Pagos + Escrow ✅
- Modelo Transaction (deposit, release, refund, withdraw)
- Conexión a Polygon Amoy Testnet via web3.py
- Verificación on-chain de transacciones (mín 12 confirmaciones)
- Sistema de depósito manual + escaneo automático
- Doble confirmación para montos >$100
- Límite de 3 retiros/día, mínimo $1
- Solo admin puede reembolsar
- Wallet del sistema: `0x31EF80...C7c0`

### Fase 4 — Frontend Completo ✅
- Landing page completa (hero, partículas, stats animadas, categorías, testimonios, FAQ, wave separators)
- Auth flow con toggle worker/contractor (mesh gradient)
- Job listing con filtros por categoría y skeleton loading
- Job detail + aplicar
- Dashboard: stats, jobs, wallet, ratings, settings, candidates
- Admin panel: 7 tabs (overview, users, jobs, transactions, disputes, wallet, analytics)
- PWA: service worker, offline page, manifest
- EmptyState, ErrorBoundary, PullToRefresh
- NotificationBell con SSE
- SEO: OpenGraph, Twitter cards, robots

### Fase 5 — Seguridad (integrada en fases 1-4)
- Rate limiting por endpoint (slowapi)
- CORS configurable
- Passwords con bcrypt
- Refresh token rotation

### Fase 6 — Testing ✅
- pytest 9.1.1 configurado con 137 tests en 5 suites
- Estructura: tests/security (60), tests/admin (17), tests/auth (11), tests/payments (19), tests/jobs (30)
- Aislamiento estable: drop_all + create_all por test, sesión `db` compartida
- .coveragerc con exclusiones de servicios externos
- TESTING.md con guía completa de ejecución

### Fase 7 — Despliegue ✅
- Frontend en Vercel (freelance-web-beta.vercel.app)
- Backend en Railway (Docker)
- Supabase PostgreSQL conectado
- Sentry monitoreo activo

---

## 🚧 Nuevas Fases

---

## FASE 8 — SEGURIDAD CRÍTICA ✅ COMPLETADA (19-22 Jul 2026)

### 8.1 Secretos y Configuración
- [x] **SECRET_KEY**: Generar clave criptográficamente segura (`openssl rand -hex 64`)
- [x] **Validar en startup**: Si `SECRET_KEY` es el default, que el servidor NO arranque (`raise RuntimeError`)
- [x] **SECRET_KEY**: Mover a Railway variable de entorno, eliminar del `.env` local
- [x] **SYSTEM_WALLET_PRIVATE_KEY**: Mover a Railway secrets (nunca en el repo)
- [x] **Cloudinary credenciales**: Agregar a Railway env vars (ya están en el backend)
- [x] **DIDIT_API_KEY**: Obtener de business.didit.me, agregar a Railway
- [x] **Validar en startup**: Si faltan credenciales críticas, log claro diciendo qué falta

### 8.2 Dev-Token Bypass
- [x] **Eliminar dev-token** del service `auth.py` en producción
- [x] **Crear flag `ENVIRONMENT`**: Si es "development", permitir mock; si es "production", rechazar
- [x] **Validar** que ningún endpoint acepte "dev-" tokens en producción

### 8.3 Webhook de Depósitos
- [x] **Agregar autenticación** al webhook `POST /payments/webhook/deposit`
- [x] Implementar HMAC signature verification (como el webhook de Didit)
- [x] Agregar **nonce + timestamp** para prevenir replay attacks
- [x] Rate limiting estricto (2/minuto)
- [x] Whitelist de IPs de Alchemy/QuickNode

### 8.4 CORS Estricto
- [x] **Forzar** `FRONTEND_URL` en producción (no permitir `*`)
- [x] Si `FRONTEND_URL` no está seteado, mostrar warning en startup
- [x] Agregar validación de origen en middleware

### 8.5 Contraseñas
- [x] Validación de complejidad: mínimo 8 caracteres, mayúscula, minúscula, número, especial
- [x] Integrar HaveIBeenPwned API (o al menos check contra lista de passwords comunes)
- [x] Agregar rate limiting específico por IP para login (5 intentos/minuto)

### 8.6 Verificación de Email
- [x] Enviar email de confirmación post-registro
- [x] Token de verificación con expiración (24h)
- [x] No permitir publicar trabajos ni retirar fondos hasta email verificado
- [x] Endpoint: `POST /auth/verify-email` + `POST /auth/resend-verification`

### 8.7 Base de Datos
- [x] **NUNCA hacer commit** de `freelance.db` o `*.db` al repositorio
- [x] Agregar `*.db` y `*.db.bak` al `.gitignore`

---

## FASE 9 — INFRAESTRUCTURA Y ESTABILIDAD 🟡 (1-2 semanas)

### 9.1 Migraciones con Alembic ✅
- [x] Inicializar Alembic en el backend
- [x] Crear migración inicial con todos los modelos existentes
- [x] Configurar `alembic.ini` para Railway + Supabase
- [x] Verificar que `Base.metadata.create_all()` se elimine en producción
- [x] Documentar flujo: `alembic revision --autogenerate` + `alembic upgrade head`
- [x] Railway Start Command: `alembic upgrade head && uvicorn ...`

### 9.2 Tests Automatizados ✅
- [x] Configurar estructura de tests (`backend/tests/`)
- [x] Tests de autenticación: registro, login, refresh, token inválido (11 tests)
- [x] Tests de jobs: CRUD, aplicar, aceptar, flujo completo (30 tests)
- [x] Tests de pagos: depositar, liberar, retirar, saldo insuficiente (19 tests)
- [x] Tests de admin: stats, usuarios, resolver disputas (17 tests)
- [x] Tests de seguridad: dev-token rechazado, webhook sin auth, SQL injection (60 tests)
- [x] Coverage: 57% total, ~65% core (con exclusiones de servicios externos)
- [x] Aislamiento estable con drop_all + create_all por test
- [x] TESTING.md con guía completa

### 9.3 CI/CD con GitHub Actions ✅
- [x] Workflow: `ci.yml` — 3 jobs (backend tests 163/163, ruff+mypy, ESLint+TypeScript)
- [x] Workflow: `deploy.yml` — gated via `workflow_run`, solo corre tras CI verde
- [x] Badge de status en README
- [x] Arquitectura final de deploy (sin duplicación):
  - Vercel: auto-deploy on push (Git conectado → freelance-web-beta.vercel.app)
  - Railway: auto-deploy con "Wait for CI" (nativo de Railway)
  - Sin `ignoreCommand`, sin Deploy Hooks, sin race conditions
- [x] 15+ runs exitosos en GitHub Actions

### 9.4 Observabilidad Profesional ✅
- [x] **Logging estructurado**: 24 `print()` eliminados → structlog JSON (9 archivos)
- [x] **Request ID tracing**: `X-Request-ID` header, UUID por request, correlación en logs y Sentry
- [x] **Health checks**: `/live` (200, sin DB), `/ready` (200/503 con DB check), `/api/v1/health` (compatibilidad)
- [x] **Métricas Prometheus**: `/metrics` endpoint, 5 métricas (`turnogo_http_requests_total`, `turnogo_http_request_duration_seconds`, `turnogo_http_errors_total`, `turnogo_database_status`, `turnogo_app_info`)
- [x] **Sentry hardening**: `send_default_pii=False`, `request_id` tag en `before_send`, sanitización de passwords/tokens/keys
- [x] **Documentación**: `docs/observability.md` — guía operativa con Grafana dashboards, 5 AlertManager rules, playbook de debugging
- [x] 5 commits, 18 archivos, ~700 líneas

### 9.5 Backups y DRP 🟡 (1-2 días)
- [x] **Documentación DRP**: `docs/disaster-recovery.md` con 9 escenarios de desastre
- [x] **Procedimiento de restore**: paso a paso (8 pasos) documentado
- [x] **Objetivos SRE definidos**: RPO 24h, RTO 2h, disponibilidad 99.5%
- [x] **Auditoría de infraestructura**: Supabase, Railway, Vercel, GitHub
- [x] **Pipeline docs**: `deploy-pipeline-setup.md` actualizado
- [x] 🔴 **`supabase_url.txt` eliminado** del repo (contenía credenciales)
- [ ] ⏳ **Verificar backups automáticos** en Supabase Dashboard
- [ ] ⏳ **Confirmar si existe PITR** (requiere dashboard o plan Pro)
- [ ] ⏳ **Rotar contraseña Supabase** (estuvo expuesta en git history)
- [ ] ⏳ **Respaldar variables de entorno** de Railway y Vercel
- [ ] ⏳ **Simulacro de restore** para validar RTO

### 9.5 Backups y DRP (original)
- [ ] Configurar backups automáticos de Supabase (diarios, 7 días retención)
- [ ] Documentar procedimiento de restore
- [ ] Plan de recuperación: ¿qué pasa si Railway cae? ¿Si Supabase falla?

---

## FASE 10 — BLOQUEANTES DE PRODUCCIÓN 🟠 (2-3 semanas)

### 10.1 Email Transaccional (SendGrid/SES)
- [ ] Integrar SendGrid o AWS SES
- [ ] Templates para:
  - Bienvenida post-registro
  - Confirmación de email
  - Nueva aplicación recibida
  - Trabajo aceptado/rechazado
  - Trabajo completado
  - Pago recibido
  - Disputa abierta/resuelta
- [ ] Preferencias de notificación en settings del usuario
- [ ] Queue de emails con Celery/Redis (no bloquear requests)

### 10.2 Reseteo de Contraseña
- [ ] Endpoint `POST /auth/forgot-password` (envía email con token)
- [ ] Endpoint `POST /auth/reset-password` (valida token + nueva password)
- [ ] UI en frontend: pantalla de "olvidé mi contraseña" (ya existe esqueleto)
- [ ] Token expira en 1 hora
- [ ] Rate limiting: 1 solicitud/5 minutos

### 10.3 KYC Funcional (Didit)
- [ ] Obtener API Key de business.didit.me
- [ ] Configurar en Railway env vars
- [ ] Probar flujo completo: crear sesión → redirect → webhook → verified
- [ ] Probar subida automática de avatar a Cloudinary post-verificación
- [ ] Mostrar status de verificación en dashboard

### 10.4 Cloudinary Funcional
- [ ] Configurar credenciales en Railway
- [ ] Verificar subida de avatares con transformaciones (300x300, face crop)
- [ ] Verificar fallback local funciona cuando no hay credenciales

### 10.5 Pagos Blockchain Reales
- [ ] Obtener MATIC de faucet Amoy para gas fees
- [ ] Probar `send_usdt()` real en testnet
- [ ] Verificar escaneo automático de depósitos
- [ ] Probar retiros a wallet externa

---

## FASE 11 — CHAT Y COMUNICACIÓN 🟠 (2-3 semanas)

### 11.1 Chat en Tiempo Real Worker/Contractor
- [ ] Modelo `Message` (id, job_id, sender_id, content, timestamp, read)
- [ ] Endpoints REST: `POST /api/v1/jobs/{id}/messages`, `GET /api/v1/jobs/{id}/messages`
- [ ] SSE endpoint para nuevos mensajes en tiempo real
- [ ] UI: Chat bubble en job detail
- [ ] Indicador de mensajes no leídos en navbar
- [ ] Carga de imágenes en chat
- [ ] Marcar mensajes como leídos

### 11.2 Push Notifications
- [ ] Integrar Firebase Cloud Messaging (FCM)
- [ ] Solicitar permiso de notificaciones en PWA
- [ ] Enviar push para eventos críticos:
  - Trabajo aceptado
  - Pago recibido
  - Disputa abierta/resuelta
  - Nuevo mensaje
- [ ] Fallback a in-app si push no está disponible

---

## FASE 12 — UX Y COMPLETITUD 🟡 (3-4 semanas)

### 12.1 Evidencia Fotográfica
- [ ] Permitir subida de fotos al solicitar completar trabajo
- [ ] Integración con Cloudinary (ya existe el servicio)
- [ ] Timestamp + metadata en las fotos
- [ ] Galería de evidencia en job detail
- [ ] Admin puede revisar en disputas

### 12.2 Perfiles Avanzados
- [ ] Expandir modelo User:
  - `bio` (descripción personal)
  - `skills` (lista de habilidades, array)
  - `hourly_rate` (tarifa por hora)
  - `availability` (horarios disponibles)
- [ ] UI: Sección de perfil completo con tabs
- [ ] Mostrar historial laboral: trabajos realizados, puntualidad, cancelaciones
- [ ] Mostrar tiempo promedio de respuesta

### 12.3 Onboarding
- [ ] Tour interactivo post-registro (primera vez)
- [ ] Barra de progreso de perfil (% completado)
- [ ] Badges: "Email verificado", "KYC completado", "Wallet registrada"
- [ ] Checklist de onboarding: "Completa tu perfil para empezar"

### 12.4 Dashboard Específico por Rol
- [ ] Dashboard worker:
  - Trabajos disponibles cercanos
  - Earnings por semana/mes
  - Rating breakdown
  - Métricas: tiempo promedio, completion rate
  - Recomendaciones de trabajos
- [ ] Dashboard contractor:
  - Gasto total
  - Trabajos publicados vs completados
  - Rating de workers frecuentes

### 12.5 Historial Laboral Público
- [ ] Perfil público de worker con:
  - Trabajos realizados
  - Puntualidad
  - Cancelaciones
  - Rating promedio y breakdown
  - Comentarios de contractors

---

## FASE 13 — BÚSQUEDA Y RECOMENDACIONES 🟡 (2-3 semanas)

### 13.1 Búsqueda Avanzada
- [ ] Búsqueda full-text con PostgreSQL FTS
- [ ] Filtros:
  - Rango de presupuesto (min-max)
  - Categoría
  - Duración
  - Radio de ubicación (geospatial)
  - Rating mínimo del contractor/worker
  - Fecha de publicación
- [ ] Ordenamiento: relevancia, presupuesto, fecha, distancia
- [ ] Guardar búsquedas favoritas

### 13.2 Auto-Payout con Período de Reclamo
- [ ] Implementar auto-liberación de pago 72h post-completado
- [ ] Contractor puede disputar dentro del período de 72h
- [ ] Si no disputa en 72h: pago liberado automáticamente
- [ ] Configurable por categoría o por contractor (trust score)

### 13.3 GPS Check-in
- [ ] Verificar ubicación del worker al hacer check-in
- [ ] Backend valida coordenadas vs. job.location
- [ ] Radio de tolerancia configurable (100m default)
- [ ] Geofencing con notificación al entrar/salir

---

## FASE 14 — SEGURIDAD AVANZADA 🟡 (2-3 semanas)

### 14.1 2FA para Withdrawals
- [ ] Implementar TOTP (Google Authenticator) — `pyotp`
- [ ] Flujo: settings → escanear QR → verificar código
- [ ] Withdrawals requieren código TOTP adicional
- [ ] Opción alternativa: SMS 2FA (Twilio)

### 14.2 Sistema Antifraude
- [ ] Detección de múltiples cuentas (misma IP, mismo dispositivo)
- [ ] Rate limiting global por IP (1000 requests/minuto)
- [ ] Rate limiting específico por wallet
- [ ] Detección de wallets repetidas entre usuarios
- [ ] Flag automático de comportamiento sospechoso
- [ ] Panel admin para revisar fraud flags

### 14.3 CSRF Protection
- [ ] Implementar CSRF tokens para endpoints POST/PUT/DELETE
- [ ] SameSite cookies para refresh tokens
- [ ] Validar Content-Type en requests sensibles

---

## FASE 15 — OBSERVABILIDAD Y MÉTRICAS 🟡 (1-2 semanas)

### 15.1 Monitoreo Técnico
- [ ] Configurar Prometheus + Grafana (o usar Sentry Performance)
- [ ] Métricas: latency endpoint, errores, throughput, DB queries
- [ ] Alertas: error rate >1%, latency >2s, downtime
- [ ] Health checks automáticos (ya existe `/api/v1/health`)

### 15.2 Métricas de Negocio
- [ ] Dashboard de métricas (admin):
  - CAC (Costo de adquisición)
  - LTV (Valor del cliente)
  - Tiempo promedio para cubrir un trabajo
  - Tasa de aceptación de ofertas
  - Tasa de cancelación
  - Conversión: visitante → registro → KYC → primer trabajo
  - Retención semanal y mensual
- [ ] Exportación de métricas a CSV

### 15.3 Logging Centralizado
- [ ] Configurar aggregador de logs (Logtail, Datadog, o ELK)
- [ ] Todos los servicios loggean en formato estructurado
- [ ] IDs de correlación en cada request (request_id)

---

## FASE 16 — FUNCIONES DE CRECIMIENTO 🟢 (3-4 semanas)

### 16.1 Sistema de Referidos
- [ ] Código de referido único por usuario
- [ ] Bonus por referido exitoso ($5 en créditos)
- [ ] Tracking de referidos en modelo User
- [ ] Dashboard de referidos
- [ ] Notificación cuando un referido se registra

### 16.2 Marketplace Analytics
- [ ] Analytics públicos:
  - Precios promedio por categoría
  - Demanda por categoría
  - Tendencias estacionales
- [ ] Analytics privados (admin):
  - Cohort analysis
  - Churn rate
  - Funnel conversion

### 16.3 Recomendaciones Inteligentes
- [ ] Recomendar trabajos basado en historial del worker
- [ ] Recomendar workers basado en historial del contractor
- [ ] "Trabajos cerca de ti" (geolocalización)
- [ ] "Trabajos populares" (más aplicaciones)

### 16.4 Multi-idioma (ES/EN)
- [ ] Implementar i18n con `next-intl` o `react-i18next`
- [ ] Traducir toda la UI a inglés
- [ ] Selector de idioma en navbar
- [ ] Detectar idioma del navegador
- [ ] Traducir emails y notificaciones

---

## FASE 17 — ESCALABILIDAD Y RENDIMIENTO 🟢 (2-3 semanas)

### 17.1 Redis
- [ ] Configurar Redis para:
  - Cache de sesiones (reemplazar localStorage para tokens)
  - Rate limiting distribuido
  - SSE pub/sub (mejor que in-memory EventManager)
  - Cache de queries frecuentes (jobs list, user profile)

### 17.2 Cola de Tareas (Celery/RQ)
- [ ] Configurar Celery o RQ
- [ ] Tareas en cola:
  - Envío de emails
  - Escaneo blockchain (`/api/v1/payments/scan-deposits`)
  - Subida a Cloudinary
  - Procesamiento de webhooks
  - Limpieza de tokens expirados

### 17.3 Indexación de Base de Datos
- [ ] Revisar y agregar índices faltantes
- [ ] Índices compuestos para queries frecuentes
- [ ] Particionamiento de tablas grandes (transactions)
- [ ] Consultar `EXPLAIN ANALYZE` en queries lentas

### 17.4 Feature Flags
- [ ] Implementar sistema simple de feature flags
- [ ] Flags: `chat_enabled`, `auto_payout`, `referrals`
- [ ] Rollouts graduales por porcentaje de usuarios
- [ ] Admin panel para togglear flags

---

## FASE 18 — PREPARACIÓN PARA VENEZUELA 🟢 (2-3 semanas)

### 18.1 Manejo de Moneda Local
- [ ] Mostrar precios en USD + VES (tasa BCV)
- [ ] API de tasa de cambio (o scraping de @monitordolarvzla)
- [ ] Configuración flexible de comisiones por ciudad o categoría

### 18.2 Conectividad Limitada
- [ ] Optimizar PWA para modo offline:
  - Cachear jobs list
  - Cachear perfil del usuario
  - Acciónes offline queueadas (apply, send message)
- [ ] Reducir peso de assets
  - Lazy loading de imágenes
  - Code splitting agresivo
  - Compresión de SVG

### 18.3 Pago por Alternativas
- [ ] Considerar integración con:
  - Binance Pay (USDT)
  - Banco de Venezuela (transferencia)
  - Pagomóvil
  - Zelle (para remesas)

---

## FASE 19 — DOCUMENTACIÓN Y ACCESIBILIDAD 🟢 (1-2 semanas)

### 19.1 Documentación Técnica
- [ ] README.md completo: stack, setup, deploy
- [ ] OpenAPI enriquecido con descripciones (ya hay algunas)
- [ ] Diagrama de arquitectura
- [ ] Guía de contribución
- [ ] ADR (Architecture Decision Records)

### 19.2 Accesibilidad
- [ ] Navegación por teclado completa
- [ ] Contraste de colores WCAG AA
- [ ] Atributos ARIA en componentes clave
- [ ] Soporte para lectores de pantalla
- [ ] Etiquetas en formularios

### 19.3 Estrategia de Versionado de API
- [ ] Documentar estrategia: `v1` → `v2`
- [ ] Deprecación suave de endpoints viejos
- [ ] Migración sin romper clientes

---

## FASE 20 — FUTURO (Largo Plazo) 💎

### 20.1 App Nativa
- [ ] React Native o Flutter
- [ ] Reutilizar backend existente
- [ ] Features nativas: push, GPS, cámara, biometría
- [ ] Publicar en Play Store y App Store

### 20.2 Escrow On-Chain (Smart Contract)
- [ ] Implementar smart contract en Polygon con multisig
- [ ] Fondos en escrow on-chain (no en wallet custodial)
- [ ] Liberación vía transacción blockchain
- [ ] Auditoría de smart contract

### 20.3 IA y Automatización
- [ ] Recomendación de precios basada en mercado
- [ ] Auto-categorización de trabajos
- [ ] Detección automática de fraudes con ML
- [ ] Chatbot de soporte

### 20.4 Expansión Internacional
- [ ] Multi-moneda: USDT, USDC, DAI, monedas locales
- [ ] Múltiples blockchains: Polygon, BNB Chain, Base
- [ ] Regulaciones: GDPR, CCPA, compliance local
- [ ] Modelo de comisiones por país

---

## 📊 Resumen de Prioridades

| Fase | Prioridad | Tiempo Estimado | Dependencias |
|------|-----------|-----------------|--------------|
| **Fase 8** — Seguridad Crítica | ✅ Completada | 19-22 Jul 2026 | Ninguna |
| **Fase 9** — Infraestructura | 🟡 95% | 19-24 Jul 2026 | Fase 8 |
| **Fase 9.1** — Alembic | ✅ Completada | 22 Jul 2026 | |
| **Fase 9.2** — Tests | ✅ Completada | 22 Jul 2026 | |
| **Fase 9.3** — CI/CD | ✅ Completada | 23 Jul 2026 | Fase 9.2 |
| **Fase 9.4** — Observabilidad | ✅ Completada | 23 Jul 2026 | Fase 9.3 |
| **Fase 9.5** — Backups y DRP | 🟡 Docs ✅, verificaciones ⏳ | 1-2 días | Fase 9.4 |
| **Fase 10** — Bloqueantes Producción | 🟠 2-3 sem | 2-3 semanas | Fase 9 |
| **Fase 11** — Chat + Comunicación | 🟠 2-3 sem | 2-3 semanas | Fase 10 (email) |
| **Fase 12** — UX y Completitud | 🟡 3-4 sem | 3-4 semanas | Fase 11 |
| **Fase 13** — Búsqueda + Recomendaciones | 🟡 2-3 sem | 2-3 semanas | Fase 12 |
| **Fase 14** — Seguridad Avanzada | 🟡 2-3 sem | 2-3 semanas | Fase 11 |
| **Fase 15** — Observabilidad | ✅ Completada | 23 Jul 2026 | Fase 9 |
| **Fase 16** — Crecimiento | 🟢 3-4 sem | 3-4 semanas | Fase 12 |
| **Fase 17** — Escalabilidad | 🟢 2-3 sem | 2-3 semanas | Fase 9 |
| **Fase 18** — Venezuela | 🟢 2-3 sem | 2-3 semanas | Fase 10 |
| **Fase 19** — Documentación | 🟢 1-2 sem | 1-2 semanas | Cualquier fase |
| **Fase 20** — Futuro | 💎 LP | Variable | Fases 1-19 |

## 📈 Timeline Estimado

```
Jul 2026 ──── Fase 8 ✅  (Seguridad Crítica) ──────────────── ✅
Jul 2026 ──── Fase 9.1 ✅ (Alembic Migraciones) ──────────── ✅
Jul 2026 ──── Fase 9.2 ✅ (Tests Automatizados 137) ──────── ✅
Jul 2026 ──── Fase 9.3 ✅ (CI/CD GitHub Actions) ──────────── ✅
Jul 2026 ──── Fase 9.5 🟡 (Backups y DRP — docs ✅, verificaciones ⏳)
Aug 2026 ──── Fase 10    (Bloqueantes producción) ────────── 🟠
Aug-Sep 2026 ─ Fase 11-12 (Chat + UX) ───────────────────── 🟠🟡
Sep-Oct 2026 ─ Fase 13-15 (Búsqueda + Seguridad + Metrics)  🟡
Oct-Nov 2026 ─ Fase 16-17 (Crecimiento + Escalabilidad) ──── 🟢
Nov-Dec 2026 ─ Fase 18-19 (Venezuela + Docs) ─────────────── 🟢
2027+ ─────── Fase 20 (App nativa, Escrow, IA) ──────────── 💎
```

---

## Historial del Proyecto

| Fecha | Avance |
|-------|--------|
| 9 jul 2026 | Fundación + Fase 1 completa. Auth + modelo User. |
| 10 jul 2026 | Fase 2 completa. Jobs + Applications + flujo completo. 17 endpoints. |
| 10 jul 2026 | Fase 3 iniciada. web3.py, wallet sistema, payments. 24 endpoints. |
| 11-12 jul 2026 | Fase 4 completa. Frontend completo + Admin panel + PWA + SEO. |
| 12 jul 2026 | Deploy a Vercel + Railway. Supabase PostgreSQL conectado. |
| 14 jul 2026 | KYC Didit integrado (sin API Key). Cloudinary avatares. |
| 18-19 jul 2026 | Auditoría multi-modelo: OpenClaw + GPT + Devin + Gemini. |
| 19-22 jul 2026 | **Fase 8 completa**. SECRET_KEY, startup validator, dev-token eliminado, webhook HMAC, CORS strict, passwords, email verification, security headers, audit logs, gitignore. 60 tests de seguridad. |
| 22 jul 2026 | **Fase 9.1 completa**. Alembic migrations (10 tablas), baseline, Railway Start Command con `alembic upgrade head`. |
| 22 jul 2026 | **Fase 9.2 completa**. 137 tests estables (5 suites), aislamiento con `drop_all/create_all`, `.coveragerc`, `TESTING.md`, sesión `db` compartida. Cobertura ~65% core. |
| 23 jul 2026 | **Fase 9.3 completa**. CI/CD pipeline: ci.yml + deploy.yml (workflow_run gate). Arquitectura limpia: Vercel auto-deploy on push + Railway "Wait for CI" nativo. Sin duplicación. Smoke test exitoso: CI falla → gate bloquea deploy → revert → CI verde. |
| 23 jul 2026 | **Fase 9.4 completa**. Observabilidad profesional en 5 bloques: logging estructurado (structlog, 24 prints eliminados), request ID tracing (X-Request-ID), health checks (/live, /ready, /health), métricas Prometheus (/metrics, 5 métricas), Sentry hardening (PII off, request_id tag, sanitización). `docs/observability.md` con playbook de debugging. |
| 24 jul 2026 | **Fase 9.5 documentada**. DRP completo: 9 escenarios, restore procedure, objetivos SRE. `supabase_url.txt` eliminado del repo. ⏳ Pendiente: verificar backups en Supabase Dashboard, rotar contraseña, respaldar variables de Railway/Vercel, simulacro de restore. |
| 23 jul 2026 | **Lecciones de deploy**: Vercel `ignoreCommand` bloquea Deploy Hooks. Railway "Wait for CI" es la solución correcta. Arquitectura final: 1 deploy por commit por plataforma. |

---

*Versión 2.0 — Consolidación de 4 análisis de IA | Última actualización: 23 julio 2026*
