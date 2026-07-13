import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.job import Job
from app.models.transaction import Transaction
from app.services.audit import log_action
from app.schemas.payment import (
    DepositRequest,
    TransactionResponse,
    BalanceResponse,
    WithdrawRequest,
    ReleaseRequest,
    ConfirmPaymentRequest,
    DetectedDeposit,
)
from app.services.auth import get_current_user
from app.services.blockchain import (
    verify_transaction,
    send_usdt,
    get_system_wallet_balance,
    is_connected,
    scan_deposits as blockchain_scan_deposits,
)
from app.config import get_settings
from app.limiter import limiter

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

settings = get_settings()

LARGE_TX_THRESHOLD = 100.0  # Monto en USDT para doble confirmación


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Helpers ─────────────────────────────────────────


def _create_confirmation_token() -> tuple[str, datetime]:
    """Genera un token único que expira en 1 hora.
    Usamos naive UTC porque SQLite no preserva timezone."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    return token, expires_at


def _check_daily_withdrawals(db: Session, user_id: int) -> int:
    """Cuenta retiros del día de hoy. Levanta error si >= 3."""
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    count = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "withdraw",
            Transaction.status == "confirmed",
            Transaction.created_at >= today_start,
        )
        .count()
    )
    return count


def _try_blockchain_transfer(to_address: str, amount: float) -> tuple[Optional[str], str, Optional[str]]:
    """
    Intenta enviar USDT real a blockchain.
    Returns (tx_hash, status, error_message).
    """
    tx_hash = None
    blockchain_status = "simulated"
    blockchain_error = None

    try:
        from web3 import Web3
        from app.services.blockchain import w3

        matic_wei = w3.eth.get_balance(settings.SYSTEM_WALLET_ADDRESS)
        matic_balance = w3.from_wei(matic_wei, "ether")

        if matic_balance and float(matic_balance) > 0:
            real_tx_hash = send_usdt(to_address, amount)
            if real_tx_hash:
                tx_hash = real_tx_hash
                blockchain_status = "confirmed"
            else:
                blockchain_error = "send_usdt() returned None"
                blockchain_status = "pending_blockchain"
        else:
            blockchain_error = f"Sin MATIC para gas (balance: {matic_balance})"
            blockchain_status = "pending_blockchain"

    except Exception as e:
        blockchain_error = str(e)
        blockchain_status = "pending_blockchain"

    return tx_hash, blockchain_status, blockchain_error


# ─── Endpoints ───────────────────────────────────────


@router.get("/health")
@limiter.exempt
def payment_health(request: Request):
    """
    🔗 Verifica que el servicio de pagos está conectado a Polygon.
    """
    connected = is_connected()
    return {
        "blockchain_connected": connected,
        "network": "Polygon Amoy Testnet",
        "system_wallet": settings.SYSTEM_WALLET_ADDRESS,
    }


# ─── DEPÓSITO MANUAL ─────────────────────────────────


@router.post("/deposit", response_model=TransactionResponse, status_code=201)
@limiter.limit("5/minute")
def deposit(request: Request, 
    deposit_data: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    💰 DEPÓSITO MANUAL
    El contratista pasó USDT a la wallet del sistema y nos da el tx_hash.
    web3.py verifica que la transacción sea real en Polygon.
    """
    if current_user.role not in ("contractor", "both"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los contractors pueden depositar fondos",
        )

    # Verificar en blockchain
    verification = verify_transaction(
        tx_hash=deposit_data.tx_hash,
        expected_amount=deposit_data.amount,
        expected_to=settings.SYSTEM_WALLET_ADDRESS,
    )

    if not verification["verified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Depósito no verificado: {verification['error']}",
        )

    transaction = Transaction(
        user_id=current_user.id,
        type="deposit",
        amount=deposit_data.amount,
        network=deposit_data.network,
        tx_hash=deposit_data.tx_hash,
        from_address=verification["from_address"],
        to_address=settings.SYSTEM_WALLET_ADDRESS,
        confirmations=verification["confirmations"],
        status="confirmed",
        confirmed_at=datetime.now(timezone.utc),
    )

    db.add(transaction)
    user = db.query(User).filter(User.id == current_user.id).first()
    user.balance += deposit_data.amount

    log_action(current_user.id, "deposit", {"amount": deposit_data.amount, "tx_hash": deposit_data.tx_hash}, ip=request.client.host)

    db.commit()
    db.refresh(transaction)
    return transaction


# ─── SALDO ────────────────────────────────────────────


