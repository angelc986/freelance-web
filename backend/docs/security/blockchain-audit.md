# 🔗 Blockchain Security Audit — Fase 10.5

> **Fecha:** 2026-07-24  
> **Red:** Polygon Amoy Testnet  
> **Contrato USDT:** `0xE9725cb7e239a2e282C200b185861de07F2568F9`  
> **Wallet sistema:** `0x31EF80A1D976545F5259253787e944f5A835C7c0`

---

## 📊 Arquitectura Actual

```
POST /deposit           POST /withdraw          POST /release/{job_id}
      │                       │                         │
      ▼                       ▼                         ▼
verify_transaction()    deduct balance             DB: held_balance → balance
  (web3 + tx data)      _try_blockchain_transfer()    (SOLO DB, sin blockchain)
      │                       │
      ▼                       ▼
DB: balance += amount   send_usdt() → Polygon
                           (Account.sign_transaction)
                                │
                                ▼
                           tx_hash → DB

POST /scan-deposits (admin)      POST /webhook/deposit (public!)
      │                                    │
      ▼                                    ▼
scan_deposits()                      Acredita balance
  (event Transfer filter)            (sin verificacion blockchain!)
```

### Pila tecnológica

| Componente | Tecnología |
|------------|-----------|
| Conexión | `web3.py` vía HTTPProvider |
| Red | Polygon Amoy (PoA con ExtraDataToPOAMiddleware) |
| USDT | ERC-20 con ABI manual (transfer, balanceOf, decimals, Transfer event) |
| Firmado | `eth_account.Account.from_key(private_key)` |
| Gas | 100000 fijo (no estimate_gas) |
| Confirmaciones | MIN_CONFIRMATIONS = 12 |

---

## 🔴 HALLAZGOS CRÍTICOS

### BLC-01: `verify_transaction` no valida transferencias ERC-20 correctamente

**Archivo:** `app/services/blockchain.py:verify_transaction()`  
**Riesgo:** Un atacante envía una tx a cualquier contrato con el monto correcto → el sistema la acepta como depósito válido.

```python
# Línea ~175
tx_to = tx.get("to", "").lower()
expected = Web3.to_checksum_address(expected_to).lower()
if tx_to != expected:
    result["error"] = f"Destino incorrecto..."
```

**Problema:** Una transferencia ERC-20 tiene `tx.to = USDT_CONTRACT_ADDRESS` (no la wallet destino). El destinatario real está en los parámetros `transfer(to, amount)` dentro del `input data` o en los event logs del receipt.

Esto hace que `verify_transaction()` **siempre falle** para depósitos USDT legítimos (el `tx.to` es el contrato USDT, no la wallet del sistema), O si la wallet del sistema coincide con el contrato USDT por casualidad, **siempre acepte** cualquier transacción al contrato.

**Severidad:** 🔴 CRÍTICO — Rompe la validación de depósitos.

---

### BLC-02: `release_payment` no involucra blockchain

**Archivo:** `app/routers/payments.py:release_payment()`  
**Riesgo:** Si la wallet del sistema es drenada, todos los balances internos dejan de tener respaldo.

```python
contractor.held_balance -= job.budget
worker.balance += job.budget
```

**Problema:** El USDT nunca sale de la wallet del sistema. Los balances son puramente contabilidad interna. Esto es un **modelo de libro mayor interno** (como Binance o cualquier exchange). No es necesariamente incorrecto, pero implica:

- El sistema es **custodial**: todo el USDT está en una sola wallet.
- Si la private key se compromete → pérdida total de fondos de todos los usuarios.
- No hay prueba on-chain de que el pago se realizó.

**Severidad:** 🟠 ALTO — Riesgo estructural. Opciones de mitigación:
1. Mantener modelo custodial + multisig/HSM para la wallet del sistema.
2. Migrar a modelo no-custodial (cada release = tx on-chain).

---

## 🟠 HALLAZGOS ALTOS

### BLC-03: Balance descontado antes de confirmación blockchain

**Archivo:** `app/routers/payments.py:withdraw()` + `confirm_transaction()`  
**Riesgo:** Si la tx blockchain falla pero la DB ya descontó, el usuario pierde fondos.

```python
user.balance -= withdraw_data.amount          # DB primero
tx_hash, blockchain_status, _ = _try_blockchain_transfer(...)  # Blockchain después
```

**Problema:** Si `send_usdt()` retorna None (RPC caído, gas insuficiente, nonce conflict), el balance YA fue descontado. El estado queda `pending_blockchain` sin fondos.

**Fix:** Usar patrón "blockchain primero":
```python
tx_hash = send_usdt(...)   # Blockchain primero
if tx_hash:
    user.balance -= amount # DB después (solo si éxito)
```

O patrón "two-phase": descontar → enviar → si falla → revertir.

**Severidad:** 🟠 ALTO — Riesgo de pérdida de fondos.

---

### BLC-04: Webhook de depósitos sin autenticación

**Archivo:** `app/routers/payments.py:webhook_deposit()`  
**Riesgo:** Cualquiera puede llamar `POST /payments/webhook/deposit` con datos falsos y acreditarse USDT.

```python
@router.post("/webhook/deposit")
@limiter.exempt           # Sin rate limit
def webhook_deposit(...): # Sin autenticacion
```

El código dice "por ahora es abierto (para desarrollo)". En producción esto es catastrófico.

**Severidad:** 🟠 ALTO — En producción, permite fraude ilimitado.

---

### BLC-05: `verify_transaction` no verifica el monto real en ERC-20

**Archivo:** `app/services/blockchain.py:verify_transaction()`  
**Riesgo:** Un atacante envía 0.01 USDT pero declara 1000 USDT.

