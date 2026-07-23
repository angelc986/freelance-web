from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(2000), nullable=False)
    category = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    budget = Column(Float, nullable=False)
    duration = Column(String(100), nullable=False)
    status = Column(String(20), default="open")
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
    dispute_reason = Column(String(1000), nullable=True)
    dispute_by = Column(
        String(20), nullable=True
    )  # "contractor" o "worker" — quién abrió la disputa
    disputed_at = Column(DateTime, nullable=True)  # Cuándo se abrió la disputa (24h lock)
    review_requested_at = Column(DateTime, nullable=True)  # Cuándo pidió completar el worker
    timeout_at = Column(
        DateTime, nullable=True
    )  # Timeout para auto-release (72h después de review_pending)
    completion_code = Column(String(6), nullable=True)  # Código de verificación para completar
    correction_count = Column(Integer, default=0)  # Veces que se pidió corrección
    correction_note = Column(String(1000), nullable=True)  # Nota de qué falta corregir
    evidence_images = Column(Text, nullable=True)  # JSON array de URLs de fotos subidas

    client = relationship("User", foreign_keys=[client_id])
    worker = relationship("User", foreign_keys=[worker_id])
