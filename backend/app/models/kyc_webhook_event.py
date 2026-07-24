"""Track processed Didit webhook events for idempotency (HIGH-01)."""

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class KycWebhookEvent(Base):
    __tablename__ = "kyc_webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    status = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False, index=True)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
