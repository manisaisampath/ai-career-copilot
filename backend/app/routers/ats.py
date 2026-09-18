from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
import json
import copy
from app.database.session import get_db
from app.database.models import User, Resume, JobDescription, ATSAnalysis, ATSGap, CareerInsight
from app.schemas.ats import (
    ATSAnalysisRequest, ATSAnalysisResponse, ApplySuggestionRequest,
    SkillAlignmentItem, OptimizationSuggestion
)
from app.routers.auth import get_current_user
from app.services.ats_scorer import analyze_ats_compatibility
from app.services.nlp_parser import extract_skills_from_text, extract_keywords_from_text
from app.routers.resumes import serialize_resume

router = APIRouter(prefix="/ats", tags=["ATS Analysis"])

def build_raw_resume_text(resume: Resume) -> str:
    """Builds a comprehensive raw text representation of a resume for NLP scoring."""
    parts = []
    if resume.full_name: parts.append(resume.full_name)
    if resume.summary: parts.append(resume.summary)
    
    content = resume.content or {}
    # Skills
    skills = content.get("skills", [])
    if skills:
        skill_names = [s.get("skill_name") if isinstance(s, dict) else str(s) for s in skills]
        parts.append("Skills: " + ", ".join(skill_names))
        
    # Experience
    for exp in content.get("experience", []):
        parts.append(f"{exp.get('role', '')} at {exp.get('company', '')}: {exp.get('description', '')}")
        
    # Projects
    for proj in content.get("projects", []):
        parts.append(f"Project {proj.get('title', '')} ({proj.get('technologies', '')}): {proj.get('description', '')}")
        
    # Education
    for edu in content.get("education", []):
        parts.append(f"{edu.get('degree', '')} in {edu.get('field', '')} at {edu.get('institution', '')}")
        
    # Certifications & achievements
    for cert in content.get("certifications", []):
        parts.append(f"Certification: {cert.get('name', '')} {cert.get('issuer', '')}")
    for ach in content.get("achievements", []):
        parts.append(f"Achievement: {ach.get('title', '')} {ach.get('description', '')}")
        
    return "\n".join(parts)

