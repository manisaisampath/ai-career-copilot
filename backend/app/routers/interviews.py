from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database.session import get_db
from app.database.models import User, Resume, JobDescription, Interview, InterviewQuestion, InterviewAnswer
from app.schemas.interview import (
    InterviewCreateRequest, InterviewAnswerSubmit, InterviewAnswerEvaluation,
    InterviewQuestionResponse, InterviewResponse, InterviewReportResponse
)
from app.routers.auth import get_current_user
from app.services.ai_service import ai_service
from app.routers.resumes import serialize_resume

router = APIRouter(prefix="/interviews", tags=["AI Mock Interviews"])

def serialize_interview(interview: Interview, db: Session) -> Dict[str, Any]:
    job = db.query(JobDescription).filter(JobDescription.id == interview.job_description_id).first()
    
    questions_data = []
    for q in interview.questions:
        ans_data = None
        if q.answer:
            ans_data = {
                "id": q.answer.id,
                "question_id": q.answer.question_id,
                "answer": q.answer.answer,
                "relevance_score": q.answer.relevance_score or 0.0,
                "technical_score": q.answer.technical_score or 0.0,
                "completeness_score": q.answer.completeness_score or 0.0,
                "clarity_score": q.answer.clarity_score or 0.0,
                "overall_score": q.answer.overall_score or 0.0,
                "feedback": q.answer.feedback or "",
                "strong_points": q.answer.strong_points or [],
                "improvement_areas": q.answer.improvement_areas or []
            }
        questions_data.append({
            "id": q.id,
            "interview_id": q.interview_id,
            "question": q.question,
            "category": q.category,
            "context_project": q.context_project,
            "order_index": q.order_index,
            "answer": ans_data
        })
        
    return {
        "id": interview.id,
        "user_id": interview.user_id,
        "resume_id": interview.resume_id,
        "job_description_id": interview.job_description_id,
        "type": interview.type,
        "status": interview.status,
        "overall_score": interview.overall_score,
        "technical_score": interview.technical_score,
        "relevance_score": interview.relevance_score,
        "completeness_score": interview.completeness_score,
        "clarity_score": interview.clarity_score,
        "summary": interview.summary,
        "strong_areas": interview.strong_areas or [],
        "improvement_areas": interview.improvement_areas or [],
        "recommended_practice": interview.recommended_practice or [],
        "created_at": interview.created_at,
        "questions": questions_data,
        "job_title": job.title if job else "Target Role",
        "job_company": job.company if job else ""
    }

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    request: InterviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == request.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    job = db.query(JobDescription).filter(JobDescription.id == request.job_description_id, JobDescription.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")
        
    resume_data = serialize_resume(resume)
    job_data = {
        "title": job.title,
        "company": job.company,
        "description": job.description
    }
    
    # Generate personalized questions referencing user's actual projects & skills
    raw_questions = await ai_service.generate_personalized_interview_questions(
        resume_data=resume_data,
        job_data=job_data,
        interview_type=request.type or "mixed",
        count=request.num_questions or 5
    )
    
    interview = Interview(
        user_id=current_user.id,
        resume_id=resume.id,
        job_description_id=job.id,
        type=request.type or "mixed",
        status="in_progress"
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    for q in raw_questions:
        iq = InterviewQuestion(
            interview_id=interview.id,
            question=q["question"],
            category=q.get("category", "technical"),
            context_project=q.get("context_project"),
            order_index=q.get("order_index", 1)
        )
        db.add(iq)
    db.commit()
    db.refresh(interview)
    
    return serialize_interview(interview, db)

@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return serialize_interview(interview, db)

@router.post("/{interview_id}/answer", response_model=InterviewAnswerEvaluation)
async def submit_answer(
    interview_id: int,
    submission: InterviewAnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")
        
    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == submission.question_id,
        InterviewQuestion.interview_id == interview.id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found in this interview.")
        
    job = db.query(JobDescription).filter(JobDescription.id == interview.job_description_id).first()
    
    # Evaluate answer with AI service
    eval_result = await ai_service.evaluate_interview_answer(
        question_text=question.question,
        user_answer=submission.answer,
        context_project=question.context_project,
        target_role=job.title if job else "Software Engineer"
    )
    
    # Check if answer already exists
    existing_ans = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == question.id).first()
    if existing_ans:
        existing_ans.answer = submission.answer
        existing_ans.relevance_score = eval_result["relevance_score"]
        existing_ans.technical_score = eval_result["technical_score"]
        existing_ans.completeness_score = eval_result["completeness_score"]
        existing_ans.clarity_score = eval_result["clarity_score"]
        existing_ans.overall_score = eval_result["overall_score"]
        existing_ans.feedback = eval_result["feedback"]
        existing_ans.strong_points = eval_result["strong_points"]
        existing_ans.improvement_areas = eval_result["improvement_areas"]
        db.commit()
        db.refresh(existing_ans)
        ans_obj = existing_ans
    else:
        ans_obj = InterviewAnswer(
            question_id=question.id,
            answer=submission.answer,
            relevance_score=eval_result["relevance_score"],
            technical_score=eval_result["technical_score"],
            completeness_score=eval_result["completeness_score"],
            clarity_score=eval_result["clarity_score"],
            overall_score=eval_result["overall_score"],
            feedback=eval_result["feedback"],
            strong_points=eval_result["strong_points"],
            improvement_areas=eval_result["improvement_areas"]
        )
        db.add(ans_obj)
        db.commit()
        db.refresh(ans_obj)
        
    # Re-calculate overall interview score if all answered
    all_questions = db.query(InterviewQuestion).filter(InterviewQuestion.interview_id == interview.id).all()
    answered_count = 0
    tot_tech, tot_rel, tot_comp, tot_clar = 0.0, 0.0, 0.0, 0.0
    all_strong, all_improve = [], []
    
    for q in all_questions:
        if q.answer:
            answered_count += 1
            tot_tech += (q.answer.technical_score or 0)
            tot_rel += (q.answer.relevance_score or 0)
            tot_comp += (q.answer.completeness_score or 0)
            tot_clar += (q.answer.clarity_score or 0)
            if q.answer.strong_points:
                all_strong.extend(q.answer.strong_points[:1])
            if q.answer.improvement_areas:
                all_improve.extend(q.answer.improvement_areas[:1])
                
    if answered_count > 0:
        avg_tech = round(tot_tech / answered_count, 1)
        avg_rel = round(tot_rel / answered_count, 1)
        avg_comp = round(tot_comp / answered_count, 1)
        avg_clar = round(tot_clar / answered_count, 1)
        avg_overall = round((avg_tech * 0.35) + (avg_rel * 0.25) + (avg_comp * 0.25) + (avg_clar * 0.15), 1)
        
        interview.technical_score = avg_tech
        interview.relevance_score = avg_rel
        interview.completeness_score = avg_comp
        interview.clarity_score = avg_clar
        interview.overall_score = avg_overall
        interview.strong_areas = list(set(all_strong))[:3]
        interview.improvement_areas = list(set(all_improve))[:3]
        
        # Recommended practice based on target role
        interview.recommended_practice = [
            "System Architecture and Trade-off Explanation",
            "Database Indexing and Query Performance",
            "API Security, Rate Limiting and Resilience"
        ]
        
        if answered_count == len(all_questions):
            interview.status = "completed"
            interview.summary = f"Mock interview completed with an estimated {avg_overall:.0f}/100 readiness score. Solid technical foundation; practice framing answers with concrete trade-off metrics."
            
        db.commit()

    return {
        "id": ans_obj.id,
        "question_id": ans_obj.question_id,
        "answer": ans_obj.answer,
        "relevance_score": ans_obj.relevance_score or 0.0,
        "technical_score": ans_obj.technical_score or 0.0,
        "completeness_score": ans_obj.completeness_score or 0.0,
        "clarity_score": ans_obj.clarity_score or 0.0,
        "overall_score": ans_obj.overall_score or 0.0,
        "feedback": ans_obj.feedback or "",
        "strong_points": ans_obj.strong_points or [],
        "improvement_areas": ans_obj.improvement_areas or []
    }

@router.get("/{interview_id}/report", response_model=InterviewReportResponse)
def get_interview_report(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")
        
    job = db.query(JobDescription).filter(JobDescription.id == interview.job_description_id).first()
    
    questions = interview.questions
    answered = [q for q in questions if q.answer is not None]
    total_count = len(questions)
    answered_count = len(answered)
    
    eval_list = []
    substantive_answered = 0
    for q in answered:
        ans_obj = q.answer
        if ans_obj.overall_score and ans_obj.overall_score > 0:
            substantive_answered += 1
        eval_list.append({
            "question_id": q.id,
            "question": q.question,
            "category": q.category,
            "context_project": q.context_project,
            "answer": ans_obj.answer,
            "score": ans_obj.overall_score or 0.0,
            "feedback": ans_obj.feedback or "No substantive response provided.",
            "strong_points": ans_obj.strong_points or [],
            "improvement_areas": ans_obj.improvement_areas or []
        })
        
    # If candidate answered 0 questions or all answers were skipped/empty
    if substantive_answered == 0:
        return {
            "interview_id": interview.id,
            "job_title": job.title if job else "Target Role",
            "job_company": job.company if job else "",
            "interview_type": interview.type,
            "overall_score": 0.0,
            "technical_score": 0.0,
            "relevance_score": 0.0,
            "completeness_score": 0.0,
            "clarity_score": 0.0,
            "summary": "Incomplete Interview Session: 0 questions were answered (0/100). To test your interview readiness and receive meaningful AI evaluations, please answer each question explaining your technical decisions, architecture, and project implementations.",
            "strong_areas": ["No answers submitted - all interview questions were skipped or left empty."],
            "improvement_areas": [
                "Answer each question directly instead of skipping",
                "Describe technical architecture and framework choices",
                "Provide concrete project implementation details and metrics"
            ],
            "recommended_practice": [
                "Structure technical answers with Situation, Task, Action, Result (STAR)",
                "Review core architecture decisions from your uploaded projects",
                "Practice explaining algorithmic trade-offs aloud"
            ],
            "answered_questions_count": answered_count,
            "total_questions_count": total_count,
            "question_evaluations": eval_list
        }
        
    # Factor completion ratio into scores
    completion_ratio = substantive_answered / max(total_count, 1)
    base_tech = interview.technical_score if interview.technical_score is not None else 0.0
    base_rel = interview.relevance_score if interview.relevance_score is not None else 0.0
    base_comp = interview.completeness_score if interview.completeness_score is not None else 0.0
    base_clar = interview.clarity_score if interview.clarity_score is not None else 0.0
    base_overall = interview.overall_score if interview.overall_score is not None else 0.0
    
    final_tech = round(base_tech * completion_ratio, 1)
    final_rel = round(base_rel * completion_ratio, 1)
    final_comp = round(base_comp * completion_ratio, 1)
    final_clar = round(base_clar * completion_ratio, 1)
    final_overall = round(base_overall * completion_ratio, 1)
    
    improve_list = list(interview.improvement_areas or [])
    if substantive_answered < total_count:
        improve_list.insert(0, f"Complete all questions ({total_count - substantive_answered} left unanswered or skipped)")

    return {
        "interview_id": interview.id,
        "job_title": job.title if job else "Target Role",
        "job_company": job.company if job else "",
        "interview_type": interview.type,
        "overall_score": final_overall,
        "technical_score": final_tech,
        "relevance_score": final_rel,
        "completeness_score": final_comp,
        "clarity_score": final_clar,
        "summary": interview.summary or f"Mock interview evaluation: {substantive_answered} of {total_count} questions answered.",
        "strong_areas": interview.strong_areas if interview.strong_areas else ["Addressed technical interview questions."],
        "improvement_areas": improve_list[:4],
        "recommended_practice": interview.recommended_practice or ["System design patterns", "API performance optimization"],
        "answered_questions_count": answered_count,
        "total_questions_count": total_count,
        "question_evaluations": eval_list
    }
