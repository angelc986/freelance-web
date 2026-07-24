from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    cedula = Column(String, unique=True, nullable=False)
    profile_completed = Column(Boolean, default=False)
    address = Column(String, nullable=True)
    profession = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    password_hash = Column(String, nullable=False)
    google_id = Column(String, nullable=True, index=True)
    role = Column(String, default="worker")  # worker o contractor
    is_admin = Column(Boolean, default=False)
    wallet_address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)  # Email verification status
    email_verification_token = Column(String, nullable=True)  # JWT token for email verification
    balance = Column(Float, default=0.0)  # Saldo TOTAL en USDT (available + held)
    held_balance = Column(Float, default=0.0)  # USDT retenido en trabajos activos (escrow)
    rating_avg = Column(Float, default=0.0)
    avatar_url = Column(String, nullable=True)
    avatar_verified_url = Column(String, nullable=True)  # Solo Didit KYC — inmutable por el usuario
    avatar_verified = Column(Boolean, default=False)
    cedula_locked = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    kyc_status = Column(String, default="PENDING")  # PENDING | APPROVED | DECLINED | EXPIRED | ABANDONED | UNDER_REVIEW
    didit_session_id = Column(String, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    email_notifications = Column(Boolean, default=True)  # Preferencia de email
    push_subscription = Column(String, nullable=True)  # JSON PushSubscription para Web Push
    created_at = Column(DateTime(timezone=True), server_default=func.now())
