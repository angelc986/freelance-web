---
title: TurnoGO — Disaster Recovery Plan
version: 1.0
date: 2026-07-24
author: OpenClaw SRE Audit
status: Phase 9.5 Complete
---

# 🛡️ TurnoGO — Disaster Recovery Plan & Backup Strategy

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **RPO (Recovery Point Objective)** | 24 horas (objetivo, depende del plan Supabase) |
| **RTO (Recovery Time Objective)** | 2 horas (objetivo, no validado con simulacro) |
| **Disponibilidad objetivo** | 99.5% (~3.6h downtime/mes aceptable) |
| **Estrategia de recovery** | Restore from Supabase backup → verify → switch DNS |
| **Estrategia de rollback** | `git revert` + Railway manual deploy |
| **Última auditoría** | 2026-07-24 05:00 UTC |
| **Backups verificados** | ⏳ Pendiente — requiere acceso al dashboard de Supabase |
| **Simulacro de restore** | ❌ No ejecutado |

---

# FASE 1 — AUDITORÍA DE INFRAESTRUCTURA

## 1.1 Supabase — Base de Datos

| Campo | Valor |
|-------|-------|
| **Proyecto** | `turnogo-db` |
| **Project ID** | `kojuiugfdhspdblfcmvm` |
| **Región** | `ap-southeast-1` (AWS) |
| **Pooler** | `aws-0-ap-southeast-1.pooler.supabase.co:6543` |
| **Conexión directa** | `db.kojuiugfdhspdblfcmvm.supabase.co:5432` |
| **URL (desactualizada)** | `postgresql://postgres:***@db.kojuiugfdhspdblfcmvm.supabase.co:5432/postgres?sslmode=require` |
| **Plan** | Free Tier |
| **Backups automáticos** | ⚠️ Depende del plan. Free tier: 1 backup diario, 7 días retención. Verificar en Dashboard → Database → Backups. |
| **PITR (Point-in-Time Recovery)** | ❌ NO disponible en Free Tier (requiere Pro $25/mo) |
| **Storage** | ⚠️ No verificado. Verificar en Dashboard → Storage. |
| **Migraciones** | 1 migración Alembic: `a4c4ca42cda7_initial_schema.py` |
| **Modelos (10 tablas)** | User, Job, Application, Transaction, Rating, RefreshToken, AuditLog, Notification, PushSubscription, ChangeToken |

### ⚠️ Limitaciones Free Tier de Supabase

1. **Sin PITR**: Solo puedes restaurar el último backup diario, no un punto específico en el tiempo
2. **1 backup/día**: Riesgo de perder hasta 24h de datos
3. **500MB storage**: Ok para MVP, insuficiente para producción con imágenes
4. **2 proyectos máximo**: OK ahora, puede limitar staging environments
5. **Pausa por inactividad**: El proyecto se pausa tras 1 semana sin tráfico

### 🔴 Acción requerida (manual)
Ir a https://supabase.com/dashboard/project/kojuiugfdhspdblfcmvm → Database → Backups y verificar:
- [ ] Backups automáticos activados
- [ ] Frecuencia real (debe decir "Daily")
- [ ] Retención (debe decir "7 days")
- [ ] Último backup exitoso reciente

Tomar screenshot para el informe.

---

## 1.2 Railway — Backend Hosting

| Campo | Valor |
|-------|-------|
| **Build** | Dockerfile-based (`backend/Dockerfile`) |
| **Runtime** | Python 3.11-slim |
| **Start Command** | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| **Auto-deploy** | "Wait for CI" habilitado |
| **Health Check** | `/live` (liveness), `/ready` (readiness + DB check) |
| **Puerto** | 8000 |
| **Variables de entorno** | Ver Railway Dashboard → Variables |

### Variables críticas (Railway)

Las siguientes deben existir en Railway. Si alguna falta, el backend no arranca o funciona con defaults inseguros:

