from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String(500), nullable=True)
    status = Column(String(20), default="pending")  # pending, accepted, rejected, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    # Relaciones
    job = relationship("Job", backref="applications")
    worker = relationship("User", foreign_keys=[worker_id])
