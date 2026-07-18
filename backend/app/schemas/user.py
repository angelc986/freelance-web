from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: str
    phone: str
    full_name: str
    cedula: str
    password: str
    role: str = "worker"  # worker por defecto

class UserLogin(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    cedula: str | None = None


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
    wallet_address: Optional[str] = None
    is_active: bool
    balance: float = 0.0
    rating_avg: float
    avatar_url: str | None = None
    avatar_verified: bool = False
    cedula_locked: bool = False
    is_verified: bool = False

    class Config:
        from_attributes = True