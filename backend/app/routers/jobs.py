from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.models import User, JobDescription
from app.schemas.job import JobDescriptionCreate, JobDescriptionResponse
from app.routers.auth import get_current_user
from app.services.nlp_parser import (
    extract_skills_from_text,
    extract_keywords_from_text,
    extract_text_from_pdf,
    extract_text_from_docx
)

router = APIRouter(prefix="/jobs", tags=["Job Descriptions"])

@router.get("", response_model=List[JobDescriptionResponse])
def get_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(JobDescription).filter(JobDescription.user_id == current_user.id).order_by(JobDescription.created_at.desc()).all()
    return jobs

@router.post("", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobDescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skills_extracted = [s["skill_name"] for s in extract_skills_from_text(job_in.description + " " + job_in.title)]
    keywords_extracted = extract_keywords_from_text(job_in.description, top_k=20)
    
    job = JobDescription(
        user_id=current_user.id,
        title=job_in.title.strip(),
        company=job_in.company.strip() if job_in.company else "",
        location=job_in.location.strip() if job_in.location else "",
        description=job_in.description.strip(),
        extracted_skills=skills_extracted,
        extracted_keywords=keywords_extracted
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.post("/upload", response_model=JobDescriptionResponse)
async def upload_job_file(
    file: UploadFile = File(...),
    title: str = "Target Job",
    company: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename.lower()
    if not (filename.endswith(".pdf") or filename.endswith(".docx") or filename.endswith(".txt")):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF, DOCX, or text file."
        )
    try:
        contents = await file.read()
        if filename.endswith(".pdf"):
            raw_text = extract_text_from_pdf(contents)
        elif filename.endswith(".docx"):
            raw_text = extract_text_from_docx(contents)
        else:
            raw_text = contents.decode("utf-8", errors="ignore")
            
        skills_extracted = [s["skill_name"] for s in extract_skills_from_text(raw_text + " " + title)]
        keywords_extracted = extract_keywords_from_text(raw_text, top_k=20)
        
        job = JobDescription(
            user_id=current_user.id,
            title=title,
            company=company,
            description=raw_text,
            extracted_skills=skills_extracted,
            extracted_keywords=keywords_extracted
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process job document: {str(e)}")

@router.get("/{job_id}", response_model=JobDescriptionResponse)
def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id, JobDescription.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")
    return job
