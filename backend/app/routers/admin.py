"""Panel de administración — solo usuarios con is_admin=True"""
from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.job import Job
from app.models.transaction import Transaction
from app.schemas.user import UserResponse
from app.schemas.job import JobResponse
from app.schemas.payment import TransactionResponse
from app.services.auth import get_current_admin
from app.services.audit import log_action
from app.limiter import limiter

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── HELPERS ─────────────────────────────────────────


def _user_to_response(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "phone": u.phone,
        "full_name": u.full_name,
        "role": u.role,
        "is_admin": u.is_admin,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "profile_completed": u.profile_completed,
        "balance": u.balance,
        "rating_avg": u.rating_avg,
        "wallet_address": u.wallet_address,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def _job_to_response(j: Job) -> dict:
    return {
        "id": j.id,
        "title": j.title,
        "status": j.status,
        "budget": j.budget,
        "client_id": j.client_id,
        "worker_id": j.worker_id,
        "dispute_reason": j.dispute_reason,
        "location": j.location,
        "category": j.category,
        "created_at": j.created_at.isoformat() if j.created_at else None,
    }


# ─── STATS ────────────────────────────────────────────


@router.get("/stats")
@limiter.limit("30/minute")
def admin_stats(request: Request, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """📊 Estadísticas generales de la plataforma"""
    total_users = db.query(User).count()
    total_workers = db.query(User).filter(User.role.in_(["worker", "both"])).count()
    total_contractors = db.query(User).filter(User.role.in_(["contractor", "both"])).count()
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status.in_(["open", "in_progress", "checked_in"])).count()
    disputed_jobs = db.query(Job).filter(Job.status == "disputed").count()
    completed_jobs = db.query(Job).filter(Job.status == "completed").count()
    total_transactions = db.query(Transaction).count()
    total_volume = db.query(Transaction).filter(Transaction.status == "confirmed").with_entities(
        Transaction.amount
    ).all()
    total_volume_sum = sum(t.amount for t in total_volume) if total_volume else 0

    return {
        "total_users": total_users,
        "total_workers": total_workers,
        "total_contractors": total_contractors,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "disputed_jobs": disputed_jobs,
        "completed_jobs": completed_jobs,
        "total_transactions": total_transactions,
        "total_volume_usdt": round(total_volume_sum, 2),
    }


# ─── USERS ────────────────────────────────────────────


@router.get("/users")
@limiter.limit("30/minute")
def admin_list_users(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    role: str = "",
    search: str = "",
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """👥 Listar todos los usuarios (paginado + filtros)"""
    query = db.query(User)

    if role and role in ("worker", "contractor", "both"):
        query = query.filter(User.role == role)

    if search:
        like = f"%{search}%"
        query = query.filter(
            User.full_name.ilike(like) | User.email.ilike(like) | User.phone.ilike(like)
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "users": [_user_to_response(u) for u in users],
    }


@router.get("/users/{user_id}")
@limiter.limit("30/minute")
def admin_get_user(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """🔍 Ver detalle de un usuario"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _user_to_response(user)


@router.patch("/users/{user_id}/status")
@limiter.limit("10/minute")
def admin_toggle_user_status(
    request: Request,
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """🔒 Suspender o activar un usuario"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="No puedes suspender a otro administrador")

    user.is_active = is_active
    db.commit()

    log_action(admin_user.id, f"admin_{'activate' if is_active else 'suspend'}_user", {"target_user_id": user_id}, ip=request.client.host)
    return {"message": f"Usuario {'activado' if is_active else 'suspendido'} exitosamente"}


@router.patch("/users/{user_id}/admin")
@limiter.limit("5/minute")
def admin_toggle_admin_role(
    request: Request,
    user_id: int,
    is_admin: bool,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """👑 Dar o quitar permisos de admin a un usuario"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.is_admin = is_admin
    db.commit()

    log_action(admin_user.id, f"admin_{'grant' if is_admin else 'revoke'}_admin", {"target_user_id": user_id}, ip=request.client.host)
    return {"message": f"Permisos de admin {'otorgados' if is_admin else 'revocados'} exitosamente"}


# ─── TRANSACTIONS ─────────────────────────────────────


@router.get("/transactions")
@limiter.limit("30/minute")
def admin_list_transactions(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    status_filter: str = "",
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """💳 Listar todas las transacciones"""
    query = db.query(Transaction)

    if status_filter and status_filter in ("pending", "confirmed", "failed", "pending_confirmation"):
        query = query.filter(Transaction.status == status_filter)

    total = query.count()
    txs = query.order_by(Transaction.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "transactions": [
            {
                "id": tx.id,
                "user_id": tx.user_id,
                "job_id": tx.job_id,
                "type": tx.type,
                "amount": tx.amount,
                "network": tx.network,
                "tx_hash": tx.tx_hash,
                "from_address": tx.from_address,
                "to_address": tx.to_address,
                "status": tx.status,
                "requires_confirmation": tx.requires_confirmation,
                "created_at": tx.created_at.isoformat() if tx.created_at else None,
                "confirmed_at": tx.confirmed_at.isoformat() if tx.confirmed_at else None,
            }
            for tx in txs
        ],
    }


# ─── DISPUTES ─────────────────────────────────────────


@router.get("/disputes")
@limiter.limit("30/minute")
def admin_list_disputes(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """⚖️ Listar trabajos en disputa"""
    query = db.query(Job).filter(Job.status == "disputed")
    total = query.count()
    jobs = query.order_by(Job.updated_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "disputes": [
            {
                "id": j.id,
                "title": j.title,
                "budget": j.budget,
                "client_id": j.client_id,
                "worker_id": j.worker_id,
                "dispute_reason": j.dispute_reason,
                "status": j.status,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "updated_at": j.updated_at.isoformat() if hasattr(j, 'updated_at') and j.updated_at else None,
            }
            for j in jobs
        ],
    }


@router.post("/disputes/{job_id}/resolve")
@limiter.limit("5/minute")
def admin_resolve_dispute(
    request: Request,
    job_id: int,
    resolution: str,  # "approve" | "cancel" | "refund"
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """⚖️ Resolver una disputa"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.status != "disputed":
        raise HTTPException(status_code=400, detail="Este trabajo no está en disputa")

    if resolution == "approve":
        # Forzar completado, pago al worker
        worker = db.query(User).filter(User.id == job.worker_id).first()
        contractor = db.query(User).filter(User.id == job.client_id).first()
        if contractor and worker:
            contractor.balance -= job.budget
            worker.balance += job.budget
        job.status = "completed"

    elif resolution == "cancel":
        # Cancelar, sin pago
        job.status = "cancelled"

    elif resolution == "refund":
        # Reembolso al contractor
        job.status = "cancelled"

    else:
        raise HTTPException(status_code=400, detail="Resolución inválida. Usa: approve, cancel, refund")

    db.commit()

    log_action(admin.id, "admin_resolve_dispute", {"job_id": job_id, "resolution": resolution, "client_id": job.client_id, "worker_id": job.worker_id}, ip=request.client.host)
    return {"message": f"Disputa resuelta: {resolution}", "job_status": job.status}


# ─── REFUND (admin override) ────────────────────────


@router.post("/refund/{job_id}")
@limiter.limit("3/minute")
def admin_refund(
    request: Request,
    job_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """💸 Reembolso forzado por admin (usa el mismo endpoint de payments pero con auth admin)"""
    from app.routers.payments import refund_payment
    return refund_payment(job_id, db, admin)


# ─── WALLET / COMPANY ────────────────────────────────


@router.get("/wallet")
@limiter.limit("30/minute")
def admin_wallet_info(
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """🏦 Informacion de la wallet del sistema"""
    from app.config import get_settings
    settings = get_settings()

    total_deposits = (
        db.query(Transaction)
        .filter(Transaction.type == "deposit", Transaction.status == "confirmed")
        .with_entities(Transaction.amount)
        .all()
    )
    total_withdrawals = (
        db.query(Transaction)
        .filter(Transaction.type == "withdraw", Transaction.status.in_(["confirmed", "sent"]))
        .with_entities(Transaction.amount)
        .all()
    )
    pending = (
        db.query(Transaction)
        .filter(Transaction.status == "pending_confirmation")
        .count()
    )

    deposits_sum = sum(t.amount for t in total_deposits) if total_deposits else 0
    withdrawals_sum = sum(t.amount for t in total_withdrawals) if total_withdrawals else 0

    return {
        "system_wallet": settings.SYSTEM_WALLET_ADDRESS,
        "balance": round(deposits_sum - withdrawals_sum, 2),
        "total_deposits": round(deposits_sum, 2),
        "total_withdrawals": round(withdrawals_sum, 2),
        "pending_confirmation": pending,
    }


# ─── ANALYTICS ────────────────────────────────────────


@router.get("/analytics")
@limiter.limit("30/minute")
def admin_analytics(
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """📈 Analiticas avanzadas"""
    from sqlalchemy import func
    from datetime import date, timedelta
    from app.models.rating import Rating

    today = date.today()
    thirty_days_ago = today - timedelta(days=30)

    # User growth
    user_growth = db.query(
        func.date(User.created_at).label("date"),
        func.count(User.id).label("count"),
    ).filter(User.created_at >= thirty_days_ago).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)).all()
    user_growth_data = [{"date": str(r.date), "count": r.count} for r in user_growth]

    # Job trends
    job_trends = db.query(
        func.date(Job.created_at).label("date"),
        Job.status, func.count(Job.id).label("count"),
    ).filter(Job.created_at >= thirty_days_ago).group_by(func.date(Job.created_at), Job.status).order_by(func.date(Job.created_at)).all()
    jmap: dict = {}
    for r in job_trends:
        d = str(r.date)
        if d not in jmap:
            jmap[d] = {"date": d, "open": 0, "in_progress": 0, "completed": 0, "disputed": 0, "cancelled": 0}
        jmap[d][r.status] = r.count
    job_trend_data = sorted(jmap.values(), key=lambda x: x["date"])

    # Revenue timeline
    rev = db.query(
        func.date(Transaction.created_at).label("date"),
        Transaction.type, func.coalesce(func.sum(Transaction.amount), 0).label("total"),
    ).filter(Transaction.created_at >= thirty_days_ago, Transaction.status == "confirmed").group_by(
        func.date(Transaction.created_at), Transaction.type
    ).order_by(func.date(Transaction.created_at)).all()
    rmap: dict = {}
    for r in rev:
        d = str(r.date)
        if d not in rmap:
            rmap[d] = {"date": d, "deposits": 0, "withdrawals": 0, "payment": 0}
        if r.type in rmap[d]:
            rmap[d][r.type] = float(r.total)
    rev_data = sorted(rmap.values(), key=lambda x: x["date"])

    # Top workers
    top_workers = db.query(
        User.id, User.full_name, User.rating_avg,
        func.coalesce(func.sum(Transaction.amount), 0).label("earnings"),
        func.count(Job.id).label("jobs_completed"),
    ).join(Transaction, Transaction.user_id == User.id).join(
        Job, Job.worker_id == User.id
    ).filter(
        Transaction.type == "payment", Transaction.status == "confirmed", Job.status == "completed"
    ).group_by(User.id).order_by(func.sum(Transaction.amount).desc()).limit(10).all()
    top_workers_data = [{
        "id": w.id, "name": w.full_name,
        "earnings": round(float(w.earnings), 2),
        "jobs": w.jobs_completed,
        "rating": round(float(w.rating_avg), 1),
    } for w in top_workers]

    # Rating distribution
    rating_dist = db.query(Rating.rating, func.count(Rating.id)).group_by(Rating.rating).all()
    rating_data = {str(int(r[0])): r[1] for r in rating_dist}
    for i in range(1, 6):
        if str(i) not in rating_data:
            rating_data[str(i)] = 0

    # Today
    users_yesterday = db.query(User).filter(func.date(User.created_at) == today - timedelta(days=1)).count()
    users_today = db.query(User).filter(func.date(User.created_at) == today).count()
    growth_rate = round(((users_today - users_yesterday) / max(users_yesterday, 1)) * 100, 1)
    active_today = users_today  # simplified

    return {
        "user_growth": user_growth_data,
        "job_trends": job_trend_data,
        "revenue_timeline": rev_data,
        "top_workers": top_workers_data,
        "rating_distribution": rating_data,
        "new_users_today": users_today,
        "active_users_today": active_today,
        "growth_rate": growth_rate if users_yesterday > 0 else 100.0,
    }


# ─── USER FULL DETAIL ───────────────────────────────


@router.get("/users/{user_id}/full")
@limiter.limit("30/minute")
def admin_user_detail(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """👤 Perfil completo de usuario"""
    from app.models.rating import Rating
    from sqlalchemy import func

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    jobs_as_client = db.query(Job).filter(Job.client_id == user_id).all()
    jobs_as_worker = db.query(Job).filter(Job.worker_id == user_id).all()
    txns = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.created_at.desc()).limit(50).all()

    total_earned = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id, Transaction.type == "payment", Transaction.status == "confirmed"
    ).scalar()
    total_spent = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id, Transaction.type.in_(["deposit", "withdraw"]), Transaction.status == "confirmed"
    ).scalar()
    jobs_completed = db.query(Job).filter(Job.worker_id == user_id, Job.status == "completed").count()
    ratings_received = db.query(Rating).filter(Rating.rated_id == user_id).all()

    return {
        "user": _user_to_response(user),
        "stats": {
            "total_earned": float(total_earned),
            "total_spent": float(total_spent),
            "jobs_posted": len(jobs_as_client),
            "jobs_completed": jobs_completed,
            "jobs_assigned": len(jobs_as_worker),
            "ratings_count": len(ratings_received),
        },
        "jobs_as_client": [_job_to_response(j) for j in jobs_as_client],
        "jobs_as_worker": [_job_to_response(j) for j in jobs_as_worker],
        "transactions": [{
            "id": t.id, "type": t.type, "amount": t.amount,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        } for t in txns],
        "ratings": [{
            "id": r.id, "rating": r.rating, "comment": r.comment,
            "rater_id": r.rater_id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        } for r in ratings_received],
    }


# ─── JOBS LIST ───────────────────────────────────────


@router.get("/jobs")
@limiter.limit("30/minute")
def admin_list_jobs(
    request: Request,
    page: int = 1,
    per_page: int = 50,
    status_filter: str = "",
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """📋 Listar trabajos (admin)"""
    query = db.query(Job)
    if status_filter and status_filter in ("open", "in_progress", "completed", "disputed", "cancelled", "checked_in"):
        query = query.filter(Job.status == status_filter)
    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total, "page": page, "per_page": per_page,
        "jobs": [_job_to_response(j) for j in jobs],
    }
