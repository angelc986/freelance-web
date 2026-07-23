from datetime import datetime

from pydantic import BaseModel


class ApplicationCreate(BaseModel):
    message: str | None = None


class WorkerInfo(BaseModel):
    """Info básica del worker que se muestra al contractor"""

    id: int
    full_name: str
    rating_avg: float

    class Config:
        from_attributes = True


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    worker_id: int
    message: str | None = None
    status: str
    created_at: datetime
    worker: WorkerInfo | None = None

    class Config:
        from_attributes = True
