from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    dispute_reason = Column(String(1000), nullable=True)
    review_requested_at = Column(DateTime, nullable=True)  # Cuándo pidió completar el worker
    completion_code = Column(String(6), nullable=True)  # Código de verificación para completar

    client = relationship("User", foreign_keys=[client_id])
    worker = relationship("User", foreign_keys=[worker_id])