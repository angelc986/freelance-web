from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("job_id", "rater_id", name="uq_job_rater"),)

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    rater_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Quien califica
    rated_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )  # Quien recibe la calificación
    rating = Column(Float, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    job = relationship("Job")
    rater = relationship("User", foreign_keys=[rater_id])
    rated = relationship("User", foreign_keys=[rated_id])
