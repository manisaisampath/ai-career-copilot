from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ATSAnalysisRequest(BaseModel):
    resume_id: int
    job_description_id: Optional[int] = None
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    job_description_text: Optional[str] = None

class SkillAlignmentItem(BaseModel):
    skill: str
    category: Optional[str] = "Technical"
    matched: bool
    status: str  # "matched" | "missing"

class OptimizationSuggestion(BaseModel):
    id: str
    type: str  # keyword | skill | bullet_point | summary | experience
    title: str
    target_section: str
    severity: str  # high | medium | low
    recommendation: str
    current_text: Optional[str] = ""
    suggested_text: Optional[str] = ""
    applied: Optional[bool] = False
    applied_text: Optional[str] = ""
    previous_text: Optional[str] = ""

class ATSGapResponse(BaseModel):
    id: int
    type: str
    item: str
    severity: str
    recommendation: str

class ATSAnalysisResponse(BaseModel):
    id: int
    resume_id: int
    job_description_id: int
    user_id: int
    
    overall_score: float
    skills_score: float
    keyword_score: float
    experience_score: float
    education_score: float
    semantic_score: float
    structure_score: float
    
    match_level: str
    summary: Optional[str] = ""
    
    working_points: List[str] = []
    attention_points: List[str] = []
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    skill_alignment: List[SkillAlignmentItem] = []
    optimization_suggestions: List[OptimizationSuggestion] = []
    
    job_title: Optional[str] = ""
    job_company: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True

class ApplySuggestionRequest(BaseModel):
    suggestion_id: str
    target_section: str
    applied_text: str
    item_id: Optional[int] = None
