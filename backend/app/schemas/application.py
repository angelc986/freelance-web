from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ApplicationCreate(BaseModel):
    message: Optional[str] = None


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
    message: Optional[str] = None
    status: str
    created_at: datetime
    worker: Optional[WorkerInfo] = None

    class Config:
        from_attributes = True
