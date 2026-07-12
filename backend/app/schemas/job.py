from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class JobCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    budget: float
    duration: str


class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    location: str
    budget: float
    duration: str
    status: str
    client_id: int
    worker_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    dispute_reason: Optional[str] = None
    review_requested_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DisputeRequest(BaseModel):
    reason: str