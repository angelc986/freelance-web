from fastapi import Request,  APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.job import Job
from app.models.application import Application
from app.schemas.job import JobCreate, JobResponse, DisputeRequest
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.services.auth import get_current_user
from app.models.user import User
from app.limiter import limiter

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── CRUD de trabajos ──────────────────────────────────────────────


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_job(request: Request, job: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Crear un trabajo (solo contractors)"""
    if current_user.role not in ("contractor", "both"):
        raise HTTPException(status_code=403, detail="Solo contractors pueden crear trabajos")

    db_job = Job(
        title=job.title,
        description=job.description,
        category=job.category,
        location=job.location,
        budget=job.budget,
        duration=job.duration,
        client_id=current_user.id,
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.get("/mine", response_model=List[JobResponse])
def my_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    📋 MIS TRABAJOS
    
    Devuelve los trabajos del usuario actual:
    - Contractors: trabajos que publicaron
    - Workers: trabajos donde son worker_asignado + trabajos a los que aplicaron (pending)
    """
    if current_user.role == "contractor":
        jobs = db.query(Job).filter(Job.client_id == current_user.id).order_by(Job.created_at.desc()).all()
        return jobs

    # Workers: trabajos asignados + trabajos a los que aplicaron
    assigned_jobs = db.query(Job).filter(Job.worker_id == current_user.id).all()

    # También buscar aplicaciones pendientes/rechazadas
    app_job_ids = (
        db.query(Application.job_id)
        .filter(Application.worker_id == current_user.id)
        .subquery()
    )
    applied_jobs = db.query(Job).filter(Job.id.in_(app_job_ids)).all()

    # Unir y quitar duplicados (set por id)
    seen = set()
    result = []
    for job in assigned_jobs + applied_jobs:
        if job.id not in seen:
            seen.add(job.id)
            result.append(job)

    # Ordenar por fecha descendente
    result.sort(key=lambda j: j.created_at or datetime.min, reverse=True)
    return result


@router.get("/", response_model=List[JobResponse])
def list_jobs(status_filter: str = "open", db: Session = Depends(get_db)):
    """Listar trabajos (filtro por status, default: open)"""
    jobs = db.query(Job).filter(Job.status == status_filter).all()
    return jobs


@router.get("/my-applications", response_model=List[ApplicationResponse])
def my_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    📋 MIS POSTULACIONES
    
    Devuelve todas las aplicaciones del usuario actual (worker).
    """
    apps = (
        db.query(Application)
        .filter(Application.worker_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return apps


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Detalle de un trabajo"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    return job


# ─── Sistema de aplicar / aceptar ──────────────────────────────────


@router.post("/{job_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def apply_to_job(request: Request, job_id: int, application: ApplicationCreate, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    """Un worker aplica a un trabajo"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Este trabajo ya no está disponible")
    if job.client_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes aplicar a tu propio trabajo")

    existing = db.query(Application).filter(
        Application.job_id == job_id,
        Application.worker_id == current_user.id,
        Application.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya aplicaste a este trabajo")

    db_app = Application(
        job_id=job_id,
        worker_id=current_user.id,
        message=application.message,
        status="pending",
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app


@router.get("/{job_id}/applications", response_model=List[ApplicationResponse])
def list_applications(job_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    """Ver aplicantes (solo el contractor dueño)"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede ver los aplicantes")

    applications = db.query(Application).filter(
        Application.job_id == job_id,
        Application.status == "pending"
    ).all()
    return applications


@router.post("/{job_id}/accept/{application_id}", response_model=JobResponse)
@limiter.limit("20/minute")
def accept_application(request: Request, job_id: int, application_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    """Aceptar un worker (solo el contractor dueño)"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede aceptar aplicantes")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Este trabajo ya no está disponible")

    app = db.query(Application).filter(
        Application.id == application_id,
        Application.job_id == job_id,
        Application.status == "pending"
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada o ya fue procesada")

    job.worker_id = app.worker_id
    job.status = "in_progress"
    app.status = "accepted"

    otras = db.query(Application).filter(
        Application.job_id == job_id,
        Application.id != application_id,
        Application.status == "pending"
    ).all()
    for otra in otras:
        otra.status = "rejected"

    db.commit()
    db.refresh(job)
    return job


# ─── Sistema de completar / disputar ───────────────────────────────


@router.post("/{job_id}/complete-request", response_model=JobResponse)
@limiter.limit("10/minute")
def request_complete(request: Request, job_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    """El worker solicita marcar el trabajo como terminado"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status not in ("in_progress", "checked_in"):
        raise HTTPException(status_code=400, detail="El trabajo no está en progreso")
    if job.worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el worker asignado puede solicitar completar")

    job.status = "review_pending"
    job.review_requested_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/approve", response_model=JobResponse)
@limiter.limit("10/minute")
def approve_job(request: Request, job_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    """El contractor aprueba que el trabajo está bien hecho"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "review_pending":
        raise HTTPException(status_code=400, detail="El trabajo no está esperando revisión")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede aprobar")

    job.status = "completed"
    job.review_requested_at = None
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/dispute", response_model=JobResponse)
@limiter.limit("10/minute")
def dispute_job(request: Request, job_id: int, dispute: DisputeRequest, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    """El contractor disputa el trabajo"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "review_pending":
        raise HTTPException(status_code=400, detail="El trabajo no está esperando revisión")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede disputar")

    job.status = "disputed"
    job.dispute_reason = dispute.reason
    job.review_requested_at = None
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/cancel", response_model=JobResponse)
@limiter.limit("10/minute")
def cancel_job(request: Request, job_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    """El contratista cancela el trabajo"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status in ("completed", "disputed", "cancelled", "checked_in"):
        raise HTTPException(status_code=400, detail="Este trabajo ya no se puede cancelar")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede cancelar")

    job.status = "cancelled"
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/check-in", response_model=JobResponse)
@limiter.limit("10/minute")
def check_in(request: Request, job_id: int, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    """El worker confirma que llegó al lugar del trabajo"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "in_progress":
        raise HTTPException(status_code=400, detail="El trabajo no está en progreso")
    if job.worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el worker asignado puede hacer check-in")

    job.status = "checked_in"
    db.commit()
    db.refresh(job)
    return job


# ──────────────────────────────────────────────
# TIMEOUT 48 HORAS
# ──────────────────────────────────────────────

@router.post("/process-timeouts")
@limiter.limit("2/minute")
def process_timeouts(request: Request, db: Session = Depends(get_db)):
    """
    ⏰ TIMEOUT 48h
    
    Busca trabajos en 'review_pending' donde hayan pasado más de 48h
    desde que el worker pidió completar. Si el contractor no respondió,
    el trabajo se completa automáticamente.
    
    Esto protege al worker de contractors que ignoran la solicitud.
    
    Llama a este endpoint manualmente o configúralo como tarea programada.
    """
    # Calcular hace 48 horas
    deadline = datetime.now(timezone.utc) - timedelta(hours=48)
    
    # Buscar jobs expirados
    expired_jobs = (
        db.query(Job)
        .filter(
            Job.status == "review_pending",
            Job.review_requested_at.isnot(None),
            Job.review_requested_at <= deadline,
        )
        .all()
    )
    
    processed = []
    for job in expired_jobs:
        # Completar el trabajo automáticamente
        job.status = "completed"
        job.review_requested_at = None
        
        # Liberar el pago (descontar del contractor, acreditar al worker)
        contractor = db.query(User).filter(User.id == job.client_id).first()
        worker = db.query(User).filter(User.id == job.worker_id).first()
        
        if contractor and worker:
            # Solo si el contractor tiene saldo suficiente
            if contractor.balance >= job.budget:
                contractor.balance -= job.budget
                worker.balance += job.budget
                
                # Crear transacción de liberación automática
                from app.models.transaction import Transaction
                tx = Transaction(
                    user_id=contractor.id,
                    job_id=job.id,
                    type="release",
                    amount=job.budget,
                    network="polygon",
                    status="confirmed",
                    confirmed_at=datetime.now(timezone.utc),
                )
                db.add(tx)
        
        db.flush()
        processed.append({
            "job_id": job.id,
            "title": job.title,
            "amount": job.budget,
            "new_status": "completed",
        })
    
    db.commit()
    
    return {
        "processed": len(processed),
        "jobs": processed,
        "message": f"{len(processed)} trabajo(s) completados automáticamente por timeout",
    }
