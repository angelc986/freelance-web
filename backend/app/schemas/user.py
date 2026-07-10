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

class UserResponse(BaseModel):
    id: int
    email: str
    phone: str
    full_name: str
    cedula: str
    role: str
    wallet_address: Optional[str] = None
    is_active: bool
    rating_avg: float

    class Config:
        from_attributes = True