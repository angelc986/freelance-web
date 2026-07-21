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
    latitude: float | None = None
    longitude: float | None = None


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
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    updated_at: datetime
    dispute_reason: Optional[str] = None
    review_requested_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class JobUpdate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    budget: float
    duration: str
    latitude: float | None = None
    longitude: float | None = None

class DisputeRequest(BaseModel):
    reason: str


class ApplicationBrief(BaseModel):
    """Info detallada de un aplicante para mostrar al contratista"""
    id: int
    worker_id: int
    worker_name: str
    worker_rating: float = 0.0
    worker_email: str = ""
    worker_phone: str = ""
    worker_cedula: str = ""
    worker_since: datetime | None = None
    jobs_completed: int = 0
    message: str | None = None
    status: str
    created_at: datetime


class JobWithApplicants(BaseModel):
    """Trabajo con lista de aplicantes"""
    job: JobResponse
    applicants: list[ApplicationBrief]