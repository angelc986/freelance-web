from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    cedula = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    google_id = Column(String, nullable=True, index=True)
    role = Column(String, default="worker")  # worker o contractor
    is_admin = Column(Boolean, default=False)
    wallet_address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    balance = Column(Float, default=0.0)  # Saldo en USDT
    rating_avg = Column(Float, default=0.0)
    avatar_url = Column(String, nullable=True)
    avatar_verified = Column(Boolean, default=False)
    cedula_locked = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    didit_session_id = Column(String, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())