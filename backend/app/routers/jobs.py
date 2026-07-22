from fastapi import Request, Body, APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.job import Job
from app.models.application import Application
from app.schemas.job import JobCreate, JobUpdate, JobResponse, DisputeRequest, CorrectionRequest, JobWithApplicants, ApplicationBrief
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.services.auth import get_current_user
from app.models.user import User
from app.services.event_manager import publish
from app.routers.notifications import create_notification
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
@router.post("", include_in_schema=False, response_model=JobResponse, status_code=status.HTTP_201_CREATED)
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
        latitude=job.latitude,
        longitude=job.longitude,
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, job: JobUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Editar un trabajo (solo el dueño, solo si está abierto). Coordenadas se pueden actualizar siempre."""
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if db_job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No eres el dueño de este trabajo")
    if db_job.status != "open":
        # Solo permitir actualizar coordenadas si no está abierto
        if job.latitude is not None:
            db_job.latitude = job.latitude
        if job.longitude is not None:
            db_job.longitude = job.longitude
        if job.location:
            db_job.location = job.location
        db.commit()
        db.refresh(db_job)
        return db_job

    db_job.title = job.title
    db_job.description = job.description
    db_job.category = job.category
    db_job.location = job.location
    db_job.budget = job.budget
    db_job.duration = job.duration
    if job.latitude is not None:
        db_job.latitude = job.latitude
    if job.longitude is not None:
        db_job.longitude = job.longitude
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
@router.get("", include_in_schema=False, response_model=List[JobResponse])
def list_jobs(status_filter: str = "open", db: Session = Depends(get_db)):
    """Listar trabajos (filtro por status, default: open)"""
    jobs = db.query(Job).filter(Job.status == status_filter).all()
    return jobs


@router.get("/my-applicants", response_model=list[JobWithApplicants])
def my_applicants(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    ? MIS POSTULANTES
    Solo contractors: devuelve todos los trabajos con sus aplicantes.
    """
    if current_user.role != "contractor":
        raise HTTPException(status_code=403, detail="Solo contratistas")

    jobs = db.query(Job).filter(
        Job.client_id == current_user.id,
        Job.status.in_(["open", "in_progress"])
    ).order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        apps = db.query(Application).filter(
            Application.job_id == job.id,
            Application.status.in_(["pending", "accepted", "rejected"])
        ).all()

        applicants = []
        for app in apps:
            worker = db.query(User).filter(User.id == app.worker_id).first()
            if not worker:
                continue
            # Contar trabajos completados como worker
            jobs_done = db.query(Job).filter(
                Job.worker_id == worker.id,
                Job.status == "completed"
            ).count()
            applicants.append(ApplicationBrief(
                id=app.id,
                worker_id=app.worker_id,
                worker_name=worker.full_name,
                worker_rating=worker.rating_avg or 0.0,
                worker_email=worker.email or "",
                worker_phone=worker.phone or "",
                worker_cedula=worker.cedula or "",
                worker_since=worker.created_at,
                jobs_completed=jobs_done,
                message=app.message,
                status=app.status,
                created_at=app.created_at,
            ))

        result.append(JobWithApplicants(job=job, applicants=applicants))

    return result


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
    publish(job.client_id, "job_applied", {
        "job_id": job.id,
        "job_title": job.title,
        "worker_name": current_user.full_name,
        "message": f"{current_user.full_name} ha solicitado el puesto de {job.title}"
    })
    create_notification(job.client_id, "job_applied", f"{current_user.full_name} ha solicitado el puesto de {job.title}", {
        "job_id": job.id,
        "job_title": job.title,
    })
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
    """Aceptar un worker (solo el contractor dueño). Bloquea los fondos en escrow."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede aceptar aplicantes")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Este trabajo ya no está disponible")

    # Verificar saldo disponible (available, no total)
    available = current_user.balance - current_user.held_balance
    if available < job.budget:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo disponible insuficiente. Disponible: ${available:.2f}, Necesario: ${job.budget:.2f}"
        )

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

    # Bloquear fondos en escrow
    current_user.held_balance += job.budget

    otras = db.query(Application).filter(
        Application.job_id == job_id,
        Application.id != application_id,
        Application.status == "pending"
    ).all()
    for otra in otras:
        otra.status = "rejected"

    db.commit()
    db.refresh(job)
    publish(job.worker_id, "job_accepted", {
        "job_id": job.id,
        "job_title": job.title,
        "message": f"Has sido seleccionado para: {job.title}"
    })
    create_notification(job.worker_id, "job_accepted", f"Has sido seleccionado para: {job.title}", {
        "job_id": job.id,
        "job_title": job.title,
    })
    return job


# ─── Sistema de completar / disputar ───────────────────────────────


@router.post("/{job_id}/complete-request", response_model=JobResponse)
@limiter.limit("10/minute")
def request_complete(request: Request, job_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    """El worker solicita marcar el trabajo como terminado. Genera codigo de verificacion."""
    import random
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status not in ("in_progress", "checked_in"):
        raise HTTPException(status_code=400, detail="El trabajo no está en progreso")
    if job.worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el worker asignado puede solicitar completar")

    # Generar código de verificación de 6 dígitos
    code = str(random.randint(100000, 999999))
    job.status = "review_pending"
    job.review_requested_at = datetime.now(timezone.utc)
    job.completion_code = code
    job.timeout_at = datetime.now(timezone.utc) + timedelta(hours=72)  # Auto-release en 72h
    db.commit()
    db.refresh(job)
    publish(job.client_id, "job_review_pending", {
        "job_id": job.id,
        "job_title": job.title,
        "message": f"{current_user.full_name} ha marcado {job.title} como finalizado. El código de verificación está disponible en la página del trabajo."
    })
    create_notification(job.client_id, "job_review_pending",
        f"{current_user.full_name} ha marcado {job.title} como finalizado. El código de verificación está disponible en la página del trabajo.",
        {
            "job_id": job.id,
            "job_title": job.title,
        }
    )
    return job


@router.post("/{job_id}/verify-completion", response_model=JobResponse)
@limiter.limit("5/minute")
def verify_completion(
    request: Request,
    job_id: int,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """El worker ingresa el codigo de verificacion. Si es correcto, libera el pago automaticamente."""
    from app.models.transaction import Transaction

    code = body.get("code", "") if isinstance(body, dict) else ""
    if not code or len(str(code)) != 6:
        raise HTTPException(status_code=422, detail="Se requiere un código de 6 dígitos")
    code = str(code)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "review_pending":
        raise HTTPException(status_code=400, detail="El trabajo no está esperando verificación")
    if job.worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el worker asignado puede verificar")
    if not job.completion_code:
        raise HTTPException(status_code=400, detail="No hay código de verificación pendiente")
    if code != job.completion_code:
        raise HTTPException(status_code=400, detail="Código de verificación incorrecto")

    # ─── Verificar que el contractor tiene fondos retenidos ───
    contractor = db.query(User).filter(User.id == job.client_id).first()
    if contractor.held_balance < job.budget:
        raise HTTPException(
            status_code=400,
            detail=f"Error: fondos insuficientes en escrow. Held: ${contractor.held_balance:.2f}, Budget: ${job.budget:.2f}"
        )

    # ─── Completar trabajo ───
    job.status = "completed"
    job.review_requested_at = None
    job.completion_code = None
    job.timeout_at = None
    job.correction_note = None

    # ─── Liberar pago automático: held → worker ───
    worker = db.query(User).filter(User.id == job.worker_id).first()
    contractor.held_balance -= job.budget
    worker.balance += job.budget

    # ─── Registrar transacción ───
    transaction = Transaction(
        user_id=contractor.id,
        job_id=job.id,
        type="release",
        amount=job.budget,
        network="polygon",
        status="confirmed",
        confirmed_at=datetime.now(timezone.utc),
    )
    db.add(transaction)
    db.commit()
    db.refresh(job)

    # ─── Notificar ───
    publish(job.client_id, "job_completed", {
        "job_id": job.id,
        "job_title": job.title,
        "message": f"{job.title} ha sido verificado y completado exitosamente"
    })
    create_notification(job.client_id, "job_completed", f"{job.title} ha sido verificado y completado exitosamente", {
        "job_id": job.id,
        "job_title": job.title,
    })
    create_notification(job.worker_id, "payment_received", f"Has recibido ${job.budget:.2f} USDT por {job.title}", {
        "job_id": job.id,
        "amount": job.budget,
    })
    return job


@router.post("/{job_id}/approve", response_model=JobResponse)
@limiter.limit("10/minute")
def approve_job(request: Request, job_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    """El contractor aprueba directamente (sin codigo). Libera el pago automaticamente."""
    from app.models.transaction import Transaction

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "review_pending":
        raise HTTPException(status_code=400, detail="El trabajo no está esperando revisión")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede aprobar")

    # ─── Verificar fondos retenidos ───
    contractor = db.query(User).filter(User.id == current_user.id).first()
    if contractor.held_balance < job.budget:
        raise HTTPException(
            status_code=400,
            detail=f"Error: fondos insuficientes en escrow. Held: ${contractor.held_balance:.2f}, Budget: ${job.budget:.2f}"
        )

    job.status = "completed"
    job.review_requested_at = None
    job.completion_code = None
    job.timeout_at = None
    job.correction_note = None

    # ─── Liberar pago ───
    worker = db.query(User).filter(User.id == job.worker_id).first()
    contractor.held_balance -= job.budget
    worker.balance += job.budget

    transaction = Transaction(
        user_id=contractor.id,
        job_id=job.id,
        type="release",
        amount=job.budget,
        network="polygon",
        status="confirmed",
        confirmed_at=datetime.now(timezone.utc),
    )
    db.add(transaction)
    db.commit()
    db.refresh(job)

    publish(job.worker_id, "job_completed", {
        "job_id": job.id,
        "job_title": job.title,
        "message": f"{job.title} ha sido aprobado y completado exitosamente"
    })
    create_notification(job.worker_id, "job_completed", f"{job.title} ha sido aprobado y completado exitosamente", {
        "job_id": job.id,
        "job_title": job.title,
    })
    create_notification(job.client_id, "payment_sent", f"Has pagado ${job.budget:.2f} USDT por {job.title}", {
        "job_id": job.id,
        "amount": job.budget,
    })
    return job


# ─── Corrección ──────────────────────────────────────


@router.post("/{job_id}/request-correction", response_model=JobResponse)
@limiter.limit("10/minute")
def request_correction(request: Request, job_id: int, correction: CorrectionRequest, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    """El contractor pide una corrección al worker antes de aprobar"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "review_pending":
        raise HTTPException(status_code=400, detail="El trabajo no está esperando revisión")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede pedir correcciones")

    job.correction_count += 1
    job.correction_note = correction.note
    job.evidence_images = json.dumps(correction.images) if correction.images else None
    job.completion_code = None  # Invalidar código anterior
    job.timeout_at = None  # Pausar timeout mientras corrigen

    db.commit()
    db.refresh(job)

    publish(job.worker_id, "correction_requested", {
        "job_id": job.id,
        "job_title": job.title,
        "note": correction.note,
        "message": f"Corrección solicitada en '{job.title}': {correction.note}"
    })
    create_notification(job.worker_id, "correction_requested", f"Corrección solicitada en '{job.title}': {correction.note}", {
        "job_id": job.id,
        "job_title": job.title,
    })
    return job


