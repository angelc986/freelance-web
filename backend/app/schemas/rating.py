from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RatingCreate(BaseModel):
    rating: float = Field(..., ge=1, le=5, description="Calificación del 1 al 5")
    comment: Optional[str] = None


class RatingResponse(BaseModel):
    id: int
    job_id: int
    rater_id: int
    rated_id: int
    rating: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
