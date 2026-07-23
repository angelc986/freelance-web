import secrets
from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


def _generate_confirmation_token():
    """Genera un token único de 32 caracteres para doble confirmación."""
    return secrets.token_urlsafe(24)


class Transaction(Base):
    """
    Registro de cada transacción financiera en el sistema.

    Cada depósito, liberación de pago, reembolso o retiro
    queda registrado aquí con su hash de blockchain para auditoría.
    """

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    # ¿Quién? (usuario dueño de esta transacción)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user = relationship("User", backref="transactions")

    # ¿Para qué trabajo? (nullable porque un retiro no tiene job)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)

    # ¿Qué tipo de transacción?
    # deposit       → Contractor mete USDT al sistema
    # release       → Pago liberado al worker (job completado)
    # refund        → Devolución al contractor (disputa)
    # withdraw      → Worker retira USDT a su wallet externa
    type = Column(String(20), nullable=False, index=True)

    # Monto en USDT
    amount = Column(Float, nullable=False)

    # Comisión del sistema (0% por ahora, después definimos)
    fee = Column(Float, default=0.0)

    # ¿En qué red blockchain?
    # polygon  → Polygon (red principal)
    # bep20    → BNB Chain (alternativa)
    network = Column(String(20), default="polygon")

    # Hash de la transacción en blockchain (para auditar)
    tx_hash = Column(String(200), nullable=True, index=True)

    # Direcciones involucradas (para auditoría)
    from_address = Column(String(200), nullable=True)
    to_address = Column(String(200), nullable=True)

    # Número de confirmaciones en la red
    confirmations = Column(Integer, default=0)

    # Estado de la transacción
    # pending              → Esperando confirmación en blockchain
    # pending_confirmation → Esperando doble confirmación del usuario (monto > $100)
    # confirmed            → Verificada y ejecutada
    # failed               → Falló la verificación
    status = Column(String(20), default="pending", index=True)

    # ═══ Doble confirmación para montos grandes ═══
    # Si el monto > $100, la transacción se crea como pending_confirmation
    # y el usuario debe confirmar con el token dentro de 1 hora
    requires_confirmation = Column(Boolean, default=False)
    confirmation_token = Column(String(64), nullable=True)
    confirmation_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Marcas de tiempo
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