@router.post("/{job_id}/dispute", response_model=JobResponse)
@limiter.limit("10/minute")
def dispute_job(request: Request, job_id: int, dispute: DisputeRequest, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    """Abrir disputa (contractor o worker). Fondos quedan retenidos 24h."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status not in ("review_pending", "in_progress"):
        raise HTTPException(status_code=400, detail="El trabajo no está en un estado que permita disputa")
    if current_user.id not in (job.client_id, job.worker_id):
        raise HTTPException(status_code=403, detail="Solo el contratista o el worker pueden abrir una disputa")

    # Determinar quién abre la disputa
    dispute_by = "contractor" if current_user.id == job.client_id else "worker"

    job.status = "disputed"
    job.dispute_reason = dispute.reason
    job.dispute_by = dispute_by
    job.disputed_at = datetime.now(timezone.utc)
    job.evidence_images = json.dumps(dispute.images) if dispute.images else None
    job.review_requested_at = None
    job.completion_code = None
    job.timeout_at = None  # Timeout pausado durante disputa

    db.commit()
    db.refresh(job)

    # Notificar al admin y a la otra parte
    other_id = job.client_id if dispute_by == "worker" else job.worker_id
    msg = f"'{job.title}' ha sido disputado por el {dispute_by}: {dispute.reason}"
    publish(1, "job_disputed", {
        "job_id": job.id,
        "job_title": job.title,
        "reason": dispute.reason,
        "dispute_by": dispute_by,
        "message": msg
    })
    if other_id:
        create_notification(other_id, "job_disputed", msg, {
            "job_id": job.id,
            "job_title": job.title,
        })
    return job


@router.post("/{job_id}/cancel", response_model=JobResponse)
@limiter.limit("10/minute")
def cancel_job(request: Request, job_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    """El contratista cancela el trabajo. Libera fondos retenidos."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status in ("completed", "disputed", "cancelled", "checked_in"):
        raise HTTPException(status_code=400, detail="Este trabajo ya no se puede cancelar")
    if job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el contratista puede cancelar")

    # ─── Liberar fondos si estaban bloqueados ───
    contractor = db.query(User).filter(User.id == current_user.id).first()
    if job.worker_id and contractor.held_balance >= job.budget:
        contractor.held_balance -= job.budget

    job.status = "cancelled"
    job.timeout_at = None
    db.commit()
    db.refresh(job)
    if job.worker_id:
        publish(job.worker_id, "job_cancelled", {
            "job_id": job.id,
            "job_title": job.title,
            "message": f"{job.title} ha sido cancelado"
        })
        create_notification(job.worker_id, "job_cancelled", f"{job.title} ha sido cancelado", {
            "job_id": job.id,
            "job_title": job.title,
        })
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
    ⏰ TIMEOUT 72h
    
    Busca trabajos en 'review_pending' donde haya pasado el timeout_at.
    Si el contractor no respondió, libera el pago automáticamente al worker.
    
    Esto protege al worker de contractors que ignoran la solicitud.
    
    Llama a este endpoint manualmente o configúralo como tarea programada.
    """
    now = datetime.now(timezone.utc)
    
    # Buscar jobs con timeout vencido
    expired_jobs = (
        db.query(Job)
        .filter(
            Job.status == "review_pending",
            Job.timeout_at.isnot(None),
            Job.timeout_at <= now,
        )
        .all()
    )
    
    processed = []
    for job in expired_jobs:
        # Completar el trabajo automáticamente
        job.status = "completed"
        job.review_requested_at = None
        job.timeout_at = None
        job.correction_note = None
        
        # Liberar el pago desde held_balance
        contractor = db.query(User).filter(User.id == job.client_id).first()
        worker = db.query(User).filter(User.id == job.worker_id).first()
        
        if contractor and worker:
            if contractor.held_balance >= job.budget:
                contractor.held_balance -= job.budget
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
                
                # Notificar a ambas partes
                create_notification(worker.id, "payment_received",
                    f"Pago automático de ${job.budget:.2f} USDT por '{job.title}' (timeout)",
                    {"job_id": job.id, "amount": job.budget})
                create_notification(contractor.id, "auto_released",
                    f"Se liberó ${job.budget:.2f} USDT por inactividad en '{job.title}'",
                    {"job_id": job.id})
        
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
