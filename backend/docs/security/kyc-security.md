# 🔐 KYC Security — Didit Integration (Fase 10.3)

> **Última actualización:** 2026-07-24  
> **Estado:** 🟢 Producción-seguro (3 CRIT + 4 HIGH implementados)  
> **Suite de tests:** `tests/verification/test_kyc_security.py` (24 tests)

---

## 📊 Diagrama de Flujo KYC

```
┌──────────┐   POST /verification/create    ┌──────────┐
│  Cliente  │ ─────────────────────────────▶ │  Backend  │
│  (React)  │ ◀── { session_url }           │  FastAPI  │
└────┬─────┘                                └────┬─────┘
     │                                           │
     │  iframe Didit                             │ webhook HMAC
     ▼                                           ▼
┌──────────┐   POST /verification/webhook   ┌──────────┐
│  Didit   │ ─────────────────────────────▶ │  Backend  │
│  Server  │   X-Signature-V2 + X-Timestamp  │  procesa  │
└──────────┘                                └────┬─────┘
                                                 │
                              ┌──────────────────┤
                              │                  │
                         Approved         Declined/Expired/
                              │            Abandoned
                              ▼                  │
                    ┌─────────────────┐          │
                    │ is_verified=true │          │
                    │ kyc_status=      │          ▼
                    │   APPROVED       │  ┌──────────────────┐
                    │ avatar_verified  │  │ Si ya approved:  │
                    │   _url = foto    │  │   → IGNORAR      │
                    │ didit_session_id │  │ Si no approved:  │
                    │   = None         │  │   kyc_status=    │
                    └─────────────────┘  │     DECLINED/etc  │
                                         │ didit_session_id  │
                                         │   = None          │
                                         └──────────────────┘
```

---

## 🔄 Máquina de Estados (`kyc_status`)

```
         ┌──────────┐
         │ PENDING   │  (default al registrarse)
         └─────┬────┘
               │
       ┌───────┼───────────┬──────────────┐
       ▼       ▼           ▼              ▼
  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────┐
  │APPROVED│ │DECLINED│ │EXPIRED │ │ ABANDONED │
  └───┬────┘ └───┬────┘ └───┬────┘ └─────┬─────┘
      │           │          │            │
      │     ┌─────┘     ┌────┘       ┌────┘
      │     ▼           ▼            ▼
      │  ┌──────────────────────────────┐
      │  │ Pueden reintentar KYC        │
      │  │ (nueva sesión → PENDING)     │
      │  └──────────────────────────────┘
      │
      ▼
  ┌─────────────────────────────────────┐
  │ ⛔ ESTADO FINAL                     │
  │ APPROVED → NUNCA puede transicionar │
  │ a DECLINED/EXPIRED/ABANDONED        │
  │ (CRIT-03)                          │
  └─────────────────────────────────────┘
```

### Transiciones permitidas

| De | A | Condición |
|----|----|-----------|
| `PENDING` | `APPROVED` | Webhook Didit con status=Approved |
| `PENDING` | `DECLINED` | Webhook Didit con status=Declined |
| `PENDING` | `EXPIRED` | Webhook Didit con status=Expired |
| `PENDING` | `ABANDONED` | Webhook Didit con status=Abandoned |
| `DECLINED` | `APPROVED` | Nueva sesión KYC aprobada |
| `EXPIRED` | `APPROVED` | Nueva sesión KYC aprobada |
| `ABANDONED` | `APPROVED` | Nueva sesión KYC aprobada |

### Transiciones BLOQUEADAS

| De | A | Razón |
|----|----|-------|
| `APPROVED` | cualquier otro | CRIT-03: un usuario verificado NO puede des-verificarse |

---

## 🛡️ Control de Campos

### Campos que controla el USUARIO

| Campo | Endpoint | Notas |
|-------|----------|-------|
| `avatar_url` | `POST /users/avatar` | ⛔ Bloqueado si `avatar_verified=True` (CRIT-02) |
| `full_name` | `PATCH /auth/me` | Libre |
| `email`, `phone`, `wallet_address` | Endpoints de cambio | Requieren token de confirmación |

### Campos que controla EXCLUSIVAMENTE el SISTEMA

| Campo | Quién escribe | Notas |
|-------|--------------|-------|
| `avatar_verified_url` | **Solo webhook Didit** | Inmutable desde API pública (CRIT-01) |
| `avatar_verified` | **Solo webhook Didit** | Se activa cuando el portrait KYC se sube a Cloudinary |
| `is_verified` | **Solo webhook Didit** | Nunca desde frontend |
| `kyc_status` | **Solo webhook Didit** | Máquina de estados (ver arriba) |
| `didit_session_id` | `POST /verification/create` + webhook | Limpiado por el webhook al finalizar |
| `verified_at` | **Solo webhook Didit (Approved)** | Timestamp UTC del momento de verificación |
| `cedula_locked` | **Solo backend** | Se activa al completar perfil |

