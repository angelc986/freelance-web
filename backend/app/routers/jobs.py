from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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


@router.get("/", response_model=List[JobResponse])
def list_jobs(status_filter: str = "open", db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.status == status_filter).all()
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    return job