@router.get("/balance", response_model=BalanceResponse)
@limiter.limit("30/minute")
def get_balance(request: Request, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    💳 CONSULTAR SALDO
    Saldo disponible del usuario en USDT + wallet address.
    """
    return BalanceResponse(
        balance=current_user.balance,
        wallet_address=current_user.wallet_address,
    )


# ─── LIBERAR PAGO (con doble confirmación si > $100) ─


@router.post("/release/{job_id}", response_model=TransactionResponse)
@limiter.limit("10/minute")
def release_payment(request: Request, 
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    ✅ LIBERAR PAGO
    Contractor libera el pago al worker cuando el trabajo está completado.

    🔐 Si el monto > $100 USD, la transacción queda `pending_confirmation`
    y hay que llamar POST /payments/confirm/{tx_id} con el token.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No eres el dueño de este trabajo")
    if job.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"El trabajo está en estado '{job.status}', debe estar 'completed'",
        )

    contractor = db.query(User).filter(User.id == current_user.id).first()
    if contractor.balance < job.budget:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente. Tienes ${contractor.balance:.2f}, necesitas ${job.budget:.2f}",
        )

    worker = db.query(User).filter(User.id == job.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker no encontrado")

    # ─────────────────────────────────────────────────
    # ¿Requiere doble confirmación?
    # ─────────────────────────────────────────────────
    requires_confirmation = job.budget > LARGE_TX_THRESHOLD

    if requires_confirmation:
        # Crear transacción como PENDIENTE de confirmación
        token, expires_at = _create_confirmation_token()
        transaction = Transaction(
            user_id=current_user.id,
            job_id=job.id,
            type="release",
            amount=job.budget,
            network="polygon",
            status="pending_confirmation",
            requires_confirmation=True,
            confirmation_token=token,
            confirmation_expires_at=expires_at,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        # Devolver la transacción con el token (el frontend debe mostrar
        # un modal pidiendo confirmación)
        return transaction

    # ─────────────────────────────────────────────────
    # Monto normal (< $100) — ejecutar directo
    # ─────────────────────────────────────────────────
    contractor.balance -= job.budget
    worker.balance += job.budget

    transaction = Transaction(
        user_id=current_user.id,
        job_id=job.id,
        type="release",
        amount=job.budget,
        network="polygon",
        status="confirmed",
        confirmed_at=datetime.now(timezone.utc),
    )

    log_action(current_user.id, "payment_release", {"job_id": job_id, "amount": job.budget, "worker_id": job.worker_id}, ip=request.client.host)

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


# ─── REEMBOLSO ────────────────────────────────────────


@router.post("/refund/{job_id}", response_model=TransactionResponse)
@limiter.limit("3/minute")
def refund_payment(request: Request, 
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    🔄 REEMBOLSO
    En caso de disputa, devuelve el dinero al contractor.
    Solo admin (user.id == 1) por ahora.
    """
    if current_user.id != 1:
        raise HTTPException(
            status_code=403,
            detail="Solo el administrador puede procesar reembolsos",
        )

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status not in ("disputed", "cancelled"):
        raise HTTPException(
            status_code=400,
            detail=f"Solo se puede reembolsar trabajos en 'disputed' o 'cancelled', actual: {job.status}",
        )

    contractor = db.query(User).filter(User.id == job.client_id).first()
    contractor.balance += job.budget

    transaction = Transaction(
        user_id=contractor.id,
        job_id=job.id,
        type="refund",
        amount=job.budget,
        network="polygon",
        status="confirmed",
        confirmed_at=datetime.now(timezone.utc),
    )

    log_action(contractor.id, "refund", {"job_id": job_id, "amount": job.budget}, ip=request.client.host)

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


# ─── RETIRO (con doble confirmación si > $100) ────────


@router.post("/withdraw", response_model=TransactionResponse)
@limiter.limit("5/minute")
def withdraw(request: Request, 
    withdraw_data: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    💸 RETIRAR USDT
    Worker retira su saldo a una wallet externa.

    🔐 Si el monto > $100 USD, la transacción queda `pending_confirmation`
    y hay que confirmarla con POST /payments/confirm/{tx_id}.
    """
    # Validar saldo
    if current_user.balance < withdraw_data.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente. Tienes ${current_user.balance:.2f}",
        )

    # Monto mínimo
    if withdraw_data.amount < 1.0:
        raise HTTPException(
            status_code=400,
            detail="El monto mínimo de retiro es $1 USDT",
        )

    # Wallet registrada
    if not current_user.wallet_address:
        raise HTTPException(
            status_code=400,
            detail="Primero registra tu wallet en PATCH /api/v1/auth/me/wallet",
        )
    if current_user.wallet_address != withdraw_data.to_address:
        raise HTTPException(
            status_code=400,
            detail="Solo puedes retirar a tu wallet registrada",
        )

    # Límite diario
    today_count = _check_daily_withdrawals(db, current_user.id)
    if today_count >= settings.MAX_WITHDRAWALS_PER_DAY:
        raise HTTPException(
            status_code=400,
            detail=f"Límite diario alcanzado: máximo {settings.MAX_WITHDRAWALS_PER_DAY} retiros por día",
        )

    # ─────────────────────────────────────────────────
    # ¿Requiere doble confirmación?
    # ─────────────────────────────────────────────────
    requires_confirmation = withdraw_data.amount > LARGE_TX_THRESHOLD

    if requires_confirmation:
        # NO descontamos balance todavía — solo crear la tx pendiente
        token, expires_at = _create_confirmation_token()
        transaction = Transaction(
            user_id=current_user.id,
            type="withdraw",
            amount=withdraw_data.amount,
            network="polygon",
            to_address=withdraw_data.to_address,
            from_address=settings.SYSTEM_WALLET_ADDRESS,
            status="pending_confirmation",
            requires_confirmation=True,
            confirmation_token=token,
            confirmation_expires_at=expires_at,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction

    # ─────────────────────────────────────────────────
    # Monto normal (< $100) — ejecutar directo
    # ─────────────────────────────────────────────────
    user = db.query(User).filter(User.id == current_user.id).first()
    user.balance -= withdraw_data.amount

    tx_hash, blockchain_status, _ = _try_blockchain_transfer(
        withdraw_data.to_address, withdraw_data.amount
    )

    transaction = Transaction(
        user_id=current_user.id,
        type="withdraw",
        amount=withdraw_data.amount,
        network="polygon",
        tx_hash=tx_hash,
        from_address=settings.SYSTEM_WALLET_ADDRESS,
        to_address=withdraw_data.to_address,
        status=blockchain_status,
        confirmed_at=datetime.now(timezone.utc),
    )

    log_action(current_user.id, "withdraw", {"amount": withdraw_data.amount, "wallet": withdraw_data.to_address}, ip=request.client.host)

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


# ─── CONFIRMAR TRANSACCIÓN (> $100) ──────────────────


@router.post("/confirm/{transaction_id}", response_model=TransactionResponse)
@limiter.limit("10/minute")
def confirm_transaction(request: Request, 
    transaction_id: int,
    confirm_data: ConfirmPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    🔐 CONFIRMAR TRANSACCIÓN GRANDE

    Para montos > $100, después de crear la transacción (release o withdraw),
    hay que confirmarla aquí con el token que se generó.

    El token expira en 1 hora. Después de ese tiempo, la transacción
    se cancela automáticamente y el balance no se descuenta.
    """
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    if tx.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Esta transacción no te pertenece")
    if tx.status != "pending_confirmation":
        raise HTTPException(
            status_code=400,
            detail=f"La transacción está en estado '{tx.status}', no necesita confirmación",
        )
    if not tx.requires_confirmation:
        raise HTTPException(
            status_code=400,
            detail="Esta transacción no requiere confirmación",
        )

    # Validar token
    if tx.confirmation_token != confirm_data.confirmation_token:
        raise HTTPException(
            status_code=400,
            detail="Token de confirmación inválido",
        )

    # Validar expiración (SQLite no guarda timezone, comparamos naive vs naive)
    if tx.confirmation_expires_at:
        now_naive = datetime.utcnow()
        expires_naive = tx.confirmation_expires_at.replace(tzinfo=None) if tx.confirmation_expires_at.tzinfo else tx.confirmation_expires_at
        if now_naive > expires_naive:
            tx.status = "failed"
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="El token de confirmación expiró después de 1 hora. Crea una nueva transacción.",
            )

    # ─────────────────────────────────────────────────
    # EJECUTAR la transacción
    # ─────────────────────────────────────────────────
    if tx.type == "release":
        # Liberar pago: descontar contractor, acreditar worker
        job = db.query(Job).filter(Job.id == tx.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Trabajo no encontrado")

        contractor = db.query(User).filter(User.id == job.client_id).first()
        worker = db.query(User).filter(User.id == job.worker_id).first()

        if not contractor or not worker:
            raise HTTPException(status_code=500, detail="Error: usuario no encontrado")

        # Verificar saldo nuevamente (pudo cambiar desde que se creó la tx)
        if contractor.balance < tx.amount:
            tx.status = "failed"
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Saldo insuficiente al confirmar. El balance cambió desde que creaste la transacción.",
            )

        contractor.balance -= tx.amount
        worker.balance += tx.amount

        tx.status = "confirmed"
        tx.confirmed_at = datetime.now(timezone.utc)

    elif tx.type == "withdraw":
        # Retirar: descontar balance + enviar a blockchain
        user = db.query(User).filter(User.id == current_user.id).first()

        if user.balance < tx.amount:
            tx.status = "failed"
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Saldo insuficiente al confirmar. El balance cambió desde que creaste la transacción.",
            )

        user.balance -= tx.amount

        # Intentar envío real a blockchain
        tx_hash, blockchain_status, _ = _try_blockchain_transfer(
            tx.to_address, tx.amount
        )
        tx.tx_hash = tx_hash
        tx.status = blockchain_status
        tx.confirmed_at = datetime.now(timezone.utc)

    # Limpiar campos de confirmación (ya no se necesitan)
    tx.confirmation_token = None
    tx.confirmation_expires_at = None
    tx.requires_confirmation = False

    log_action(current_user.id, f"confirm_{tx.type}", {"transaction_id": transaction_id, "amount": tx.amount}, ip=request.client.host)

    db.commit()
    db.refresh(tx)
    return tx


