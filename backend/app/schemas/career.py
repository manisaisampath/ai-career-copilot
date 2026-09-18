from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CareerInsightResponse(BaseModel):
    id: int
    user_id: int
    resume_alignment: float
    interview_readiness: float
    top_improvements: List[str] = []
    recommended_step: str
    priority: str
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityItem(BaseModel):
    id: str
    type: str  # resume_update | ats_analysis | interview_completed
    title: str
    description: str
    timestamp: datetime
    score: Optional[float] = None

class DashboardSummaryResponse(BaseModel):
    user_name: str
    has_resume: bool
    resume_title: Optional[str] = None
    resume_id: Optional[int] = None
    resume_last_updated: Optional[datetime] = None
    
    has_ats_analysis: bool
    latest_ats_score: Optional[float] = None
    latest_job_title: Optional[str] = None
    latest_job_company: Optional[str] = None
    latest_match_level: Optional[str] = None
    latest_ats_id: Optional[int] = None
    
    has_interview: bool
    latest_interview_score: Optional[float] = None
    latest_interview_id: Optional[int] = None
    interview_readiness_score: Optional[float] = None
    
    recommended_next_step: str
    top_focus_areas: List[str] = []
    recent_activities: List[ActivityItem] = []