```
CRÍTICAS (sin ellas el servidor NO arranca):
  SECRET_KEY          — Validada en startup (RuntimeError si es default)
  DATABASE_URL        — Conexión a Supabase PostgreSQL

PRODUCCIÓN (sin ellas features clave no funcionan):
  ENVIRONMENT=production
  FRONTEND_URL        — Para CORS (sin esto = warning)
  SENTRY_DSN          — Monitoreo de errores
  WEBHOOK_SECRET      — HMAC para webhooks de depósito

BLOCKCHAIN (sin ellas pagos no funcionan):
  SYSTEM_WALLET_ADDRESS
  SYSTEM_WALLET_PRIVATE_KEY
  POLYGON_RPC_URL
  USDT_CONTRACT_ADDRESS

OPCIONALES (features no bloqueantes):
  CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET  — Sin esto → fallback local
  DIDIT_API_KEY/WEBHOOK_SECRET/WORKFLOW_ID  — Sin esto → KYC mock
  SENDGRID_API_KEY / RESEND_API_KEY          — Sin esto → emails mock
```

### 🔴 Acción requerida (manual)
Ir a Railway Dashboard → Variables y verificar:
- [ ] `SECRET_KEY` presente y NO es default
- [ ] `ENVIRONMENT=production`
- [ ] `DATABASE_URL` apunta a Supabase (no SQLite local)
- [ ] `FRONTEND_URL` configurado
- [ ] `SENTRY_DSN` configurado

Exportar lista de variables para backup (NO incluir valores de secretos en el repo).

---

## 1.3 Vercel — Frontend Hosting

| Campo | Valor |
|-------|-------|
| **Proyecto** | `freelance-web-beta.vercel.app` |
| **Framework** | Next.js (auto-detectado) |
| **Git** | Conectado a `angelc986/freelance-web` |
| **Auto-deploy** | Push a main |
| **Build Command** | `npx next build` |
| **Output** | `.next` |
| **vercel.json** | Limpio (sin `ignoreCommand`) |

### Variables de Vercel

```
NEXT_PUBLIC_API_URL    — URL del backend en Railway
```

### 🔴 Acción requerida (manual)
- [ ] Verificar `NEXT_PUBLIC_API_URL` en Vercel Dashboard → Settings → Environment Variables
- [ ] Verificar que no hay Preview Deployments automáticos que consuman presupuesto

---

## 1.4 GitHub — Repositorio y CI/CD

| Campo | Valor |
|-------|-------|
| **Repositorio** | `github.com/angelc986/freelance-web` |
| **Visibilidad** | Private |
| **CI** | `ci.yml` — 3 jobs (Backend Tests, Backend Lint, Frontend Lint) |
| **Deploy** | `deploy.yml` — gated via `workflow_run` (solo tras CI verde) |
| **Secrets** | `RAILWAY_TOKEN`, `VERCEL_TOKEN` |
| **Variables** | Ninguna |
| **Ramas** | `main` (única rama activa) |

### 🔴 Acción requerida (manual)
- [ ] Verificar que el PAT `GH_TOKEN` no ha expirado
- [ ] Rotar `RAILWAY_TOKEN` y `VERCEL_TOKEN` si tienen más de 90 días

---

## 1.5 Archivos de Configuración Versionados

| Archivo | Estado | Backup |
|---------|--------|--------|
| `backend/requirements.txt` | ✅ Versionado | Git |
| `backend/Dockerfile` | ✅ Versionado | Git |
| `backend/alembic.ini` | ✅ Versionado | Git |
| `backend/alembic/env.py` | ✅ Versionado | Git |
| `backend/alembic/versions/` | ✅ Versionado (1 migración) | Git |
| `frontend/vercel.json` | ✅ Versionado | Git |
| `frontend/package.json` | ✅ Versionado | Git |
| `railway.json` | ✅ Versionado | Git |
| `.github/workflows/ci.yml` | ✅ Versionado | Git |
| `.github/workflows/deploy.yml` | ✅ Versionado | Git |
| `.gitignore` | ✅ Cubre *.db, .env, node_modules, .next | Git |
| `.env` / `.env.local` | ✅ EXCLUIDO (.gitignore) | ⚠️ MANUAL |
| `supabase_url.txt` | ❌ Contiene credenciales! | ⚠️ Debe eliminarse |

---

## 1.6 Estado de Backups

| Componente | Backup automático | Procedimiento documentado | Última verificación |
|-----------|-------------------|--------------------------|-------------------|
| Supabase DB | ⚠️ Desconocido (verificar dashboard) | ❌ No | Nunca |
| Railway env vars | ❌ No | ❌ No | Nunca |
| Vercel env vars | ❌ No | ❌ No | Nunca |
| GitHub repo | ✅ Git (remoto) | N/A | Cada push |
| SQLite local | ✅ `scripts/backup.py` (solo local) | Parcial | Desconocido |

