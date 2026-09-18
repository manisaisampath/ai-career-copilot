from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.database.models import User, Resume, JobDescription, ATSAnalysis, Interview, CareerInsight
from app.schemas.career import DashboardSummaryResponse, CareerInsightResponse, ActivityItem
from app.routers.auth import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/career", tags=["Career Guidance & Insights"])

@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Check Resumes
    primary_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()).first()
    has_resume = primary_resume is not None
    
    # 2. Check ATS Analyses
    latest_ats = db.query(ATSAnalysis).filter(ATSAnalysis.user_id == current_user.id).order_by(ATSAnalysis.created_at.desc()).first()
    has_ats = latest_ats is not None
    latest_job = None
    if latest_ats:
        latest_job = db.query(JobDescription).filter(JobDescription.id == latest_ats.job_description_id).first()
        
    # 3. Check Interviews
    latest_interview = db.query(Interview).filter(Interview.user_id == current_user.id).order_by(Interview.created_at.desc()).first()
    has_interview = latest_interview is not None
    
    # 4. Compute recommendations and focus areas
    top_focus_areas = []
    recommended_next_step = ""
    
    if not has_resume:
        recommended_next_step = "Create or upload your first resume to start your career analysis."
        top_focus_areas = ["Build ATS-friendly resume", "Document core projects", "List technical skills"]
    elif not has_ats:
        recommended_next_step = f"Match your resume against a target '{current_user.target_role or 'Software Engineer'}' job description to identify missing keywords."
        top_focus_areas = ["Target job alignment", "ATS keyword scanning", "Skill gap analysis"]
    elif not has_interview:
        recommended_next_step = f"Practice a personalized AI mock interview based on your projects and the '{latest_job.title if latest_job else current_user.target_role}' role."
        top_focus_areas = ["Technical project articulation", "Behavioral questions", "Interview confidence"]
    else:
        # User has completed all steps
        if latest_ats.overall_score < 75:
            missing_skills_sample = latest_ats.missing_keywords[:2] if latest_ats.missing_keywords else ["deployment", "cloud"]
            recommended_next_step = f"Strengthen your resume by addressing missing keywords: {', '.join(missing_skills_sample)}."
        elif (latest_interview.overall_score or 0) < 75:
            recommended_next_step = "Continue practicing your project architecture explanations to boost your interview response quality."
        else:
            recommended_next_step = f"Your profile is well-aligned for {latest_job.title if latest_job else 'your target role'}. You are ready to submit applications with confidence!"
            
        if latest_ats.missing_keywords:
            top_focus_areas.extend([f"Add evidence for {k}" for k in latest_ats.missing_keywords[:3]])
        else:
            top_focus_areas = ["Maintain active interview practice", "Refine project metrics", "Review system design concepts"]
            
    # Compile recent activity feed
    activities: List[ActivityItem] = []
    if primary_resume:
        activities.append(ActivityItem(
            id=f"resume-{primary_resume.id}",
            type="resume_update",
            title=f"Updated Resume: {primary_resume.title}",
            description="Resume draft saved and ATS formatted.",
            timestamp=primary_resume.updated_at
        ))
    if latest_ats and latest_job:
        activities.append(ActivityItem(
            id=f"ats-{latest_ats.id}",
            type="ats_analysis",
            title=f"Analyzed against {latest_job.title}",
            description=f"Achieved {latest_ats.overall_score:.0f}/100 ATS Compatibility ({latest_ats.match_level}).",
            timestamp=latest_ats.created_at,
            score=latest_ats.overall_score
        ))
    if latest_interview:
        activities.append(ActivityItem(
            id=f"interview-{latest_interview.id}",
            type="interview_completed",
            title=f"Completed {latest_interview.type.title()} Mock Interview",
            description=f"Readiness score: {latest_interview.overall_score or 75:.0f}% with personalized feedback.",
            timestamp=latest_interview.created_at,
            score=latest_interview.overall_score
        ))
        
    activities.sort(key=lambda x: x.timestamp, reverse=True)

    return {
        "user_name": current_user.name,
        "has_resume": has_resume,
        "resume_title": primary_resume.title if primary_resume else None,
        "resume_id": primary_resume.id if primary_resume else None,
        "resume_last_updated": primary_resume.updated_at if primary_resume else None,
        
        "has_ats_analysis": has_ats,
        "latest_ats_score": latest_ats.overall_score if latest_ats else None,
        "latest_job_title": latest_job.title if latest_job else None,
        "latest_job_company": latest_job.company if latest_job else None,
        "latest_match_level": latest_ats.match_level if latest_ats else None,
        "latest_ats_id": latest_ats.id if latest_ats else None,
        
        "has_interview": has_interview,
        "latest_interview_score": latest_interview.overall_score if latest_interview else None,
        "latest_interview_id": latest_interview.id if latest_interview else None,
        "interview_readiness_score": latest_interview.overall_score if latest_interview else (70.0 if has_resume and has_ats else None),
        
        "recommended_next_step": recommended_next_step,
        "top_focus_areas": top_focus_areas[:4],
        "recent_activities": activities[:5]
    }

@router.get("/insights", response_model=CareerInsightResponse)
def get_career_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest_ats = db.query(ATSAnalysis).filter(ATSAnalysis.user_id == current_user.id).order_by(ATSAnalysis.created_at.desc()).first()
    latest_interview = db.query(Interview).filter(Interview.user_id == current_user.id).order_by(Interview.created_at.desc()).first()
    
    resume_score = latest_ats.overall_score if latest_ats else 0.0
    interview_score = latest_interview.overall_score if latest_interview and latest_interview.overall_score else 0.0
    missing_skills = latest_ats.missing_keywords if latest_ats and latest_ats.missing_keywords else []
    
    top_improvements = []
    if missing_skills:
        top_improvements.extend([f"Add verified experience with {s}" for s in missing_skills[:2]])
    if interview_score and interview_score < 75:
        top_improvements.append("Refine technical trade-off explanations during mock interviews")
    else:
        top_improvements.append("Highlight production deployment and cloud experience")
        
    if not resume_score and not interview_score:
        rec = "Begin by building an ATS-ready resume and analyzing it against target openings."
    elif resume_score < 70:
        rec = "Update your resume skills and project descriptions with targeted domain keywords."
    elif not interview_score:
        rec = "Your resume shows strong alignment. Practice a personalized AI mock interview to test verbal readiness."
    else:
        rec = "Maintain consistency: re-analyze resumes for new job postings and review response feedback."
        
    insight = CareerInsight(
        user_id=current_user.id,
        resume_alignment=resume_score,
        interview_readiness=interview_score,
        top_improvements=top_improvements,
        recommended_step=rec,
        priority="high" if (resume_score < 60 or (interview_score > 0 and interview_score < 60)) else "normal"
    )
    
    return {
        "id": 1,
        "user_id": current_user.id,
        "resume_alignment": resume_score,
        "interview_readiness": interview_score,
        "top_improvements": top_improvements,
        "recommended_step": rec,
        "priority": insight.priority,
        "created_at": datetime.utcnow()
    }