---

## 🔁 Idempotencia del Webhook (HIGH-01)

Didit puede reenviar webhooks. Para evitar doble procesamiento:

1. Cada webhook recibido se consulta contra `kyc_webhook_events`
2. Si existe un registro con el mismo `(session_id, status)` → se devuelve `200 { duplicate: true }` sin modificar estado
3. Si no existe → se procesa y se inserta en `kyc_webhook_events`

```
webhook recibido
      │
      ▼
¿(session_id, status) en kyc_webhook_events?
      │
   ┌──┴──┐
   Sí     No
   │      │
   ▼      ▼
200       Procesar
duplicate  │
           ▼
      Insertar en
   kyc_webhook_events
           │
           ▼
         200
```

---

## 🖼️ Protección del Avatar Verificado

### Separación de campos (CRIT-01)

| Campo | Propósito | Modificable por |
|-------|-----------|-----------------|
| `avatar_url` | Avatar público del perfil | Usuario (si no verificado) |
| `avatar_verified_url` | Foto del KYC (Didit) | **Solo sistema** |
| `avatar_verified` | Flag: ¿tiene foto KYC? | **Solo sistema** |

### Reglas

1. Cuando Didit aprueba: `avatar_verified_url` = foto de Cloudinary, `avatar_url` se sincroniza
2. Cuando el usuario sube foto manual: solo `avatar_url` cambia
3. Si `avatar_verified=True`: `POST /users/avatar` devuelve **403**
4. `avatar_verified_url` no aparece en ningún schema de request público

---

## 🔑 Autenticación del Webhook (HIGH-04)

**Solo HMAC-SHA256. Sin fallbacks.**

- Header requerido: `X-Signature-V2` (hex digest, sin prefijo)
- Header requerido: `X-Timestamp` (Unix timestamp, ±300s de tolerancia)
- El body se canonicaliza con `shorten_floats()` → `json.dumps(sort_keys=True, separators=(",", ":"))`
- Sin `X-Signature-V2` o `X-Timestamp` → **401**
- `x-api-key` como fallback → **ELIMINADO** (HIGH-04)

---

## 🔁 Procedimiento de Re-verificación por Soporte

Para re-verificar manualmente a un usuario (soporte/admin):

```sql
-- Paso 1: Resetear estado KYC
UPDATE users SET
    kyc_status = 'PENDING',
    is_verified = FALSE,
    avatar_verified = FALSE,
    avatar_verified_url = NULL,
    didit_session_id = NULL,
    verified_at = NULL
WHERE id = <user_id>;

-- Paso 2: El usuario inicia nuevo KYC desde el frontend
-- POST /api/v1/verification/create

-- Paso 3: Completar flujo normal
```

> ⚠️ **Pendiente:** Crear endpoint `POST /admin/users/{id}/reset-kyc` con log de auditoría (MED-02).

---

## 🧪 Suite de Tests

```bash
pytest tests/verification/test_kyc_security.py -v
```

**24 tests en 6 categorías:**

| Clase | Tests | Qué cubre |
|-------|-------|-----------|
| `TestAvatarProtection` | 3 | CRIT-01, CRIT-02 |
| `TestWebhookIdempotency` | 3 | HIGH-01 |
| `TestKycStateMachine` | 4 | CRIT-03, Cloudinary failure |
| `TestWebhookSecurity` | 8 | HIGH-04 (HMAC, timestamps, API key removed) |
| `TestKycSessionManagement` | 3 | HIGH-03 |
| `TestKycStatusEndpoint` | 3 | GET /status consistency |

---

## 📋 Checklist Pre-Producción

- [x] CRIT-01: `avatar_verified_url` separado de `avatar_url`
- [x] CRIT-02: `POST /users/avatar` bloqueado para verificados
- [x] CRIT-03: APPROVED nunca transiciona a DECLINED
- [x] HIGH-01: Idempotencia de webhooks (`kyc_webhook_events`)
- [x] HIGH-02: Logs de cambio de avatar (audit_log)
- [x] HIGH-03: Reutilización de sesiones KYC pendientes
- [x] HIGH-04: Solo HMAC, sin fallback API Key
- [x] `kyc_status` como máquina de estados explícita
- [x] 24 tests automatizados
- [ ] MED-01: Almacenar documentos del KYC (cédula/pasaporte)
- [ ] MED-02: Endpoint admin `POST /admin/users/{id}/reset-kyc`
- [ ] MED-03: `public_id` con timestamp para evitar sobrescritura
- [ ] Configurar `DIDIT_WEBHOOK_SECRET` en Railway
- [ ] Configurar IP whitelist de Didit en firewall (si aplica)
