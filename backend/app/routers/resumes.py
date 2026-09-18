from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Response, Header, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.database.session import get_db
from app.database.models import User, Resume, Education, Experience, Project, Skill
from app.schemas.resume import (
    ResumeCreate, ResumeUpdate, ResumeResponse,
    ResumeEnhanceRequest, ResumeEnhanceResponse
)
from app.routers.auth import get_current_user
from app.core.security import decode_access_token
from app.services.nlp_parser import (
    extract_pdf_data,
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_sections,
    extract_skills_from_text
)
from app.services.ai_service import ai_service
from app.services.pdf_generator import generate_resume_pdf

router = APIRouter(prefix="/resumes", tags=["Resumes"])

def serialize_resume(resume: Resume) -> dict:
    """Helper to convert database Resume model into full structured response dict."""
    content = resume.content or {}
    return {
        "id": resume.id,
        "user_id": resume.user_id,
        "title": resume.title,
        "template": resume.template or "modern",
        "full_name": resume.full_name or "",
        "email": resume.email or "",
        "phone": resume.phone or "",
        "location": resume.location or "",
        "linkedin": resume.linkedin or "",
        "github": resume.github or "",
        "portfolio": resume.portfolio or "",
        "summary": resume.summary or "",
        "education": content.get("education", []),
        "experience": content.get("experience", []),
        "projects": content.get("projects", []),
        "skills": content.get("skills", []),
        "certifications": content.get("certifications", []),
        "achievements": content.get("achievements", []),
        "languages": content.get("languages", []),
        "version": resume.version or 1,
        "is_primary": resume.is_primary if resume.is_primary is not None else True,
        "created_at": resume.created_at,
        "updated_at": resume.updated_at
    }

@router.get("", response_model=List[ResumeResponse])
def get_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()).all()
    return [serialize_resume(r) for r in resumes]

@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def create_resume(
    resume_in: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content_payload = {
        "education": [e.dict() for e in (resume_in.education or [])],
        "experience": [e.dict() for e in (resume_in.experience or [])],
        "projects": [p.dict() for p in (resume_in.projects or [])],
        "skills": [s.dict() for s in (resume_in.skills or [])],
        "certifications": [c.dict() for c in (resume_in.certifications or [])],
        "achievements": [a.dict() for a in (resume_in.achievements or [])],
        "languages": [l.dict() for l in (resume_in.languages or [])]
    }
    
    resume = Resume(
        user_id=current_user.id,
        title=resume_in.title or "My Resume",
        template=resume_in.template or "modern",
        full_name=resume_in.full_name or current_user.name,
        email=resume_in.email or current_user.email,
        phone=resume_in.phone or "",
        location=resume_in.location or "",
        linkedin=resume_in.linkedin or "",
        github=resume_in.github or "",
        portfolio=resume_in.portfolio or "",
        summary=resume_in.summary or "",
        content=content_payload,
        version=1,
        is_primary=True
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return serialize_resume(resume)

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return serialize_resume(resume)

@router.put("/{resume_id}", response_model=ResumeResponse)
def update_resume(
    resume_id: int,
    resume_in: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    resume.title = resume_in.title or resume.title
    resume.template = resume_in.template or resume.template
    resume.full_name = resume_in.full_name
    resume.email = resume_in.email
    resume.phone = resume_in.phone
    resume.location = resume_in.location
    resume.linkedin = resume_in.linkedin
    resume.github = resume_in.github
    resume.portfolio = resume_in.portfolio
    resume.summary = resume_in.summary
    
    resume.content = {
        "education": [e.dict() if hasattr(e, 'dict') else e for e in (resume_in.education or [])],
        "experience": [e.dict() if hasattr(e, 'dict') else e for e in (resume_in.experience or [])],
        "projects": [p.dict() if hasattr(p, 'dict') else p for p in (resume_in.projects or [])],
        "skills": [s.dict() if hasattr(s, 'dict') else s for s in (resume_in.skills or [])],
        "certifications": [c.dict() if hasattr(c, 'dict') else c for c in (resume_in.certifications or [])],
        "achievements": [a.dict() if hasattr(a, 'dict') else a for a in (resume_in.achievements or [])],
        "languages": [l.dict() if hasattr(l, 'dict') else l for l in (resume_in.languages or [])]
    }
    resume.version = (resume.version or 1) + 1
    
    db.commit()
    db.refresh(resume)
    return serialize_resume(resume)

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully."}

@router.post("/upload", response_model=ResumeResponse)
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename.lower()
    if not (filename.endswith(".pdf") or filename.endswith(".docx") or filename.endswith(".txt")):
        raise HTTPException(
            status_code=400,
            detail="Unable to analyze this file. Please upload a PDF or DOCX resume."
        )
        
    try:
        contents = await file.read()
        extracted_links = []
        if filename.endswith(".pdf"):
            raw_text, extracted_links = extract_pdf_data(contents)
        elif filename.endswith(".docx"):
            raw_text = extract_text_from_docx(contents)
        else:
            raw_text = contents.decode("utf-8", errors="ignore")
            
        parsed = parse_resume_sections(raw_text, extracted_links=extracted_links)
        
        # Construct complete content object from high-fidelity parser
        content_payload = {
            "headline": parsed.get("headline", ""),
            "education": parsed.get("education", []),
            "experience": parsed.get("experience", []),
            "projects": parsed.get("projects", []),
            "skills": parsed.get("skills", []),
            "certifications": parsed.get("certifications", []),
            "achievements": parsed.get("achievements", []),
            "languages": [{"language": "English", "proficiency": "Fluent"}]
        }
        
        resume = Resume(
            user_id=current_user.id,
            title=f"{file.filename.split('.')[0]}",
            template="academic",
            full_name=parsed.get("full_name") or current_user.name,
            email=parsed.get("email") or current_user.email,
            phone=parsed.get("phone") or "",
            location=parsed.get("location") or "",
            linkedin=parsed.get("linkedin") or "",
            github=parsed.get("github") or "",
            portfolio="",
            summary=parsed.get("summary") or "",
            content=content_payload,
            version=1,
            is_primary=True
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return serialize_resume(resume)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process uploaded file: {str(e)}")

@router.post("/enhance", response_model=ResumeEnhanceResponse)
async def enhance_resume_section(
    request: ResumeEnhanceRequest,
    current_user: User = Depends(get_current_user)
):
    result = await ai_service.improve_resume_content(
        section_type=request.section_type,
        original_text=request.original_text,
        context_role=request.context_role,
        context_tech=request.context_tech
    )
    return result

def get_user_for_download(
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
) -> User:
    jwt_token = None
    if authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split(" ", 1)[1].strip()
    elif token:
        jwt_token = token.strip()

    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to download resume. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(jwt_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired download token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims.",
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    return user

@router.get("/{resume_id}/pdf")
def download_resume_pdf(
    resume_id: int,
    current_user: User = Depends(get_user_for_download),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    resume_data = serialize_resume(resume)
    try:
        pdf_bytes = generate_resume_pdf(resume_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating resume PDF: {str(e)}")
    
    clean_name = "".join(c for c in (resume.full_name or "Resume") if c.isalnum() or c in (" ", "_", "-")).strip()
    clean_name = clean_name.replace(" ", "_") if clean_name else "Resume"
    safe_filename = f"{clean_name}_ATS_Resume.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "Content-Type": "application/pdf"
        }
    )