@router.post("/analyze", response_model=ATSAnalysisResponse, status_code=status.HTTP_201_CREATED)
def run_ats_analysis(
    request: ATSAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch Resume
    resume = db.query(Resume).filter(Resume.id == request.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    # Fetch or Create Job Description
    target_job_id = request.job_description_id or request.job_id
    if target_job_id:
        job = db.query(JobDescription).filter(JobDescription.id == target_job_id, JobDescription.user_id == current_user.id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job description not found.")
    elif request.job_description_text and request.job_title:
        # Create on the fly
        skills_ext = [s["skill_name"] for s in extract_skills_from_text(request.job_description_text + " " + request.job_title)]
        kw_ext = extract_keywords_from_text(request.job_description_text, top_k=20)
        job = JobDescription(
            user_id=current_user.id,
            title=request.job_title.strip(),
            company=request.job_company.strip() if request.job_company else "",
            description=request.job_description_text.strip(),
            extracted_skills=skills_ext,
            extracted_keywords=kw_ext
        )
        db.add(job)
        db.commit()
        db.refresh(job)
    else:
        raise HTTPException(status_code=400, detail="Please provide a valid Job Description or Job ID.")

    raw_resume_text = build_raw_resume_text(resume)
    resume_data = serialize_resume(resume)
    
    # Run 6-pillar analysis
    results = analyze_ats_compatibility(
        resume_data=resume_data,
        raw_resume_text=raw_resume_text,
        job_title=job.title,
        job_description=job.description
    )
    
    analysis = ATSAnalysis(
        user_id=current_user.id,
        resume_id=resume.id,
        job_description_id=job.id,
        overall_score=results["overall_score"],
        skills_score=results["skills_score"],
        keyword_score=results["keyword_score"],
        experience_score=results["experience_score"],
        education_score=results["education_score"],
        semantic_score=results["semantic_score"],
        structure_score=results["structure_score"],
        match_level=results["match_level"],
        summary=results["summary"],
        working_points=results["working_points"],
        attention_points=results["attention_points"],
        matched_keywords=results["matched_keywords"],
        missing_keywords=results["missing_keywords"],
        skill_alignment=results["skill_alignment"],
        optimization_suggestions=results["optimization_suggestions"]
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Populate ATS gaps
    for gap in results["attention_points"]:
        db.add(ATSGap(
            analysis_id=analysis.id,
            type="weak_section",
            item=gap,
            severity="medium",
            recommendation=gap
        ))
    for ms in results["missing_keywords"][:5]:
        db.add(ATSGap(
            analysis_id=analysis.id,
            type="missing_keyword",
            item=ms,
            severity="high",
            recommendation=f"Add demonstrated experience with {ms} if applicable."
        ))
    db.commit()
    
    return {
        "id": analysis.id,
        "resume_id": analysis.resume_id,
        "job_description_id": analysis.job_description_id,
        "user_id": analysis.user_id,
        "overall_score": analysis.overall_score,
        "skills_score": analysis.skills_score,
        "keyword_score": analysis.keyword_score,
        "experience_score": analysis.experience_score,
        "education_score": analysis.education_score,
        "semantic_score": analysis.semantic_score,
        "structure_score": analysis.structure_score,
        "match_level": analysis.match_level,
        "summary": analysis.summary,
        "working_points": analysis.working_points or [],
        "attention_points": analysis.attention_points or [],
        "matched_keywords": analysis.matched_keywords or [],
        "missing_keywords": analysis.missing_keywords or [],
        "skill_alignment": analysis.skill_alignment or [],
        "optimization_suggestions": analysis.optimization_suggestions or [],
        "job_title": job.title,
        "job_company": job.company,
        "created_at": analysis.created_at
    }

@router.get("/{analysis_id}", response_model=ATSAnalysisResponse)
def get_ats_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(ATSAnalysis).filter(ATSAnalysis.id == analysis_id, ATSAnalysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="ATS analysis not found.")
        
    job = db.query(JobDescription).filter(JobDescription.id == analysis.job_description_id).first()
    return {
        "id": analysis.id,
        "resume_id": analysis.resume_id,
        "job_description_id": analysis.job_description_id,
        "user_id": analysis.user_id,
        "overall_score": analysis.overall_score,
        "skills_score": analysis.skills_score,
        "keyword_score": analysis.keyword_score,
        "experience_score": analysis.experience_score,
        "education_score": analysis.education_score,
        "semantic_score": analysis.semantic_score,
        "structure_score": analysis.structure_score,
        "match_level": analysis.match_level,
        "summary": analysis.summary,
        "working_points": analysis.working_points or [],
        "attention_points": analysis.attention_points or [],
        "matched_keywords": analysis.matched_keywords or [],
        "missing_keywords": analysis.missing_keywords or [],
        "skill_alignment": analysis.skill_alignment or [],
        "optimization_suggestions": analysis.optimization_suggestions or [],
        "job_title": job.title if job else "",
        "job_company": job.company if job else "",
        "created_at": analysis.created_at
    }

@router.get("/resume/{resume_id}/latest", response_model=Optional[ATSAnalysisResponse])
def get_latest_ats_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(ATSAnalysis).filter(
        ATSAnalysis.resume_id == resume_id,
        ATSAnalysis.user_id == current_user.id
    ).order_by(ATSAnalysis.created_at.desc()).first()
    
    if not analysis:
        return None
        
    job = db.query(JobDescription).filter(JobDescription.id == analysis.job_description_id).first()
    return {
        "id": analysis.id,
        "resume_id": analysis.resume_id,
        "job_description_id": analysis.job_description_id,
        "user_id": analysis.user_id,
        "overall_score": analysis.overall_score,
        "skills_score": analysis.skills_score,
        "keyword_score": analysis.keyword_score,
        "experience_score": analysis.experience_score,
        "education_score": analysis.education_score,
        "semantic_score": analysis.semantic_score,
        "structure_score": analysis.structure_score,
        "match_level": analysis.match_level,
        "summary": analysis.summary,
        "working_points": analysis.working_points or [],
        "attention_points": analysis.attention_points or [],
        "matched_keywords": analysis.matched_keywords or [],
        "missing_keywords": analysis.missing_keywords or [],
        "skill_alignment": analysis.skill_alignment or [],
        "optimization_suggestions": analysis.optimization_suggestions or [],
        "job_title": job.title if job else "",
        "job_company": job.company if job else "",
        "created_at": analysis.created_at
    }

@router.post("/{analysis_id}/apply-suggestion")
def apply_optimization_suggestion(
    analysis_id: int,
    request: ApplySuggestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(ATSAnalysis).filter(ATSAnalysis.id == analysis_id, ATSAnalysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="ATS analysis not found.")
        
    resume = db.query(Resume).filter(Resume.id == analysis.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    content = copy.deepcopy(resume.content or {})
    target_sec = (request.target_section or "").lower().strip()
    applied_text = (request.applied_text or "").strip()
    
    previous_value = ""
    
    if target_sec in ["skills", "skill", "technical_skills"]:
        skills = content.get("skills", [])
        # Non-skill verbs and generic boilerplate words that should NEVER be added to technical skills
        NON_TECHNICAL_EXCLUSIONS = {
            "seeking", "seek", "design", "designs", "looking", "look", "join", "responsible", 
            "ensure", "create", "support", "deliver", "help", "build", "maintain", "collaborate", 
            "work", "working", "candidate", "role", "team", "plus", "preferred", "strong", 
            "proven", "daily", "fast", "paced", "environment", "lead", "learn"
        }
        # Support single keyword or comma-separated keywords
        items_to_add = [
            k.strip() for k in applied_text.split(",") 
            if k.strip() and k.strip().lower() not in NON_TECHNICAL_EXCLUSIONS and len(k.strip()) > 1
        ]
        for item in items_to_add:
            exists = any(
                (s.get("skill_name", "").strip().lower() == item.lower()) if isinstance(s, dict) else (str(s).strip().lower() == item.lower())
                for s in skills
            )
            if not exists:
                skills.append({"skill_name": item, "category": "Technical"})
        content["skills"] = skills
        resume.content = content
        flag_modified(resume, "content")
        
    elif target_sec in ["summary", "professional_summary"]:
        previous_value = resume.summary or ""
        resume.summary = applied_text
        content["summary"] = applied_text
        resume.content = content
        flag_modified(resume, "content")
        
    elif target_sec in ["projects", "project"]:
        projects = content.get("projects", [])
        if projects and len(projects) > 0:
            proj_idx = 0
            if request.suggestion_id and "opt-proj-" in request.suggestion_id:
                try:
                    idx_val = int(request.suggestion_id.split("-")[-1])
                    if 0 <= idx_val < len(projects):
                        proj_idx = idx_val
                except (ValueError, IndexError):
                    proj_idx = 0
            previous_value = projects[proj_idx].get("description", "")
            projects[proj_idx]["description"] = applied_text
        else:
            projects.append({
                "title": "Key Project",
                "technologies": "",
                "description": applied_text,
                "link": ""
            })
        content["projects"] = projects
        resume.content = content
        flag_modified(resume, "content")

    elif target_sec in ["experience", "experiences", "work_experience"]:
        experience = content.get("experience", [])
        if experience and len(experience) > 0:
            exp_idx = 0
            if request.suggestion_id and "opt-exp-" in request.suggestion_id:
                try:
                    idx_val = int(request.suggestion_id.split("-")[-1])
                    if 0 <= idx_val < len(experience):
                        exp_idx = idx_val
                except (ValueError, IndexError):
                    exp_idx = 0
            previous_value = experience[exp_idx].get("description", "")
            experience[exp_idx]["description"] = applied_text
        else:
            experience.append({
                "company": "Company",
                "role": "Software Engineer",
                "description": applied_text,
                "start_date": "",
                "end_date": ""
            })
        content["experience"] = experience
        resume.content = content
        flag_modified(resume, "content")

    # Mark the suggestion as applied in the ATS analysis record
    opt_suggestions = copy.deepcopy(analysis.optimization_suggestions or [])
    for s in opt_suggestions:
        if s.get("id") == request.suggestion_id or (
            s.get("target_section", "").lower().strip() == target_sec and (
                s.get("suggested_text", "").strip() == applied_text or s.get("applied_text", "").strip() == applied_text
            )
        ):
            s["applied"] = True
            s["applied_text"] = applied_text
            if previous_value:
                s["previous_text"] = previous_value
    analysis.optimization_suggestions = opt_suggestions
    flag_modified(analysis, "optimization_suggestions")
            
    resume.version = (resume.version or 1) + 1
    db.commit()
    db.refresh(resume)
    db.refresh(analysis)
    
    return {
        "success": True,
        "message": f"Successfully applied suggestion to {request.target_section}.",
        "resume": serialize_resume(resume),
        "analysis": {
            "id": analysis.id,
            "optimization_suggestions": analysis.optimization_suggestions
        }
    }

@router.post("/{analysis_id}/undo-suggestion")
def undo_optimization_suggestion(
    analysis_id: int,
    request: ApplySuggestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(ATSAnalysis).filter(ATSAnalysis.id == analysis_id, ATSAnalysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="ATS analysis not found.")
        
    resume = db.query(Resume).filter(Resume.id == analysis.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    content = copy.deepcopy(resume.content or {})
    target_sec = (request.target_section or "").lower().strip()
    applied_text = (request.applied_text or "").strip()
    
    if target_sec in ["skills", "skill", "technical_skills"]:
        skills = content.get("skills", [])
        skills_to_remove = [k.strip().lower() for k in applied_text.split(",") if k.strip()]
        new_skills = [
            s for s in skills
            if ((s.get("skill_name", "").strip().lower() if isinstance(s, dict) else str(s).strip().lower()) not in skills_to_remove)
        ]
        content["skills"] = new_skills
        resume.content = content
        flag_modified(resume, "content")
        
    elif target_sec in ["summary", "professional_summary"]:
        prev_text = ""
        for s in (analysis.optimization_suggestions or []):
            if s.get("id") == request.suggestion_id:
                prev_text = s.get("previous_text") or s.get("current_text", "")
                break
        resume.summary = prev_text
        content["summary"] = prev_text
        resume.content = content
        flag_modified(resume, "content")
        
    elif target_sec in ["projects", "project"]:
        projects = content.get("projects", [])
        proj_idx = 0
        if request.suggestion_id and "opt-proj-" in request.suggestion_id:
            try:
                idx_val = int(request.suggestion_id.split("-")[-1])
                if 0 <= idx_val < len(projects):
                    proj_idx = idx_val
            except (ValueError, IndexError):
                proj_idx = 0
        if projects and proj_idx < len(projects):
            prev_text = ""
            for s in (analysis.optimization_suggestions or []):
                if s.get("id") == request.suggestion_id:
                    prev_text = s.get("previous_text") or s.get("current_text", "")
                    break
            projects[proj_idx]["description"] = prev_text
            content["projects"] = projects
            resume.content = content
            flag_modified(resume, "content")

    # Mark suggestion as not applied
    opt_suggestions = copy.deepcopy(analysis.optimization_suggestions or [])
    for s in opt_suggestions:
        if s.get("id") == request.suggestion_id:
            s["applied"] = False
            s.pop("applied_text", None)
    analysis.optimization_suggestions = opt_suggestions
    flag_modified(analysis, "optimization_suggestions")
            
    resume.version = (resume.version or 1) + 1
    db.commit()
    db.refresh(resume)
    db.refresh(analysis)
    
    return {
        "success": True,
        "message": f"Successfully reverted suggestion for {request.target_section}.",
        "resume": serialize_resume(resume),
        "analysis": {
            "id": analysis.id,
            "optimization_suggestions": analysis.optimization_suggestions
        }
    }
