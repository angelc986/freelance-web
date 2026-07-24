import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import update as sa_update
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.application import Application
from app.models.job import Job
from app.models.rating import Rating
from app.models.transaction import Transaction
from app.models.user import User
from app.services.auth import get_current_user
from app.services.audit import log_action
from app.services.cloudinary_service import upload_avatar as cloudinary_upload

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class UserPublicResponse(BaseModel):
    id: int
    full_name: str
    role: str
    rating_avg: float
    is_active: bool
    created_at: str | None = None

    class Config:
        from_attributes = True


class UserRatingResponse(BaseModel):
    id: int
    rater_id: int
    rater_name: str | None = None
    rating: float
    comment: str | None = None
    created_at: str | None = None

    class Config:
        from_attributes = True


class UserRatingSummary(BaseModel):
    avg: float
    total: int
    breakdown: dict  # {5: N, 4: N, 3: N, 2: N, 1: N}
    reviews: list[UserRatingResponse]


@router.get("/{user_id}", response_model=UserPublicResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Perfil público de un usuario"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return UserPublicResponse(
        id=user.id,
        full_name=user.full_name,
        role=user.role,
        rating_avg=user.rating_avg,
        is_active=user.is_active,
        created_at=str(user.created_at) if user.created_at else None,
    )


@router.get("/activity", response_model=list[dict])
def get_user_activity(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    📋 ACTIVIDAD RECIENTE

    Combina trabajos, aplicaciones y transacciones recientes.
    """
    activities = []

    # Trabajos del usuario
    jobs = (
        db.query(Job)
        .filter((Job.client_id == current_user.id) | (Job.worker_id == current_user.id))
        .order_by(Job.updated_at.desc())
        .limit(5)
        .all()
    )

    for j in jobs:
        if j.client_id == current_user.id:
            role = "contratista"
        else:
            role = "trabajador"

        action_map = {
            "open": "Publicaste",
            "in_progress": "Aceptaste",
            "checked_in": "Check-in realizado",
            "review_pending": "Solicitud de finalización",
            "completed": "Completaste",
            "cancelled": "Cancelaste",
        }
        action = action_map.get(j.status, "Actualizaste")

        activities.append(
            {
                "type": "job",
                "action": f"{action} el trabajo",
                "title": j.title,
                "status": j.status,
                "id": j.id,
                "date": str(j.updated_at) if j.updated_at else str(j.created_at),
            }
        )

    # Aplicaciones del worker
    apps = (
        db.query(Application)
        .filter(Application.worker_id == current_user.id)
        .order_by(Application.created_at.desc())
        .limit(5)
        .all()
    )

    for a in apps:
        job = db.query(Job).filter(Job.id == a.job_id).first()
        job_title = job.title if job else f"Trabajo #{a.job_id}"
        app_action = {
            "pending": "Postulaste a",
            "accepted": "Aceptaron tu postulación en",
            "rejected": "Rechazaron tu postulación en",
        }.get(a.status, "Postulaste a")

        activities.append(
            {
                "type": "application",
                "action": app_action,
                "title": job_title,
                "status": a.status,
                "id": a.job_id,
                "date": str(a.created_at),
            }
        )

    # Transacciones recientes
    txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .limit(3)
        .all()
    )

    for t in txns:
        txn_action = {
            "deposit": "Depositaste",
            "release": "Recibiste pago por",
            "withdraw": "Retiraste",
            "refund": "Reembolso de",
        }.get(t.type, "Transacción")

        activities.append(
            {
                "type": "transaction",
                "action": txn_action,
                "title": f"${t.amount:.2f}",
                "status": t.status,
                "id": t.id,
                "date": str(t.created_at),
            }
        )

    # Ordenar por fecha descendente
    activities.sort(key=lambda x: x["date"], reverse=True)

    return activities[:10]


@router.get("/{user_id}/ratings", response_model=UserRatingSummary)
def get_user_ratings(user_id: int, db: Session = Depends(get_db)):
    """
    ⭐ CALIFICACIONES DE UN USUARIO
    Devuelve todas las calificaciones que ha recibido + resumen.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    ratings = (
        db.query(Rating).filter(Rating.rated_id == user_id).order_by(Rating.created_at.desc()).all()
    )

    total = len(ratings)
    breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in ratings:
        star = int(r.rating)
        if star in breakdown:
            breakdown[star] += 1

    reviews = []
    for r in ratings:
        rater = db.query(User).filter(User.id == r.rater_id).first()
        reviews.append(
            UserRatingResponse(
                id=r.id,
                rater_id=r.rater_id,
                rater_name=rater.full_name if rater else None,
                rating=r.rating,
                comment=r.comment,
                created_at=str(r.created_at) if r.created_at else None,
            )
        )

    avg = round(sum(r.rating for r in ratings) / total, 1) if total > 0 else 0

    return UserRatingSummary(
        avg=avg,
        total=total,
        breakdown=breakdown,
        reviews=reviews,
    )


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # CRIT-02: Usuario verificado por KYC no puede cambiar su avatar
    if current_user.avatar_verified:
        raise HTTPException(
            status_code=403,
            detail="Tu foto de perfil fue verificada por KYC. Contacta a soporte para cambiarla.",
        )

    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Formato no permitido. Usa JPG, PNG, WebP o GIF.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen es muy grande. Maximo 5MB.")

    # Intentar subir a Cloudinary primero
    cloudinary_url = cloudinary_upload(contents, current_user.id, file.filename or "avatar.jpg")

    if cloudinary_url:
        # HIGH-02: Log del cambio de avatar
        previous_avatar = current_user.avatar_url
        db.execute(
            sa_update(User).where(User.id == current_user.id).values(avatar_url=cloudinary_url)
        )
        db.commit()
        log_action(
            current_user.id,
            "avatar_changed",
            {
                "previous_avatar": previous_avatar,
                "new_avatar": cloudinary_url,
                "source": "manual_upload",
            },
        )
        return {"avatar_url": cloudinary_url}

    # Fallback: guardar localmente (Railway ephemeral, pero util para dev)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join("uploads", filename)
    os.makedirs("uploads", exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(contents)

    db.execute(
        sa_update(User).where(User.id == current_user.id).values(avatar_url=f"/uploads/{filename}")
    )
    db.commit()

    return {"avatar_url": f"/uploads/{filename}"}
