from datetime import datetime

from pydantic import BaseModel


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
    worker_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    updated_at: datetime
    dispute_reason: str | None = None
    dispute_by: str | None = None
    disputed_at: datetime | None = None
    review_requested_at: datetime | None = None
    timeout_at: datetime | None = None
    completion_code: str | None = None
    correction_count: int = 0
    correction_note: str | None = None
    evidence_images: str | None = None  # JSON array de fotos

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
    images: list[str] = []


class CorrectionRequest(BaseModel):
    note: str  # Qué falta corregir
    images: list[str] = []


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