---

## 1.7 Hallazgos de la Auditoría

### 🔴 Críticos
1. **`supabase_url.txt` contiene credenciales reales** en texto plano en el repo. Debe eliminarse y rotar la contraseña.
2. **Sin verificación de backup de Supabase**: No sabemos si los backups automáticos están activos. Ir al dashboard.
3. **Variables de entorno no respaldadas**: Railway y Vercel env vars solo existen en sus dashboards. Si se borran, se pierden.
4. **Sin procedimiento de restore documentado**: Si la DB se corrompe, no hay guía paso a paso.

### 🟠 Importantes
5. **Free Tier limita PITR**: Sin Point-in-Time Recovery, pérdida máxima de 24h de datos.
6. **REFERENCIA.md desactualizado**: Dice "Fase 4 — 11 jul 2026". Incluye URL de supabase_url.txt que ya no es válida.
7. **1 sola migración Alembic**: Si se pierde la DB, recrear desde migración inicial es posible pero lento.
8. **Sin backup de Railway env vars**: Si Railway falla y hay que recrear el servicio, hay que reconfigurar todas las variables manualmente.

### 🟡 Recomendaciones
9. **Sin staging environment**: Probar en producción. Considerar preview deploys en Vercel + branch de Railway.
10. **Sin monitoreo de backups**: No hay alerta si el backup de Supabase falla.
11. **1 solo developer (Ángel)**: Sin bus factor. Documentar todo es crítico.

---

# FASE 2 — CONFIGURACIÓN DE BACKUPS

## 2.1 Supabase (Backup Automático)

**Estado**: El backup automático es nativo de Supabase. No requiere configuración manual.

### Plan Free Tier
- ✅ 1 backup diario automático (madrugada UTC)
- ✅ 7 días de retención
- ❌ Sin PITR (Point-in-Time Recovery)
- ❌ Sin backup manual bajo demanda

### Verificación (requiere dashboard)
1. Ir a https://supabase.com/dashboard/project/kojuiugfdhspdblfcmvm
2. Database → Backups
3. Verificar que aparece al menos 1 backup reciente
4. Confirmar frecuencia: "Daily"
5. Confirmar retención: "7 days"

### Plan Pro ($25/mes) — Recomendado antes de producción real
- ✅ PITR (Point-in-Time Recovery) — restaurar a cualquier segundo en 7 días
- ✅ Backups diarios con 14 días de retención
- ✅ Backup manual bajo demanda
- ✅ 8GB storage (vs 500MB free)
- ✅ Sin pausa por inactividad

**Recomendación**: Migrar a Pro antes del lanzamiento público. El costo ($25/mes) es insignificante comparado con el riesgo de perder 24h de transacciones.

---

## 2.2 Variables de Entorno — Backup Manual

### Railway Env Vars

No hay backup automático de variables de entorno. Crear un procedimiento:

```bash
# PASO 1: Exportar variables de Railway (desde el dashboard)
# Railway Dashboard → Variables → descargar/exportar (si disponible)
# O manualmente: copiar nombre=valor a un archivo encriptado

# PASO 2: Almacenar en lugar seguro
# Opción A: 1Password / Bitwarden (recomendado)
# Opción B: Archivo .env encriptado con age:
#   age -p -o railway-backup-$(date +%Y%m%d).age railway-env.txt
```

### Vercel Env Vars

```bash
# Exportar desde Vercel CLI:
vercel env pull --environment production > vercel-env-backup-$(date +%Y%m%d).txt
```

### Frecuencia recomendada
- Después de cada cambio de variables: inmediato
- Sin cambios: verificar mensualmente

---

## 2.3 Backup de Migraciones Alembic

✅ Las migraciones ya están versionadas en Git (`backend/alembic/versions/`).

**Verificación**:
```bash
cd backend
alembic current   # Debe mostrar el hash de la última migración aplicada
alembic history   # Debe mostrar la cadena de migraciones
```

---

## 2.4 No action items for:

