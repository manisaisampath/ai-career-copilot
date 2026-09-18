import math
import re
from typing import Dict, List, Any, Set, Tuple
from app.core.config import settings
from app.services.nlp_parser import (
    extract_skills_from_text,
    extract_keywords_from_text,
    normalize_skill,
    SKILL_TAXONOMY
)

def compute_cosine_similarity(text1: str, text2: str) -> float:
    """Compute cosine similarity between two text strings using term frequencies."""
    words1 = re.findall(r'\b[a-z]{3,}\b', text1.lower())
    words2 = re.findall(r'\b[a-z]{3,}\b', text2.lower())
    
    if not words1 or not words2:
        return 0.5
        
    vec1: Dict[str, int] = {}
    for w in words1:
        vec1[w] = vec1.get(w, 0) + 1
        
    vec2: Dict[str, int] = {}
    for w in words2:
        vec2[w] = vec2.get(w, 0) + 1
        
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])
    
    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    
    if not denominator:
        return 0.0
    return float(numerator) / denominator

def score_structure(resume_data: Dict[str, Any], raw_text: str) -> Tuple[float, List[str], List[str]]:
    """Evaluate structure ATS compatibility: contact info, headings, bullet points, length."""
    points = 0
    max_points = 100
    positives = []
    warnings = []
    
    # 1. Contact info (Name, Email, Phone/LinkedIn)
    has_email = bool(resume_data.get("email")) or bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text))
    has_phone = bool(resume_data.get("phone")) or bool(re.search(r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', raw_text))
    has_name = bool(resume_data.get("full_name"))
    
    if has_name and has_email:
        points += 25
        positives.append("Contact information is complete and easily extractable.")
    else:
        points += 10
        warnings.append("Missing or hard-to-parse email or contact details.")
        
    # 2. Section hierarchy
    sections_count = 0
    if resume_data.get("summary") or "summary" in raw_text.lower() or "about" in raw_text.lower():
        sections_count += 1
    if resume_data.get("experience") or "experience" in raw_text.lower() or "employment" in raw_text.lower():
        sections_count += 1
    if resume_data.get("education") or "education" in raw_text.lower() or "university" in raw_text.lower():
        sections_count += 1
    if resume_data.get("projects") or "project" in raw_text.lower():
        sections_count += 1
    if resume_data.get("skills") or "skills" in raw_text.lower() or "technical" in raw_text.lower():
        sections_count += 1
        
    if sections_count >= 4:
        points += 35
        positives.append("Clear standard section headers that ATS scanners parse reliably.")
    elif sections_count >= 2:
        points += 20
        warnings.append("Consider organizing resume with standard headers: Experience, Education, Skills, Projects.")
    else:
        points += 10
        warnings.append("Lacks standard section separation; may cause ATS parsing failures.")

    # 3. Bullet formatting & action verbs
    action_verbs = ["developed", "built", "implemented", "engineered", "designed", "created", "led", "architected", "deployed", "optimized", "managed", "integrated", "automated", "delivered", "reduced", "scaled"]
    verb_matches = [v for v in action_verbs if v in raw_text.lower()]
    
    if len(verb_matches) >= 5:
        points += 25
        positives.append("Strong action verb usage throughout experience and project descriptions.")
    elif len(verb_matches) >= 2:
        points += 15
        warnings.append("Use stronger action verbs (e.g., 'Engineered', 'Optimized', 'Deployed') at the start of bullet points.")
    else:
        points += 5
        warnings.append("Bullet points lack active verbs describing personal technical contribution.")
        
    # 4. Length / Density
    word_count = len(raw_text.split())
    if 250 <= word_count <= 950:
        points += 15
        positives.append("Optimal document length and content density for ATS scanning.")
    elif word_count < 250:
        points += 5
        warnings.append("Resume appears too brief; expand on project details and technical achievements.")
    else:
        points += 10
        warnings.append("Resume exceeds ideal single/double page density; prioritize top achievements.")
        
    return min(100.0, float(points)), positives, warnings

def score_education(resume_data: Dict[str, Any], raw_text: str, jd_text: str) -> Tuple[float, List[str], List[str]]:
    """Evaluate education match (degree level, CS/engineering field)."""
    text_lower = raw_text.lower()
    jd_lower = jd_text.lower()
    
    degree_keywords = ["bachelor", "master", "b.s", "m.s", "b.tech", "m.tech", "b.e", "m.e", "degree", "computer science", "software engineering", "information technology", "data science", "mathematics"]
    
    found_degrees = [d for d in degree_keywords if d in text_lower]
    jd_requires_degree = any(d in jd_lower for d in ["degree", "bachelor", "master", "bs", "ms", "cs"])
    
    positives = []
    warnings = []
    
    if len(found_degrees) >= 2:
        score = 95.0
        positives.append("Education background aligns with standard industry requirements.")
    elif len(found_degrees) >= 1:
        score = 80.0
        positives.append("Degree or technical education listed.")
    else:
        if jd_requires_degree:
            score = 50.0
            warnings.append("Target job mentions degree requirements; ensure degree and graduation year are clearly listed.")
        else:
            score = 75.0
            
    return score, positives, warnings

def score_experience(resume_data: Dict[str, Any], raw_text: str, jd_text: str) -> Tuple[float, List[str], List[str]]:
    """Evaluate experience alignment, role matching, technical context."""
    text_lower = raw_text.lower()
    jd_lower = jd_text.lower()
    positives = []
    warnings = []
    
    # Check for experience items or text markers
    has_exp_items = bool(resume_data.get("experience"))
    exp_words = ["experience", "worked", "intern", "engineer", "developer", "responsible", "delivered"]
    exp_word_matches = sum(1 for w in exp_words if w in text_lower)
    
    # Check for deployment/production markers
    prod_words = ["deployed", "production", "ci/cd", "docker", "cloud", "aws", "gcp", "azure", "kubernetes", "scaled", "monitored"]
    prod_matches = [w for w in prod_words if w in text_lower]
    
    score = 60.0
    if has_exp_items or exp_word_matches >= 4:
        score += 20.0
        positives.append("Demonstrated professional or internship experience relevant to engineering.")
    else:
        warnings.append("Limited direct work experience listed; emphasize technical projects to compensate.")
        
    if len(prod_matches) >= 2:
        score += 15.0
        positives.append("Clear evidence of deployment and production workflow understanding.")
    else:
        score -= 5.0
        warnings.append("Limited evidence of deployment, CI/CD, or cloud infrastructure exposure.")
        
    return min(100.0, max(30.0, score)), positives, warnings

def analyze_ats_compatibility(
    resume_data: Dict[str, Any],
    raw_resume_text: str,
    job_title: str,
    job_description: str
) -> Dict[str, Any]:
    """
    Run explainable 6-pillar ATS analysis:
    - Skills Match: 30%
    - Keywords Match: 25%
    - Experience Match: 15%
    - Education Match: 10%
    - Semantic Match: 10%
    - Structure: 10%
    """
    # 1. Extract skills from both
    jd_skills = extract_skills_from_text(job_description + " " + job_title)
    resume_skills = extract_skills_from_text(raw_resume_text)
    
    # Also include skills directly passed in resume structured data
    structured_skills = resume_data.get("skills", [])
    for s in structured_skills:
        s_name = s.get("skill_name") if isinstance(s, dict) else str(s)
        if s_name:
            resume_skills.append({
                "skill_name": s_name,
                "category": s.get("category", "Technical") if isinstance(s, dict) else "Technical",
                "normalized": normalize_skill(s_name)
            })
            
    # Normalize skill sets
    jd_skill_map = {s["normalized"]: s for s in jd_skills}
    resume_skill_norms = set(s["normalized"] for s in resume_skills)
    
    matched_skills = []
    missing_skills = []
    skill_alignment_items = []
    
    for norm_skill, s_obj in jd_skill_map.items():
        if norm_skill in resume_skill_norms:
            matched_skills.append(s_obj["skill_name"])
            skill_alignment_items.append({
                "skill": s_obj["skill_name"],
                "category": s_obj["category"],
                "matched": True,
                "status": "matched"
            })
        else:
            missing_skills.append(s_obj["skill_name"])
            skill_alignment_items.append({
                "skill": s_obj["skill_name"],
                "category": s_obj["category"],
                "matched": False,
                "status": "missing"
            })
            
    # Compute Skills Match Score (30%)
    if jd_skill_map:
        skills_score = (len(matched_skills) / len(jd_skill_map)) * 100.0
    else:
        skills_score = 80.0
    skills_score = min(100.0, max(20.0, skills_score))
    
    # 2. Extract Keywords (25%)
    jd_keywords = extract_keywords_from_text(job_description, top_k=25)
    resume_keywords_all = set(extract_keywords_from_text(raw_resume_text, top_k=60))
    resume_text_lower = raw_resume_text.lower()
    
    matched_kw = []
    missing_kw = []
    
    for kw in jd_keywords:
        if kw in resume_keywords_all or kw in resume_text_lower:
            matched_kw.append(kw.title() if len(kw) > 3 else kw.upper())
        else:
            missing_kw.append(kw.title() if len(kw) > 3 else kw.upper())
            
    if jd_keywords:
        keyword_score = (len(matched_kw) / len(jd_keywords)) * 100.0
    else:
        keyword_score = 75.0
    keyword_score = min(100.0, max(25.0, keyword_score))
    
    # 3. Structure Score (10%)
    structure_score, struct_pos, struct_warn = score_structure(resume_data, raw_resume_text)
    
    # 4. Education Score (10%)
    education_score, edu_pos, edu_warn = score_education(resume_data, raw_resume_text, job_description)
    
    # 5. Experience Score (15%)
    experience_score, exp_pos, exp_warn = score_experience(resume_data, raw_resume_text, job_description)
    
    # 6. Semantic Similarity (10%)
    cos_sim = compute_cosine_similarity(raw_resume_text, job_description)
    # Scale cosine sim (usually 0.2 - 0.7) to 0-100
    semantic_score = min(100.0, max(30.0, (cos_sim * 120.0) + 20.0))
    
    # Configurable Weighted Overall Score
    w_skills = settings.ATS_WEIGHT_SKILLS
    w_kw = settings.ATS_WEIGHT_KEYWORDS
    w_exp = settings.ATS_WEIGHT_EXPERIENCE
    w_edu = settings.ATS_WEIGHT_EDUCATION
    w_sem = settings.ATS_WEIGHT_SEMANTIC
    w_struct = settings.ATS_WEIGHT_STRUCTURE
    
    overall_score = (
        (skills_score * w_skills) +
        (keyword_score * w_kw) +
        (experience_score * w_exp) +
        (education_score * w_edu) +
        (semantic_score * w_sem) +
        (structure_score * w_struct)
    )
    overall_score = round(min(100.0, max(10.0, overall_score)), 1)
    
    # Determine match level
    if overall_score >= 80:
        match_level = "Strong Match"
    elif overall_score >= 65:
        match_level = "Good Match"
    elif overall_score >= 50:
        match_level = "Moderate Match"
    else:
        match_level = "Needs Attention"
        
    # Compile Working Points and Attention Points
    # Compile Working Points and Attention Points
    working_points = []
    attention_points = []
    
    # 1. Numbers & Percentages Impact Analysis (Google XYZ Formula)
    metric_matches = re.findall(r'(?:\d+(?:\.\d+)?%|\b\d{1,3}(?:,\d{3})+\+?|\b\d+\+?\s*(?:ms|seconds|x|k|users|queries|records|transactions|req\/s)\b)', raw_resume_text, re.IGNORECASE)
    has_percentages = any('%' in m for m in metric_matches)
    
    if len(metric_matches) >= 4 and has_percentages:
        working_points.append(f"Strong quantified impact: Identified {len(metric_matches)} concrete metrics and percentages demonstrating measurable engineering ROI.")
    elif len(metric_matches) >= 1:
        attention_points.append(
            f"Keep more numbers and percentages: Found only {len(metric_matches)} quantitative metric(s). High-scoring ATS resumes use concrete figures and percentages to prove impact (e.g., '+35% throughput increase', 'reduced query latency by 120ms', 'supported 10,000+ active users'). Follow Google's XYZ formula: Accomplished [X] measured by [Y] by doing [Z]."
        )
    else:
        attention_points.append(
            "Keep more numbers and percentages: No quantifiable metrics or percentages detected in project descriptions. Transform bullet points from simple task lists into measurable achievements with percentages (e.g. 'reduced latency by 35%'), scale ('10,000+ daily transactions'), and reliability ('99.9% uptime')."
        )
        
    # 2. Professional Vocabulary & Action Words Analysis
    weak_phrases = ["worked on", "helped with", "assisted with", "responsible for", "participated in", "handled", "did", "made"]
    found_weak = [p for p in weak_phrases if p in raw_resume_text.lower()]
    
    strong_executive_verbs = [
        "architected", "engineered", "spearheaded", "orchestrated", "implemented", 
        "optimized", "streamlined", "automated", "benchmarked", "refactored", 
        "deployed", "scaled"
    ]
    found_strong = [v for v in strong_executive_verbs if v in raw_resume_text.lower()]
    
    if found_weak:
        weak_str = ", ".join(found_weak[:2])
        attention_points.append(
            f"Keep more professional words: Detected passive phrasing ('{weak_str}'). Upgrade to assertive engineering action verbs like 'Architected', 'Engineered', 'Optimized', and 'Streamlined' to demonstrate technical ownership and seniority."
        )
    elif len(found_strong) >= 3:
        strong_str = ", ".join([v.title() for v in found_strong[:3]])
        working_points.append(f"Professional engineering vocabulary: Employs assertive action verbs ('{strong_str}') demonstrating proactive technical ownership.")
    else:
        attention_points.append(
            "Keep more professional words: Begin every project and experience bullet point with high-impact engineering action verbs ('Architected', 'Engineered', 'Optimized', 'Automated') to immediately communicate seniority to recruiter screeners."
        )

    # Add top matched skills to working points
    if matched_skills:
        top_skills_str = ", ".join(matched_skills[:3])
        working_points.append(f"Strong alignment on core required skills: {top_skills_str}.")
    if struct_pos:
        working_points.extend(struct_pos[:1])
    if exp_pos:
        working_points.extend(exp_pos[:1])
    if edu_pos:
        working_points.extend(edu_pos[:1])
        
    # Add top missing skills / keywords to attention points
    if missing_skills:
        top_miss = ", ".join(missing_skills[:3])
        attention_points.append(f"Missing core job skills: {top_miss}.")
    if missing_kw:
        top_miss_kw = ", ".join(missing_kw[:2])
        attention_points.append(f"Important role concepts absent from project descriptions: {top_miss_kw}.")
    if exp_warn:
        attention_points.extend(exp_warn[:1])
    if struct_warn:
        attention_points.extend(struct_warn[:1])
    if edu_warn:
        attention_points.extend(edu_warn[:1])
        
    # Ensure non-empty
    if not working_points:
        working_points.append("Clean baseline format recognized by parser.")
    if not attention_points:
        attention_points.append("Consider adding more quantified impact to further strengthen match.")
        
    # Generate actionable Optimization Suggestions
    optimization_suggestions = []
    
    # General High-Impact Recommendation 1: Numbers & Percentages
    if len(metric_matches) < 4 or not has_percentages:
        optimization_suggestions.append({
            "id": "opt-metric-general",
            "type": "metric",
            "title": "Keep More Numbers & Percentages (Google XYZ Formula)",
            "target_section": "projects",
            "severity": "high",
            "recommendation": "Recruiters and ATS algorithms score resumes significantly higher when accomplishments feature concrete metrics (e.g. 'Optimized latency by 35%', 'handled 10,000+ daily transactions', 'achieved 92.4% accuracy'). Replace qualitative bullet points with measurable outcomes.",
            "current_text": "",
            "suggested_text": "• Architected scalable services, reducing API response latency by 35% (from 340ms to 220ms) via query optimization and Redis caching.\n• Engineered resilient endpoints handling 10,000+ daily transactions with 99.9% uptime."
        })
        
    # General High-Impact Recommendation 2: Professional Action Words
    if found_weak or len(found_strong) < 3:
        optimization_suggestions.append({
            "id": "opt-vocab-general",
            "type": "vocabulary",
            "title": "Keep More Professional Words & Action Verbs",
            "target_section": "summary",
            "severity": "high",
            "recommendation": "Elevate passive wording ('worked on', 'responsible for') into assertive technical leadership vocabulary. Use executive terms like 'Architected', 'Engineered', 'Orchestrated', 'Optimized', and 'Streamlined' across your summary and project statements.",
            "current_text": resume_data.get("summary", ""),
            "suggested_text": f"Results-driven Software Engineer specialized in architecting scalable applications and streamlining production pipelines. Proven track record optimizing system performance by 30%+ and engineering high-throughput solutions for {job_title} requirements."
        })

    # 1. Missing technical skills suggestions (Only genuine skills from taxonomy)
    if missing_skills:
        for idx, ms in enumerate(missing_skills[:3]):
            optimization_suggestions.append({
                "id": f"opt-skill-{idx}",
                "type": "skill",
                "title": f"Add Target Technical Skill: '{ms}'",
                "target_section": "skills",
                "severity": "high",
                "recommendation": f"The target role for {job_title} actively screens for '{ms}'. Adding '{ms}' to your Technical Skills section ensures ATS keyword indexing and satisfies recruiter search filters.",
                "current_text": "",
                "suggested_text": ms
            })
            
    # 2. General domain keywords - Target them to Summary or Projects, NEVER to Technical Skills!
    DISALLOWED_KEYWORDS = {
        "seeking", "seek", "seeks", "design", "designs", "designing", "looking", "look", "looks",
        "join", "joins", "joining", "responsible", "responsibility", "ensure", "ensures", "ensuring",
        "create", "creates", "creating", "provide", "provides", "providing", "support", "supports",
        "deliver", "delivers", "delivering", "help", "helps", "helping", "build", "builds", "building",
        "maintain", "maintains", "maintaining", "collaborate", "collaborates", "collaborating",
        "work", "working", "candidate", "candidates", "role", "roles", "team", "teams", "plus",
        "preferred", "strong", "proven", "daily", "fast", "paced", "environment", "lead", "learn"
    }
    
    miss_kws_filtered = [
        k for k in missing_kw 
        if k.lower() not in DISALLOWED_KEYWORDS 
        and len(k) > 2
        and not any(k.lower() in ms.lower() or ms.lower() in k.lower() for ms in (missing_skills or []))
    ]
    if miss_kws_filtered and len(optimization_suggestions) < 5:
        for k_idx, kw in enumerate(miss_kws_filtered[:1]):
            optimization_suggestions.append({
                "id": f"opt-kw-{k_idx}",
                "type": "keyword",
                "title": f"Incorporate Keyword: '{kw}'",
                "target_section": "summary",
                "severity": "medium",
                "recommendation": f"Job description emphasizes experience with '{kw}'. Incorporating '{kw}' naturally into your summary or project descriptions boosts ATS semantic relevance without cluttering technical skills.",
                "current_text": "",
                "suggested_text": f"Proficient in leveraging {kw} methodologies within production workflows."
            })
            
    # 2. Project improvement suggestions with Quantified Metrics and Numbers (Google XYZ Formula)
    projects = resume_data.get("projects", [])
    if projects and isinstance(projects, list) and len(projects) > 0:
        for p_idx, proj in enumerate(projects[:2]):
            if not isinstance(proj, dict):
                continue
            p_title = proj.get("title", f"Project {p_idx+1}") or f"Project {p_idx+1}"
            p_desc = proj.get("description", "") or ""
            p_tech = proj.get("technologies", "") or ""
            tech_phrase = f" utilizing {p_tech}" if p_tech else ""
            
            # Generate domain-adapted quantified metrics with concrete numbers
            if any(term in p_title.lower() or term in p_tech.lower() for term in ["api", "backend", "system", "service", "server", "database"]):
                quantified_desc = (
                    f"• Architected scalable services for {p_title}{tech_phrase}, reducing API response latency by 35% (from 340ms to 220ms) via query optimization and Redis caching.\n"
                    f"• Engineered resilient backend endpoints handling 10,000+ daily transactions with 99.9% uptime and automated error-handling.\n"
                    f"• Implemented end-to-end unit tests and CI/CD pipelines, increasing test coverage to 88% and cutting release cycles by 40%."
                )
            elif any(term in p_title.lower() or term in p_tech.lower() for term in ["ai", "ml", "learning", "data", "vision", "nlp", "model"]):
                quantified_desc = (
                    f"• Developed and trained predictive models for {p_title}{tech_phrase} across 25,000+ data samples, achieving 92.4% validation accuracy.\n"
                    f"• Optimized data preprocessing and batch inference pipeline, decreasing compute latency by 38% (from 450ms to 280ms).\n"
                    f"• Deployed containerized REST inference endpoints handling 5,000+ daily user requests with 99.8% availability."
                )
            else:
                quantified_desc = (
                    f"• Architected full-stack features for {p_title}{tech_phrase}, serving 5,000+ active users and decreasing page load times by 40% (from 2.8s to 1.7s).\n"
                    f"• Optimized database queries and transaction throughput, decreasing memory overhead by 30% across 20,000+ records.\n"
                    f"• Integrated automated testing and continuous deployment, reducing bug regression by 45% with 90%+ code coverage."
                )
                
            optimization_suggestions.append({
                "id": f"opt-proj-{p_idx}",
                "type": "project",
                "title": f"Add Quantified Metrics & Numbers to '{p_title}'",
                "target_section": "projects",
                "severity": "high",
                "recommendation": f"ATS parsers and engineering recruiters look for measurable impact (Google XYZ formula: Accomplished [X] measured by [Y], by doing [Z]). Incorporating concrete numbers (e.g. 35% latency drop, 10,000+ requests, 99.9% uptime) makes '{p_title}' stand out.",
                "current_text": p_desc,
                "suggested_text": quantified_desc
            })
            
    # 3. Summary optimization suggestion
    cur_summary = resume_data.get("summary", "")
    optimization_suggestions.append({
        "id": "opt-sum-0",
        "type": "summary",
        "title": f"Target Summary toward {job_title}",
        "target_section": "summary",
        "severity": "medium",
        "recommendation": f"Position your background directly for the '{job_title}' requirements with key technologies and measurable engineering focus.",
        "current_text": cur_summary,
        "suggested_text": f"Results-driven Software Engineer with hands-on experience building scalable applications in {', '.join(matched_skills[:2]) if matched_skills else 'modern software engineering'}. Proven track record optimizing system performance by 30%+ and delivering maintainable, high-throughput solutions for {job_title} requirements."
    })
    
    return {
        "overall_score": overall_score,
        "skills_score": round(skills_score, 1),
        "keyword_score": round(keyword_score, 1),
        "experience_score": round(experience_score, 1),
        "education_score": round(education_score, 1),
        "semantic_score": round(semantic_score, 1),
        "structure_score": round(structure_score, 1),
        "match_level": match_level,
        "summary": f"Your resume achieves an estimated {overall_score:.0f}/100 ATS Compatibility for the {job_title} role. Review the matched vs missing skills below to optimize your application.",
        "working_points": working_points,
        "attention_points": attention_points,
        "matched_keywords": matched_kw[:15],
        "missing_keywords": missing_kw[:15],
        "skill_alignment": skill_alignment_items,
        "optimization_suggestions": optimization_suggestions
    }
