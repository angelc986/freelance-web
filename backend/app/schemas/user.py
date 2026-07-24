from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    """For initial registration - only needs email, password, role"""

    email: str
    password: str
    role: str = "worker"


class CompleteProfileRequest(BaseModel):
    """For the second step - complete user data"""

    full_name: str
    phone: str
    cedula: str
    address: str
    profession: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    cedula: str | None = None


class RequestChangeRequest(BaseModel):
    new_email: str | None = None
    new_phone: str | None = None
    new_wallet: str | None = None


class ConfirmChangeRequest(BaseModel):
    token: str
    new_email: str | None = None
    new_phone: str | None = None
    new_wallet: str | None = None


class UpdateWalletRequest(BaseModel):
    wallet_address: str


class UserResponse(BaseModel):
    id: int
    email: str
    phone: str
    full_name: str
    cedula: str
    role: str
    is_admin: bool = False
    wallet_address: str | None = None
    is_active: bool
    balance: float = 0.0
    held_balance: float = 0.0
    available_balance: float = 0.0
    rating_avg: float
    profile_completed: bool = False
    address: str | None = None
    profession: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    avatar_url: str | None = None
    avatar_verified: bool = False
    cedula_locked: bool = False
    is_verified: bool = False
    verified_at: datetime | None = None
    last_login_at: datetime | None = None
    email_notifications: bool = True
    push_subscription: str | None = None

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    """Request para solicitar reset de contraseña"""
    email: str


class ResetPasswordRequest(BaseModel):
    """Request para ejecutar el reset con token"""
    token: str
    new_password: str