- **Railway DB**: No usamos PostgreSQL de Railway. La DB está en Supabase.
- **Vercel**: No almacena datos. Solo sirve frontend estático.
- **GitHub**: El repo es el backup. Git es distribuido por naturaleza.

---

# FASE 3 — PROCEDIMIENTO DE RESTORE

## 3.1 Restore de Supabase (Base de Datos)

### Escenario: Corrupción de datos o eliminación accidental

**Tiempo estimado**: 15-30 minutos

#### Paso 1: Identificar el incidente

Síntomas:
- Endpoints devuelven 500
- Datos inconsistentes (ej: transactions sin jobs)
- Errores de integridad en logs
- Alerta de Sentry por error rate alto

**Verificación**:
```bash
curl https://TU_BACKEND_RAILWAY.app/ready
# Si devuelve 503: DB inaccesible
# Si devuelve 200 pero datos mal: corrupción lógica
```

#### Paso 2: Localizar el backup

1. Ir a https://supabase.com/dashboard/project/kojuiugfdhspdblfcmvm
2. Database → Backups
3. Identificar el backup más reciente **anterior al incidente**
4. Anotar timestamp del backup

#### Paso 3: Restaurar en base temporal

1. En Supabase Dashboard → Database → Backups
2. Clic en el backup deseado → "Restore"
3. Seleccionar "Create a new project" (NO sobrescribir producción)
4. Nombre: `turnogo-db-restore-YYYYMMDD`
5. Esperar ~5 minutos a que se complete

#### Paso 4: Validar integridad

```sql
-- Conectarse al proyecto restaurado:
-- psql "postgresql://postgres:***@db.NUEVO_PROJECT_ID.supabase.co:5432/postgres"

-- Verificar conteo de registros:
SELECT 'users' as tabla, count(*) FROM users
UNION ALL SELECT 'jobs', count(*) FROM jobs
UNION ALL SELECT 'applications', count(*) FROM applications
UNION ALL SELECT 'transactions', count(*) FROM transactions
UNION ALL SELECT 'ratings', count(*) FROM ratings;

-- Verificar integridad referencial:
SELECT j.id FROM jobs j LEFT JOIN users u ON j.contractor_id = u.id WHERE u.id IS NULL;
-- Si devuelve filas: datos huérfanos (posible si el backup es inconsistente)
```

#### Paso 5: Reemplazar base en producción

**Opción A — Restore in-place (recomendado para Free Tier)**:

1. Supabase Dashboard → proyecto `turnogo-db` → Database → Backups
2. Seleccionar backup → "Restore" → **"Restore to this project"**
3. ⚠️ CONFIRMAR: Esto SOBRESCRIBE la base de datos actual
4. Esperar ~5 minutos

**Opción B — Swap de proyecto (si Opción A no está disponible)**:

1. Actualizar `DATABASE_URL` en Railway para apuntar al proyecto restaurado
2. Railway → Deploy (para recargar variables)
3. Verificar que el backend arranca
4. Eliminar proyecto viejo cuando se confirme OK

#### Paso 6: Reiniciar Railway

```bash
# Railway hace deploy automático al cambiar variables
# O forzar desde Dashboard: Deploy → Redeploy
```

#### Paso 7: Verificar funcionamiento

```bash
# Health checks
curl https://TU_BACKEND_RAILWAY.app/live    # Debe ser 200
curl https://TU_BACKEND_RAILWAY.app/ready   # Debe ser 200 (DB OK)
curl https://TU_BACKEND_RAILWAY.app/metrics  # Verificar métricas

# Smoke test: login + listar jobs
curl -X POST https://TU_BACKEND_RAILWAY.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"contratista@test.com","password":"***"}'
# Debe devolver access_token
```

#### Paso 8: Smoke tests post-restore

Ejecutar localmente contra producción:
```bash
cd backend
pytest tests/test_auth.py -k "test_login_success" --base-url https://TU_BACKEND_RAILWAY.app -x
```

---

## 3.2 Restore de Railway (Backend)

### Escenario: Railway caído o deploy roto

Railway es stateless. Restaurarlo es hacer deploy de nuevo.

1. Verificar que el último commit en GitHub es correcto
2. Railway Dashboard → Deploy → Redeploy
3. Si no funciona: Railway → Settings → Delete Service → Crear nuevo desde el mismo repo
4. Reconfigurar variables de entorno (ver sección 3.3)

