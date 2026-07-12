from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.job import Job
from app.models.rating import Rating
from app.schemas.rating import RatingCreate, RatingResponse
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/jobs", tags=["ratings"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/{job_id}/rate", response_model=RatingResponse)
def rate_job(job_id: int, data: RatingCreate, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    """
    ⭐ CALIFICAR TRABAJO
    Worker califica al contractor y viceversa.
    Solo se puede calificar cuando el trabajo está completado.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Solo se puede calificar trabajos completados")

    # Determinar quién califica a quién
    if current_user.id == job.client_id:
        # Contractor califica al worker
        rated_id = job.worker_id
    elif current_user.id == job.worker_id:
        # Worker califica al contractor
        rated_id = job.client_id
    else:
        raise HTTPException(status_code=403, detail="No tienes relación con este trabajo")

    if not rated_id:
        raise HTTPException(status_code=400, detail="No hay trabajador asignado a este trabajo")

    # Verificar que no haya calificado ya
    existing = db.query(Rating).filter(
        Rating.job_id == job_id,
        Rating.rater_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya calificaste este trabajo")

    rating = Rating(
        job_id=job_id,
        rater_id=current_user.id,
        rated_id=rated_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)

    # Actualizar rating promedio del usuario calificado
    update_user_rating(db, rated_id)

    return rating


@router.get("/{job_id}/ratings", response_model=List[RatingResponse])
def get_job_ratings(job_id: int, db: Session = Depends(get_db)):
    """
    📋 CALIFICACIONES DE UN TRABAJO
    """
    ratings = db.query(Rating).filter(Rating.job_id == job_id).all()
    return ratings


def update_user_rating(db: Session, user_id: int):
    """Recalcula el rating promedio de un usuario"""
    from app.models.user import User
    ratings = db.query(Rating).filter(Rating.rated_id == user_id).all()
    if ratings:
        avg = sum(r.rating for r in ratings) / len(ratings)
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.rating_avg = round(avg, 2)
            db.commit()