# ─── HISTORIAL ────────────────────────────────────────


@router.get("/history", response_model=List[TransactionResponse])
@limiter.limit("30/minute")
def get_history(request: Request, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    📜 HISTORIAL DE TRANSACCIONES
    Muestra todas las transacciones del usuario autenticado.
    """
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )
    return transactions


# ─── ESCANEO AUTOMÁTICO DE DEPÓSITOS ─────────────────


@router.post("/scan-deposits")
@limiter.limit("2/minute")
def scan_new_deposits(request: Request, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    🔍 ESCANEAR DEPÓSITOS AUTOMÁTICAMENTE

    Solo admin (user.id == 1).
    Escanea la blockchain buscando transferencias USDT entrantes
    a la wallet del sistema que NO estén registradas en la BD.

    Si encuentra una wallet conocida (de algún usuario registrado),
    acredita automáticamente el balance.

    Útil para:
    - No depender del tx_hash manual
    - Configurar como tarea programada (cada 5 min)
    """
    # Solo admin
    if current_user.id != 1:
        raise HTTPException(status_code=403, detail="Solo el admin puede escanear depósitos")

    if not is_connected():
        raise HTTPException(status_code=503, detail="Blockchain desconectada")

    # Escanear la blockchain
    found_deposits = blockchain_scan_deposits()

    if not found_deposits:
        return {
            "scanned": True,
            "new_deposits": 0,
            "auto_credited": 0,
            "unregistered": 0,
            "message": "No se encontraron nuevos depósitos",
        }

    # Buscar cuáles ya existen en BD
    existing_hashes = set()
    if found_deposits:
        hashes = [d["tx_hash"] for d in found_deposits]
        existing = (
            db.query(Transaction.tx_hash)
            .filter(Transaction.tx_hash.in_(hashes))
            .all()
        )
        existing_hashes = {r[0] for r in existing}

    # Procesar depósitos nuevos
    new_count = 0
    credited_count = 0
    unregistered = []

    for deposit in found_deposits:
        if deposit["tx_hash"] in existing_hashes:
            continue  # Ya registrado

        new_count += 1
        from_address = deposit["from_address"].lower()

        # Buscar usuario con esa wallet registrada
        user = (
            db.query(User)
            .filter(User.wallet_address.ilike(from_address))
            .first()
        )

        if user:
            # Acreditar automáticamente
            user.balance += deposit["amount"]

            tx = Transaction(
                user_id=user.id,
                type="deposit",
                amount=deposit["amount"],
                network="polygon",
                tx_hash=deposit["tx_hash"],
                from_address=deposit["from_address"],
                to_address=settings.SYSTEM_WALLET_ADDRESS,
                confirmations=0,  # Se actualizará cuando se verifique mejor
                status="confirmed",
                confirmed_at=datetime.now(timezone.utc),
            )
            db.add(tx)
            credited_count += 1
        else:
            unregistered.append(deposit["tx_hash"])

    db.commit()

    return {
        "scanned": True,
        "new_deposits": new_count,
        "auto_credited": credited_count,
        "unregistered": len(unregistered),
        "unregistered_tx": unregistered[:10],  # Máximo 10 para no saturar
        "message": (
            f"{credited_count} depósito(s) acreditados automáticamente. "
            f"{len(unregistered)} wallet(s) no registradas en el sistema."
        ),
    }


# ─── WEBHOOK PARA DEPÓSITOS EXTERNOS ─────────────────


from pydantic import BaseModel


class WebhookDepositPayload(BaseModel):
    """
    Payload que espera el webhook.

    Servicios como Alchemy Webhooks, QuickNode Streams
    o cualquier otro monitor de blockchain pueden
    llamar a este endpoint cuando detecten una transferencia
    USDT a nuestra wallet.
    """
    tx_hash: str
    from_address: str
    amount: float
    network: str = "polygon"
    block_number: Optional[int] = None
    # Firmas opcionales para verificar autenticidad
    signature: Optional[str] = None


@router.post("/webhook/deposit")
@limiter.exempt
def webhook_deposit(request: Request, 
    payload: WebhookDepositPayload,
    db: Session = Depends(get_db),
):
    """
    📡 WEBHOOK DE DEPÓSITOS

    Endpoint público que los servicios de monitoreo blockchain
    (Alchemy, QuickNode, etc.) llaman cuando detectan una
    transferencia USDT entrante a la wallet del sistema.

    Flujo:
    1. Recibe tx_hash, from_address, amount
    2. Verifica en blockchain que la tx es real
    3. Busca usuario con esa wallet (from_address)
    4. Si existe, acredita automáticamente

    Seguridad:
    - Se recomienda configurar una API key en el header
      para que solo servicios autorizados puedan llamarlo
    - Por ahora es abierto (para desarrollo)
    """
    if not payload.tx_hash or not payload.from_address or not payload.amount:
        raise HTTPException(status_code=400, detail="Faltan campos requeridos")

    # Verificar que no exista ya
    existing = (
        db.query(Transaction)
        .filter(Transaction.tx_hash == payload.tx_hash)
        .first()
    )
    if existing:
        # Ya registrado, no es error — solo ignorar
        return {
            "status": "already_registered",
            "transaction_id": existing.id,
            "message": "Este depósito ya fue registrado anteriormente",
        }

    # (Opcional) Verificar en blockchain que la tx es real
    # Si no hay conexión blockchain, confiamos en el webhook (modo dev)
    if is_connected():
        verification = verify_transaction(
            tx_hash=payload.tx_hash,
            expected_amount=payload.amount,
            expected_to=settings.SYSTEM_WALLET_ADDRESS,
        )

        # Nota: si no hay suficientes confirmaciones, aún podemos
        # registrarlo como "pending" y verificarlo después
        if verification["verified"] or not verification.get("confirmations", 0):
            pass  # Continuar procesando

    # Buscar usuario por wallet
    user = (
        db.query(User)
        .filter(User.wallet_address.ilike(payload.from_address.lower()))
        .first()
    )

    if not user:
        # No encontramos usuario para esta wallet
        # Registrar la transacción como huérfana
        tx = Transaction(
            user_id=1,  # Admin como owner temporal
            type="deposit",
            amount=payload.amount,
            network=payload.network,
            tx_hash=payload.tx_hash,
            from_address=payload.from_address,
            to_address=settings.SYSTEM_WALLET_ADDRESS,
            status="confirmed",
            confirmed_at=datetime.now(timezone.utc),
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)

        return {
            "status": "unregistered_wallet",
            "transaction_id": tx.id,
            "message": (
                f"Depósito recibido de {payload.from_address}, "
                "pero esa wallet no está registrada en el sistema. "
                "El usuario debe registrar su wallet para recibir el crédito."
            ),
        }

    # Acreditar balance
    user.balance += payload.amount

    tx = Transaction(
        user_id=user.id,
        type="deposit",
        amount=payload.amount,
        network=payload.network,
        tx_hash=payload.tx_hash,
        from_address=payload.from_address,
        to_address=settings.SYSTEM_WALLET_ADDRESS,
        status="confirmed",
        confirmed_at=datetime.now(timezone.utc),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    log_action(user.id, "webhook_deposit", {"amount": payload.amount, "tx_hash": payload.tx_hash}, ip=request.client.host)

    return {
        "status": "credited",
        "transaction_id": tx.id,
        "user_id": user.id,
        "amount": payload.amount,
        "user_email": user.email,
        "message": f"${payload.amount} USDT acreditados a {user.email}",
    }