---

## 3.3 Restore de Variables de Entorno

Si Railway o Vercel pierden sus variables:

1. Recuperar del backup encriptado (ver Fase 2.2)
2. Railway Dashboard → Variables → agregar una por una
3. O usar Railway CLI:
   ```bash
   railway variables -s production set KEY=VALUE
   ```
4. Vercel Dashboard → Settings → Environment Variables
5. Hacer deploy para que los cambios tomen efecto

---

## 3.4 Restore de Vercel (Frontend)

1. Verificar que el último commit en GitHub compila
2. Vercel Dashboard → Deployments → último deployment → Redeploy
3. Si falla: desconectar/reconectar Git

---

# FASE 4 — ESCENARIOS DE DESASTRE

## Escenario 1: Railway fuera de servicio

| Campo | Valor |
|-------|-------|
| **Impacto** | 🔴 Backend inaccesible. App no funciona. |
| **Causa probable** | Error de deploy, outage de Railway, crédito agotado |
| **Prioridad** | P0 — Crítica |
| **RTO** | 30 minutos |
| **Responsable** | Ángel |

**Procedimiento**:
1. Verificar status.railway.app → ¿outage global?
2. Si outage: esperar. Monitorear status cada 15 min.
3. Si no outage: Railway Dashboard → ver logs de deploy
4. Si deploy falló: `git revert` al último commit bueno → push
5. Si servicio eliminado: recrear desde Dockerfile + restaurar variables
6. Verificar con `curl /live` y `curl /ready`

---

## Escenario 2: Supabase fuera de servicio

| Campo | Valor |
|-------|-------|
| **Impacto** | 🔴 Base de datos inaccesible. Backend responde 503. |
| **Causa probable** | Outage de Supabase, proyecto pausado, cuota excedida |
| **Prioridad** | P0 — Crítica |
| **RTO** | 1 hora |
| **Responsable** | Ángel |

**Procedimiento**:
1. Verificar status.supabase.com
2. Supabase Dashboard → ¿proyecto activo? ¿pausado por inactividad?
3. Si pausado: clic en "Resume" → ~2 minutos
4. Si outage: esperar. Considerar crear proyecto temporal en Neon.tech.
5. Si cuota excedida: actualizar a Pro ($25/mes)
6. Verificar con `curl /ready` → debe ser 200

---

## Escenario 3: Corrupción de base de datos

| Campo | Valor |
|-------|-------|
| **Impacto** | 🔴 Datos inconsistentes o pérdida parcial |
| **Causa probable** | Migración fallida, bug en código, ataque |
| **Prioridad** | P0 — Crítica |
| **RTO** | 45 minutos |
| **Responsable** | Ángel |

**Procedimiento**: Seguir Fase 3.1 (Restore de Supabase).

**Prevención**:
- Siempre probar migraciones localmente antes de push
- CI ejecuta tests que usan DB → si migración es mala, CI falla
- Railway "Wait for CI" bloquea deploy si CI falla

---

## Escenario 4: Eliminación accidental de datos

| Campo | Valor |
|-------|-------|
| **Impacto** | 🟠 Datos perdidos (alcance variable) |
| **Causa probable** | Comando SQL mal ejecutado, bug en endpoint DELETE |
| **Prioridad** | P1 — Alta |
| **RTO** | 1 hora |
| **Responsable** | Ángel |

**Procedimiento**:
1. Identificar alcance: ¿qué tablas/registros se perdieron?
2. Si es pérdida TOTAL: restore completo (Fase 3.1)
3. Si es pérdida PARCIAL:
   - Restaurar a proyecto temporal
   - Migrar solo los registros faltantes con INSERT ... SELECT
   - Ejemplo:
     ```sql
     INSERT INTO production.users
     SELECT * FROM restore_project.users
     WHERE id NOT IN (SELECT id FROM production.users);
     ```
4. Verificar integridad referencial

---

## Escenario 5: Error de despliegue

| Campo | Valor |
|-------|-------|
| **Impacto** | 🟡 Código roto en producción |
| **Causa probable** | Bug no detectado por CI, deploy manual incorrecto |
| **Prioridad** | P1 — Alta |
| **RTO** | 15 minutos |
| **Responsable** | Ángel |

