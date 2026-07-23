from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    endpoint = Column(String, nullable=False, unique=True)
    auth = Column(String, nullable=False)
    p256dh = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