```python
result["actual_amount"] = expected_amount  # Simplificado — confía en lo que dice el usuario
```

**Problema:** El código nunca decodifica el `input data` de la transacción para extraer el monto real de la transferencia ERC-20. Confía ciegamente en `expected_amount`.

**Severidad:** 🟠 ALTO — Permite inflar montos de depósito.

---

## 🟡 HALLAZGOS MEDIOS

### BLC-06: `confirmations=0` en scan_deposits

**Archivo:** `app/routers/payments.py:scan_new_deposits()`  
**Riesgo:** Se acreditan depósitos con 0 confirmaciones. Un reorg de blockchain podría revertir la transacción.

`MIN_CONFIRMATIONS = 12` pero el scan acredita con `confirmations=0`.

**Severidad:** 🟡 MEDIO — Riesgo bajo en Polygon (finalidad rápida), pero igual es incorrecto.

---

### BLC-07: Gas fijo sin `estimate_gas`

**Archivo:** `app/services/blockchain.py:send_usdt()`  
**Riesgo:** `"gas": 100000` fijo. Si el gas real es mayor, la tx falla. Si es menor, se desperdicia.

**Severidad:** 🟡 MEDIO — En Polygon el gas es barato, pero es frágil.

---

### BLC-08: Sin nonce management ni reintentos

**Archivo:** `app/services/blockchain.py:send_usdt()`  
**Riesgo:** `get_transaction_count()` puede devolver nonces stale si hay tx pendientes. Sin reintentos, una tx fallida se pierde.

**Severidad:** 🟡 MEDIO — Dos retiros simultáneos pueden causar nonce collision.

---

### BLC-09: `_try_blockchain_transfer` no verifica tx success on-chain

**Archivo:** `app/routers/payments.py:_try_blockchain_transfer()`  
**Riesgo:** Solo verifica que `send_usdt()` devolvió un hash. No espera confirmaciones ni verifica el receipt.

**Severidad:** 🟡 MEDIO — La tx puede ser enviada pero revertir después.

---

## 🟢 BAJO

### BLC-10: Sin logs estructurados de errores blockchain

Los errores de `send_usdt()` y `_try_blockchain_transfer()` se loguean con `logger.error(exc_info=True)` pero sin contexto (user_id, amount, to_address).

### BLC-11: Endpoint `POST /scan-deposits` restringido a admin (user.id == 1)

Esto es frágil — debería usar el sistema de roles existente en vez de hardcodear user_id.

### BLC-12: Sin verificación de checksum en wallet addresses

`Web3.to_checksum_address()` se usa en blockchain.py pero no en la validación de entrada del usuario en auth.py.

---

## 📋 Resumen de Riesgos

| # | Severidad | Hallazgo | Impacto |
|---|-----------|----------|---------|
| BLC-01 | 🔴 CRÍTICO | `verify_transaction` no parsea ERC-20 | Depósitos no se validan |
| BLC-02 | 🟠 ALTO | Modelo custodial sin multisig | Pérdida total si key comprometida |
| BLC-03 | 🟠 ALTO | Balance descontado antes de tx confirmada | Pérdida de fondos del usuario |
| BLC-04 | 🟠 ALTO | Webhook sin auth | Fraude ilimitado |
| BLC-05 | 🟠 ALTO | Monto no verificado en ERC-20 | Inflación de depósitos |
| BLC-06 | 🟡 MEDIO | 0 confirmaciones en scan | Reorg risk |
| BLC-07 | 🟡 MEDIO | Gas fijo 100k | TX frágiles |
| BLC-08 | 🟡 MEDIO | Sin nonce management | Colisiones |
| BLC-09 | 🟡 MEDIO | Sin verificar receipt post-send | TX revertidas |
| BLC-10 | 🟢 BAJO | Logs sin contexto | Debug difícil |
| BLC-11 | 🟢 BAJO | Admin hardcodeado | Frágil |
| BLC-12 | 🟢 BAJO | Sin checksum en input | UX |

---

## 🔐 Verificación de Seguridad de Wallet

| Check | Estado |
|-------|--------|
| Private key en `.env` (no en código) | ✅ |
| `.env` en `.gitignore` | ✅ |
| Private key nunca en logs | ⚠️ `exc_info=True` puede exponerla en tracebacks |
| Private key nunca al frontend | ✅ (solo backend) |
| Wallet address validada con checksum | ⚠️ Solo en blockchain.py, no en auth.py |

---

## 🧪 Tests Existentes

| Archivo | Tests |
|---------|-------|
| `tests/payments/test_deposit.py` | 4 (acceso, auth, campos requeridos) |
| `tests/payments/test_withdraw.py` | 5 (éxito, saldo, wallet, mínimo, auth) |
| `tests/payments/test_balance.py` | 3 (estructura, auth, usuario nuevo) |
| `tests/payments/test_history.py` | 2 (lista vacía, post-release) |
| `tests/payments/test_release.py` | 3 (éxito, no dueño, saldo insuficiente) |

**Cobertura de blockchain real:** 0 tests. Todos los tests existentes asumen que la blockchain no está conectada y operan solo en DB.

---

## 🎯 Recomendación de Prioridad

1. **🔴 BLC-01** — Arreglar `verify_transaction()` para parsear ERC-20 correctamente (decodificar input data o leer event logs).
2. **🟠 BLC-04** — Bloquear webhook público (requerir API key o HMAC).
3. **🟠 BLC-05** — Extraer monto real del input data de la tx ERC-20.
4. **🟠 BLC-03** — Implementar patrón "blockchain primero" en retiros.
5. **🟡 BLC-06/07/08/09** — Mejoras de robustez.
6. **🟠 BLC-02** — Decisión arquitectónica: ¿multisig o non-custodial?