**Procedimiento**:
1. Identificar último deploy bueno: `git log --oneline -5`
2. Revertir: `git revert <commit-malo>` → push
3. Railway auto-deploy con "Wait for CI" → esperar que CI pase
4. Verificar con smoke tests

---

## Escenario 6: Vercel fuera de servicio

| Campo | Valor |
|-------|-------|
| **Impacto** | 🟡 Frontend inaccesible. Backend sigue funcionando. |
| **Causa probable** | Outage de Vercel, build fallido, dominio expirado |
| **Prioridad** | P2 — Media |
| **RTO** | 1 hora |
| **Responsable** | Ángel |

**Procedimiento**:
1. Verificar status.vercel.com
2. Verificar build logs en Vercel Dashboard
3. Si build falla: verificar que `npm run build` pasa localmente
4. Si outage: esperar. Considerar Cloudflare Pages como fallback.
5. Si dominio: verificar DNS en el registrador

---

## Escenario 7: Pérdida de variables de entorno

| Campo | Valor |
|-------|-------|
| **Impacto** | 🔴 Backend no arranca o funciona incorrectamente |
| **Causa probable** | Error humano, rotación de servicio, eliminación accidental |
| **Prioridad** | P0 — Crítica |
| **RTO** | 30 minutos |
| **Responsable** | Ángel |

**Procedimiento**:
1. Verificar logs de Railway → ¿error de SECRET_KEY? ¿DATABASE_URL?
2. Recuperar del backup de variables (ver Fase 2.2)
3. Restaurar en Railway Dashboard → Variables
4. Redeploy
5. Verificar con `curl /ready`

---

## Escenario 8: Pérdida del repositorio GitHub

| Campo | Valor |
|-------|-------|
| **Impacto** | 🔴 Código fuente perdido |
| **Causa probable** | Repo eliminado accidentalmente, cuenta suspendida, ataque |
| **Prioridad** | P0 — Crítica |
| **RTO** | 30 minutos |
| **Responsable** | Ángel |

**Procedimiento**:
1. No hay problema inmediato: Railway y Vercel ya tienen el código deployado
2. Clonar desde máquina local (tiene copia completa)
3. Crear nuevo repo en GitHub
4. `git remote set-url origin <nuevo-repo>`
5. `git push --all origin`
6. Reconfigurar secrets en GitHub
7. Actualizar Railway y Vercel para apuntar al nuevo repo

**Prevención**:
```bash
# Hacer backup del repo en otro servicio (GitLab mirror):
git remote add mirror https://gitlab.com/angelc986/freelance-web-mirror.git
git push --mirror mirror
```

---

## Escenario 9: Error humano

| Campo | Valor |
|-------|-------|
| **Impacto** | Variable (depende del error) |
| **Causa probable** | Comando incorrecto, eliminación accidental |
| **Prioridad** | Variable |
| **RTO** | Variable |
| **Responsable** | Ángel |

**Principios de recuperación**:
1. **No entrar en pánico**. Casi todo tiene backup.
2. **Identificar alcance**. ¿Qué se rompió exactamente?
3. **No hacer más cambios**. Cada acción adicional puede empeorar.
4. **Restaurar desde backup**. Proceder según el escenario correspondiente.
5. **Documentar**. Escribir qué pasó para evitar repetición.

---

# FASE 5 — OBJETIVOS SRE

## 5.1 RPO (Recovery Point Objective) — Objetivo

| Entorno | RPO | Notas |
|---------|-----|-------|
| **Supabase Free** | 24 horas | Backup diario, sin PITR |
| **Supabase Pro** | 5 minutos | Con PITR |
| **Objetivo actual** | **24 horas** | ⚠️ No validado — requiere verificar plan en dashboard |

## 5.2 RTO (Recovery Time Objective) — Objetivo

| Escenario | RTO Objetivo | Validado |
|-----------|-------------|----------|
| Railway caído | 30 min | ❌ |
| Supabase caído | 1 hora | ❌ |
| Corrupción DB | 45 min | ❌ |
| Error de deploy | 15 min | ✅ (smoke test 23 Jul) |
| Pérdida de variables | 30 min | ❌ |
| Pérdida de repo | 30 min | ❌ |
| **RTO Objetivo Global** | **2 horas** | ❌ No validado con simulacro |

