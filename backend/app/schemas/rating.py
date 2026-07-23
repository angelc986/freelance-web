from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    rating: float = Field(..., ge=1, le=5, description="Calificación del 1 al 5")
    comment: str | None = None


class RatingResponse(BaseModel):
    id: int
    job_id: int
    rater_id: int
    rated_id: int
    rating: float
    comment: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
