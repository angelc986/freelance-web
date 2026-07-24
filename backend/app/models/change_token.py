from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func

from app.database import Base


class ChangeToken(Base):
    __tablename__ = "change_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, nullable=False)
    token_type = Column(
        String,
        nullable=False,
        default="PASSWORD_RESET",
        comment="PASSWORD_RESET | EMAIL_CHANGE | PHONE_CHANGE | WALLET_CHANGE",
    )
    new_email = Column(String, nullable=True)
    new_phone = Column(String, nullable=True)
    new_wallet = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