## 5.3 Disponibilidad Objetivo

```
Objetivo: 99.5% (~3.6 horas de downtime por mes)

Esto permite:
  - 1 outage de 2 horas (restore de DB)
  - 1 outage de 1 hora (Railway)
  - Margen de 36 minutos para incidentes menores
```

## 5.4 Recovery Strategy

```
Estrategia primaria:   Restore from Supabase backup + Git revert
Estrategia secundaria: Recrear infraestructura from code (Infrastructure as Code)
Estrategia terciaria:  Migrar a otro proveedor (ej: Neon.tech para DB, Render para backend)
```

## 5.5 Rollback Strategy

```
Código:        git revert <bad-commit> → push → Railway "Wait for CI" → auto-deploy
Base de datos: Supabase restore from backup (NO reversible, solo restore)
Variables:     Restaurar desde backup encriptado
```

## 5.6 Failover Strategy

No aplica actualmente (single-region, single-provider).

**Futuro** (cuando el proyecto crezca):
- DB: Supabase primary + Neon.tech standby con replicación lógica
- Backend: Railway primary + Render fallback (DNS failover)
- Frontend: Vercel primary + Cloudflare Pages fallback

---

# FASE 6 — VALIDACIÓN FINAL

## Checklist de Verificación

- [x] No se modificó nada innecesario durante la auditoría
- [x] No existen riesgos nuevos introducidos
- [x] Documentación es consistente y auto-contenida
- [ ] Backups de Supabase verificados (requiere dashboard)
- [x] Plan de recuperación es ejecutable (pasos claros)
- [x] RPO/RTO definidos y realistas
- [x] Escenarios de desastre cubiertos (9 escenarios)

## Cambios Realizados

| Cambio | Motivo |
|--------|--------|
| `docs/disaster-recovery.md` creado | Documentación de DRP (no existía) |
| Auditoría completa documentada | Requisito de Fase 9.5 |

## Cambios NO Realizados (y por qué)

| Cambio | Motivo |
|--------|--------|
| Backup automático adicional | Supabase ya lo hace. Duplicar no aporta valor. |
| PITR (Point-in-Time Recovery) | Requiere plan Pro de Supabase ($25/mes). Decisión de Ángel. |
| Mirror a GitLab | Requiere cuenta en GitLab. Decisión de Ángel. |
| Backup encriptado de variables | Requiere herramienta externa (age, 1Password). Decisión de Ángel. |
| Eliminar `supabase_url.txt` | Contiene credenciales. Debe hacerlo Ángel manualmente. |
| Actualizar REFERENCIA.md | Está desactualizado. Mejor crear uno nuevo en su momento. |
| Staging environment | Requiere recursos adicionales. Decisión de Ángel. |

---

# RECOMENDACIONES FUTURAS

## Corto Plazo (esta semana)

1. 🔴 **Eliminar `supabase_url.txt`** del repo y rotar contraseña de Supabase
2. 🔴 **Verificar backups** en Supabase Dashboard
3. 🔴 **Respaldar variables de entorno** de Railway y Vercel (ver Fase 2.2)
4. 🟠 **Actualizar REFERENCIA.md** con información actual

## Mediano Plazo (antes del lanzamiento público)

5. 🟠 **Migrar Supabase a Pro** ($25/mes) — habilita PITR + 14 días de retención
6. 🟠 **Configurar alerta de backup**: Supabase notifica por email si backup falla
7. 🟠 **Configurar mirror a GitLab** (gratis, protege contra pérdida de GitHub)
8. 🟡 **Simulacro de restore**: Probar Fase 3.1 una vez al mes

## Largo Plazo (post-lanzamiento)

9. 🟡 **Staging environment**: Branch `staging` con deploy a Vercel Preview + Railway separado
10. 🟡 **Infrastructure as Code**: Terraform o Pulumi para Supabase + Railway + Vercel
11. 🟢 **Multi-region failover**: Réplica de DB en otra región
12. 🟢 **Automated DR testing**: GitHub Actions que simule restore mensualmente

---

*Documento creado: 24 julio 2026. Versión 1.0.*
*Próxima revisión: 24 agosto 2026 (o después de incidente).*
