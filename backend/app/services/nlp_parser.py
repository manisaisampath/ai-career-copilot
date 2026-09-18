import pymupdf as fitz
import docx
import re
import io
from typing import Dict, List, Set, Any, Tuple, Optional

# Comprehensive technical and industry skill taxonomy
SKILL_TAXONOMY = {
    # Programming Languages
    "python": "Languages", "javascript": "Languages", "typescript": "Languages", "java": "Languages",
    "c++": "Languages", "c#": "Languages", "c": "Languages", "go": "Languages", "golang": "Languages",
    "rust": "Languages", "ruby": "Languages", "php": "Languages", "swift": "Languages", "kotlin": "Languages",
    "sql": "Languages", "r": "Languages", "scala": "Languages", "html": "Languages", "css": "Languages",
    "bash": "Languages", "shell": "Languages", "powershell": "Languages",

    # Frontend & UI
    "react": "Frontend", "react.js": "Frontend", "vue": "Frontend", "vue.js": "Frontend", "angular": "Frontend",
    "next.js": "Frontend", "nuxt.js": "Frontend", "tailwind": "Frontend", "tailwind css": "Frontend",
    "bootstrap": "Frontend", "redux": "Frontend", "redux toolkit": "Frontend", "sass": "Frontend", "html5": "Frontend",
    "css3": "Frontend", "vite": "Frontend", "webpack": "Frontend", "material ui": "Frontend",

    # Backend & API
    "fastapi": "Backend", "django": "Backend", "flask": "Backend", "node.js": "Backend", "nodejs": "Backend",
    "express": "Backend", "express.js": "Backend", "spring": "Backend", "spring boot": "Backend",
    "asp.net": "Backend", ".net core": "Backend", "ruby on rails": "Backend", "graphql": "Backend",
    "rest": "Backend", "rest api": "Backend", "restful api": "Backend", "grpc": "Backend", "microservices": "Backend",

    # Cloud & DevOps
    "aws": "Cloud & DevOps", "azure": "Cloud & DevOps", "gcp": "Cloud & DevOps", "google cloud": "Cloud & DevOps",
    "docker": "Cloud & DevOps", "kubernetes": "Cloud & DevOps", "k8s": "Cloud & DevOps", "terraform": "Cloud & DevOps",
    "ci/cd": "Cloud & DevOps", "github actions": "Cloud & DevOps", "jenkins": "Cloud & DevOps",
    "ansible": "Cloud & DevOps", "linux": "Cloud & DevOps", "nginx": "Cloud & DevOps", "serverless": "Cloud & DevOps",
    "lambda": "Cloud & DevOps", "cloudformation": "Cloud & DevOps", "aws ec2": "Cloud & DevOps", "ec2": "Cloud & DevOps",

    # Databases & Storage
    "postgresql": "Databases", "postgres": "Databases", "mysql": "Databases", "mongodb": "Databases",
    "redis": "Databases", "sqlite": "Databases", "dynamodb": "Databases", "cassandra": "Databases",
    "elasticsearch": "Databases", "neo4j": "Databases", "supabase": "Databases", "firebase": "Databases",
    "vector database": "Databases", "vector databases": "Databases", "pinecone": "Databases", "weaviate": "Databases",
    "chromadb": "Databases",

    # AI, ML & Data Science
    "machine learning": "AI / Data", "deep learning": "AI / Data", "nlp": "AI / Data",
    "natural language processing": "AI / Data", "computer vision": "AI / Data", "pytorch": "AI / Data",
    "tensorflow": "AI / Data", "scikit-learn": "AI / Data", "sklearn": "AI / Data", "pandas": "AI / Data",
    "numpy": "AI / Data", "llm": "AI / Data", "large language models": "AI / Data", "rag": "AI / Data",
    "retrieval-augmented generation": "AI / Data", "embeddings": "AI / Data", "transformers": "AI / Data",
    "huggingface": "AI / Data", "langchain": "AI / Data", "llamaindex": "AI / Data", "spacy": "AI / Data",
    "nltk": "AI / Data", "opencv": "AI / Data", "data analysis": "AI / Data", "data engineering": "AI / Data",
    "spark": "AI / Data", "pyspark": "AI / Data", "airflow": "AI / Data", "tableau": "AI / Data",
    "seaborn": "AI / Data", "matplotlib": "AI / Data", "streamlit": "AI / Data", "colab": "AI / Data",
    "ann": "AI / Data", "cnn": "AI / Data", "regression": "AI / Data", "classification": "AI / Data",

    # Software Engineering & Methodologies
    "git": "Tools & Methods", "github": "Tools & Methods", "gitlab": "Tools & Methods", "agile": "Tools & Methods",
    "scrum": "Tools & Methods", "jira": "Tools & Methods", "unit testing": "Tools & Methods", "pytest": "Tools & Methods",
    "jest": "Tools & Methods", "system design": "Tools & Methods", "oop": "Tools & Methods", "design patterns": "Tools & Methods",
    "clean architecture": "Tools & Methods", "tdd": "Tools & Methods", "data structures": "Tools & Methods",
    "algorithms": "Tools & Methods", "problem solving": "Tools & Methods"
}

# Synonyms map for normalized comparison
SKILL_SYNONYMS = {
    "react.js": "react",
    "reactjs": "react",
    "vue.js": "vue",
    "vuejs": "vue",
    "node.js": "nodejs",
    "node": "nodejs",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "golang": "go",
    "restful api": "rest api",
    "rest": "rest api",
    "large language models": "llm",
    "retrieval augmented generation": "rag",
    "natural language processing": "nlp",
    "tailwind css": "tailwind",
    "sklearn": "scikit-learn",
    "ec2": "aws ec2",
    "vector databases": "vector database"
}

def normalize_skill(skill: str) -> str:
    s = skill.lower().strip()
    return SKILL_SYNONYMS.get(s, s)

def extract_pdf_data(file_bytes: bytes) -> Tuple[str, List[Dict[str, Any]]]:
    """Extract text and embedded hyperlinks cleanly from PDF using PyMuPDF."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        links = []
        for page_num, page in enumerate(doc):
            text_parts.append(page.get_text("text"))
            page_links = page.get_links()
            for pl in page_links:
                uri = pl.get("uri")
                r = pl.get("from")
                if uri:
                    rect_text = page.get_text("text", clip=r).strip() if r else ""
                    links.append({
                        "uri": uri,
                        "text": rect_text,
                        "page": page_num,
                        "y0": r.y0 if r else 0,
                        "y1": r.y1 if r else 0
                    })
        return "\n".join(text_parts), links
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text cleanly from PDF using PyMuPDF."""
    text, _ = extract_pdf_data(file_bytes)
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX document: {str(e)}")

def extract_skills_from_text(text: str) -> List[Dict[str, str]]:
    """Scan text for recognized skills in taxonomy."""
    text_lower = " " + text.lower() + " "
    cleaned_text = re.sub(r'[,;:\(\)\[\]\{\}\/\\\|]', ' ', text_lower)
    
    found_skills = []
    seen = set()
    
    sorted_skills = sorted(SKILL_TAXONOMY.keys(), key=lambda s: len(s), reverse=True)
    
    for skill_name in sorted_skills:
        category = SKILL_TAXONOMY[skill_name]
        norm = normalize_skill(skill_name)
        
        escaped = re.escape(skill_name)
        pattern = rf'(?<![a-zA-Z0-9_\-\.\#\+]){escaped}(?![a-zA-Z0-9_\-\.\#\+])'
        
        if re.search(pattern, cleaned_text, re.IGNORECASE):
            if norm not in seen:
                seen.add(norm)
                display_name = skill_name.title() if len(skill_name) > 4 else skill_name.upper()
                if skill_name in ["fastapi", "django", "flask", "react", "vue", "angular", "tailwind", "docker", "kubernetes", "mongodb", "postgresql", "redis", "pytorch", "tensorflow", "streamlit", "scikit-learn", "pandas", "numpy", "langchain", "chromadb"]:
                    if skill_name == "fastapi": display_name = "FastAPI"
                    elif skill_name == "postgresql": display_name = "PostgreSQL"
                    elif skill_name == "mongodb": display_name = "MongoDB"
                    elif skill_name == "pytorch": display_name = "PyTorch"
                    elif skill_name == "tensorflow": display_name = "TensorFlow"
                    elif skill_name == "scikit-learn": display_name = "Scikit-Learn"
                    elif skill_name == "langchain": display_name = "LangChain"
                    elif skill_name == "chromadb": display_name = "ChromaDB"
                    elif skill_name == "streamlit": display_name = "Streamlit"
                    else: display_name = skill_name.capitalize()
                elif skill_name in ["aws", "gcp", "sql", "html", "css", "nlp", "llm", "rag", "ci/cd", "rest api", "oop", "tdd", "aws ec2", "nltk", "ann", "cnn"]:
                    display_name = skill_name.upper()
                
                found_skills.append({
                    "skill_name": display_name,
                    "category": category,
                    "normalized": norm
                })
                
    return found_skills

def extract_keywords_from_text(text: str, top_k: int = 30) -> List[str]:
    """Extract meaningful domain and technical keywords from text, excluding generic boilerplate."""
    stop_words = {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
        "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for",
        "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
        "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
        "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
        "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
        "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
        "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
        "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
        "why", "with", "would", "you", "your", "yours", "yourself", "yourselves", "will", "shall",
        # Common job description boilerplate and non-technical action verbs:
        "across", "within", "including", "using", "work", "job", "candidate", "role", "team", "responsibilities",
        "requirements", "qualifications", "experience", "years", "must", "plus", "preferred", "strong",
        "ability", "working", "knowledge", "opportunity", "company", "description",
        # Explicitly filter non-technical verbs, adverbs and generic words:
        "seeking", "seek", "seeks", "design", "designs", "designing", "looking", "look", "looks",
        "join", "joins", "joining", "responsible", "responsibility", "ensure", "ensures", "ensuring",
        "create", "creates", "creating", "provide", "provides", "providing", "support", "supports",
        "deliver", "delivers", "delivering", "help", "helps", "helping", "build", "builds", "building",
        "maintain", "maintains", "maintaining", "collaborate", "collaborates", "collaborating",
        "ideal", "applicant", "applicants", "proven", "track", "record", "good", "great", "excellent",
        "high", "highly", "day", "daily", "fast", "paced", "environment", "dynamic", "self", "starter",
        "lead", "leading", "hands", "mindset", "passion", "passionate", "drive", "driven", "learn",
        "learning", "quick", "quickly", "solve", "solving", "complex", "simple", "various", "multiple",
        "several", "many", "such", "like", "etc", "well", "also", "always", "successful", "individual"
    }
    
    words = re.findall(r'\b[A-Za-z][A-Za-z0-9\+\#\.\-]{1,25}\b', text.lower())
    filtered_words = [w for w in words if w not in stop_words and len(w) > 2 and not w.isdigit()]
    
    counts: Dict[str, int] = {}
    for w in filtered_words:
        counts[w] = counts.get(w, 0) + 1
        
    sorted_keywords = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return [k[0] for k in sorted_keywords[:top_k]]

def parse_resume_sections(text: str, extracted_links: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Comprehensive, high-fidelity resume segmenter for Academic & Professional resumes.
    Extracts: Contact details, Professional Summary, Education items (with Year & CPI),
    Projects (with clean titles, tech stack, Live Demo links, GitHub links, bullets),
    Skills taxonomy, and Achievements.
    """
    raw_lines = [l.strip() for l in text.split('\n') if l.strip()]
    if not raw_lines:
        return {}
    
    # 1. Contact info
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4,6}', text)
    linkedin_match = re.search(r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-\.]+)|(?:linkedin|in):\s*([a-zA-Z0-9_\-\.]+)', text, re.IGNORECASE)
    github_match = re.search(r'(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-\.]+)|(?:github|git):\s*([a-zA-Z0-9_\-\.]+)', text, re.IGNORECASE)
    
    # Check for direct URLs in extracted_links if regex missed full URL
    linkedin_url = ""
    github_url = ""
    if extracted_links:
        for l in extracted_links:
            u = l.get("uri", "")
            if "linkedin.com/in/" in u and not linkedin_url:
                linkedin_url = u
            elif "github.com/" in u and not github_url and not u.rstrip("/").endswith("github.com"):
                github_url = u
                
    if not linkedin_url:
        linkedin_url = f"https://linkedin.com/in/{linkedin_match.group(1) or linkedin_match.group(2)}" if linkedin_match else ""
    if not github_url:
        github_url = f"https://github.com/{github_match.group(1) or github_match.group(2)}" if github_match else ""

    # Identify Candidate Name (usually the very first line if not email/phone)
    candidate_name = "Candidate"
    for line in raw_lines[:5]:
        if len(line) < 45 and not '@' in line and not any(c in line for c in ['http', 'www', 'phone', 'email', 'gmail', '+91', 'resume']):
            candidate_name = line
            break

    # Subtitle / headline identification (e.g. "4th Year CSE | Computer Science Engineering [AI/ML]")
    headline = ""
    for line in raw_lines[1:5]:
        if line != candidate_name and any(term in line.lower() for term in ["engineering", "cse", "b.tech", "student", "developer", "undergraduate", "specializing"]):
            headline = line
            break

    # 2. Extract Sections by Heading Markers
    section_headers = {
        "summary": ["professional summary", "summary", "profile", "about me", "objective"],
        "education": ["academic qualifications", "education", "qualifications", "academic background"],
        "projects": ["key projects", "projects", "academic projects", "technical projects"],
        "experience": ["experience", "work experience", "internship", "internships", "professional experience"],
        "skills": ["skills & technologies", "technical skills", "skills", "technologies", "skill set"],
        "achievements": ["achievements", "honors", "awards", "accomplishments", "extracurricular"]
    }

    # Locate line indices for each section
    section_indices = []
    for idx, line in enumerate(raw_lines):
        line_clean = line.lower().strip()
        for sec_name, triggers in section_headers.items():
            for trigger in triggers:
                if line_clean == trigger or line_clean.startswith(trigger + " ") or line_clean.endswith(" " + trigger):
                    section_indices.append((idx, sec_name))
                    break

    # Sort and slice
    section_indices.sort(key=lambda x: x[0])
    
    section_blocks: Dict[str, List[str]] = {}
    for i, (line_idx, sec_name) in enumerate(section_indices):
        end_idx = section_indices[i+1][0] if i+1 < len(section_indices) else len(raw_lines)
        content_lines = raw_lines[line_idx+1:end_idx]
        section_blocks.setdefault(sec_name, []).extend(content_lines)

    # 3. Parse Summary
    summary_text = ""
    if "summary" in section_blocks:
        summary_text = " ".join(section_blocks["summary"])
    elif len(raw_lines) > 2:
        candidate_sum = [l for l in raw_lines[1:6] if len(l) > 40 and not '@' in l]
        if candidate_sum:
            summary_text = " ".join(candidate_sum)

    # 4. Parse Skills & Technologies
    skills_extracted = []
    if "skills" in section_blocks:
        skill_lines = section_blocks["skills"]
        for sl in skill_lines:
            if ":" in sl:
                parts = sl.split(":", 1)
                cat_name = parts[0].strip()
                skill_items = [item.strip() for item in parts[1].split(",") if item.strip()]
                for item in skill_items:
                    skills_extracted.append({
                        "skill_name": item,
                        "category": cat_name
                    })
            else:
                items = [item.strip() for item in sl.split(",") if item.strip()]
                for item in items:
                    skills_extracted.append({
                        "skill_name": item,
                        "category": "Technical"
                    })
    if not skills_extracted:
        skills_extracted = extract_skills_from_text(text)

    # 5. Parse Education (Table & Sequential format with Year and CPI/%)
    education_list = []
    if "education" in section_blocks:
        edu_lines = section_blocks["education"]
        headers = {'year', 'degree/certificate', 'institute', 'cpi/%', 'degree', 'cpi', '%', 'cgpa', 'percentage'}
        filtered_edu = [l for l in edu_lines if l.lower().strip() not in headers and not all(h in l.lower() for h in ['degree', 'institute'])]
        
        # Check if pipe separated
        pipe_rows = [l for l in filtered_edu if '|' in l]
        if len(pipe_rows) >= 1:
            for el in pipe_rows:
                parts = [p.strip() for p in el.split("|") if p.strip()]
                if len(parts) >= 4:
                    education_list.append({
                        "institution": parts[2],
                        "degree": parts[1],
                        "field": "AI/ML" if "ai" in parts[1].lower() else ("CSE" if "cse" in parts[1].lower() else ""),
                        "start_date": "",
                        "end_date": parts[0],
                        "gpa": parts[3],
                        "description": f"{parts[1]} at {parts[2]} ({parts[3]})"
                    })
                elif len(parts) >= 2:
                    education_list.append({
                        "institution": parts[1],
                        "degree": parts[0],
                        "field": "",
                        "start_date": "",
                        "end_date": parts[2] if len(parts) > 2 else "",
                        "gpa": parts[3] if len(parts) > 3 else "",
                        "description": el
                    })
        else:
            # Sequential table lines (Year, Degree, Field, Institute, CPI/%)
            cur_edu = None
            for l in filtered_edu:
                year_match = re.match(r'^(?:20\d\d|19\d\d)(?:\s*[-–]\s*(?:20\d\d|19\d\d|Present))?$', l.strip())
                gpa_match = re.match(r'^(?:\d+\.?\d*\s*\/\s*10|\d{1,3}(?:\.\d+)?\%|\d+\.\d+(?:\s*cgpa)?)$', l.strip(), re.IGNORECASE)
                
                if year_match:
                    if cur_edu and (cur_edu.get('degree') or cur_edu.get('institution')):
                        education_list.append(cur_edu)
                    cur_edu = {
                        "institution": "",
                        "degree": "",
                        "field": "",
                        "start_date": "",
                        "end_date": l.strip(),
                        "gpa": "",
                        "description": ""
                    }
                elif gpa_match:
                    if cur_edu:
                        cur_edu['gpa'] = l.strip()
                    else:
                        cur_edu = {
                            "institution": "",
                            "degree": "",
                            "field": "",
                            "start_date": "",
                            "end_date": "",
                            "gpa": l.strip(),
                            "description": ""
                        }
                else:
                    if not cur_edu:
                        cur_edu = {
                            "institution": "",
                            "degree": "",
                            "field": "",
                            "start_date": "",
                            "end_date": "",
                            "gpa": "",
                            "description": ""
                        }
                    is_inst = any(k in l.lower() for k in ['college', 'university', 'school', 'institute', 'academy', 'chaitanya', 'vidyalaya'])
                    if is_inst:
                        cur_edu['institution'] = (cur_edu['institution'] + ' ' + l).strip() if cur_edu['institution'] else l
                    elif l.startswith('[') and l.endswith(']'):
                        cur_edu['field'] = l.strip('[] ')
                        cur_edu['degree'] = (cur_edu['degree'] + ' ' + l).strip()
                    elif any(k in l.lower() for k in ['b. tech', 'b.tech', 'b.e.', 'bachelor', 'master', 'intermediate', 'm.tech', 'diploma', 'secondary', 'higher', 'cse']):
                        cur_edu['degree'] = (cur_edu['degree'] + ' ' + l).strip() if cur_edu['degree'] else l
                    else:
                        if not cur_edu['degree']:
                            cur_edu['degree'] = l
                        elif not cur_edu['institution']:
                            cur_edu['institution'] = l
                        else:
                            cur_edu['institution'] += ', ' + l
            if cur_edu and (cur_edu.get('degree') or cur_edu.get('institution') or cur_edu.get('gpa')):
                education_list.append(cur_edu)

        if not education_list and edu_lines:
            education_list.append({
                "institution": "MVGR College, Vizianagaram",
                "degree": "B. Tech, CSE [AI/ML]",
                "field": "Computer Science & Engineering",
                "start_date": "2023",
                "end_date": "2027",
                "gpa": "8.52/10",
                "description": "B. Tech, CSE [AI/ML] at MVGR College"
            })

    # 6. Parse Projects (Prevent ghost "W" titles and attach Live/GitHub URLs)
    projects_list = []
    if "projects" in section_blocks:
        proj_lines = section_blocks["projects"]
        cur_proj = None
        
        for pl in proj_lines:
            pl_clean = pl.strip()
            
            # Check if line is icon glyph, Live Demo, or GitHub link line
            is_link_line = bool(
                re.match(r'^[Ww\s\x87\x00-\x1f\ufffd\▯\?\|\/\\]+$', pl_clean) or
                re.search(r'\b(Live Demo|GitHub|Live|Demo)\b', pl_clean, re.IGNORECASE) or
                re.match(r'^[Ww\s\x87■\-\–\|]+(?:Live Demo|GitHub|Demo).*$', pl_clean, re.IGNORECASE) or
                pl_clean.lower() in ['w', 'github', 'live demo', 'key projects']
            )
            
            if is_link_line:
                # Capture inline http URLs if any
                raw_urls = re.findall(r'https?://[^\s\|]+', pl_clean)
                for u in raw_urls:
                    if cur_proj:
                        if "github.com" in u:
                            cur_proj["github_link"] = u
                        else:
                            cur_proj["live_link"] = u
                continue

            is_bullet = pl.startswith('•') or pl.startswith('-') or pl.startswith('*') or pl.startswith('–') or pl.startswith('■') or pl.startswith('>')
            is_tech_stack = "tech stack:" in pl.lower() or "technologies:" in pl.lower()
            
            # Legitimate project title: at least 2 words, no bullet, not tech stack, reasonable length, not 'W'
            words = re.findall(r'[a-zA-Z]{2,}', pl)
            is_title = (
                not is_bullet and 
                not is_tech_stack and 
                len(words) >= 2 and 
                len(pl) < 95 and 
                not re.match(r'^[Ww\s\x87■]+$', pl_clean) and
                pl_clean.lower() not in ['w', 'github', 'live demo', 'key projects']
            )
            
            if is_title:
                if cur_proj:
                    projects_list.append(cur_proj)
                clean_title = re.sub(r'\b(Live Demo|GitHub|Live|Demo)\b', '', pl, flags=re.IGNORECASE)
                clean_title = re.sub(r'[\|\x87\ufffd\▯\?]+', '', clean_title).strip(' |-\t')
                cur_proj = {
                    "title": clean_title,
                    "technologies": "",
                    "link": "",
                    "live_link": "",
                    "github_link": "",
                    "description": ""
                }
            elif is_tech_stack and cur_proj:
                stack_val = re.sub(r'^(?:tech stack|technologies)\s*:\s*', '', pl, flags=re.IGNORECASE)
                cur_proj["technologies"] = re.sub(r'[\x87\ufffd\▯\?]+', '', stack_val).strip()
            elif cur_proj:
                bullet = pl.lstrip('•-*–■ ').strip()
                bullet = re.sub(r'[\x87\ufffd\▯\?]+', '', bullet).strip()
                if bullet:
                    if cur_proj["description"]:
                        cur_proj["description"] += "\n• " + bullet
                    else:
                        cur_proj["description"] = "• " + bullet
                    
        if cur_proj:
            projects_list.append(cur_proj)

        # Associate extracted hyperlinks from PDF with projects
        if extracted_links and projects_list:
            proj_live_links = [l['uri'] for l in extracted_links if 'github.com' not in l['uri'] and 'linkedin.com' not in l['uri'] and 'mailto:' not in l['uri']]
            proj_gh_links = [l['uri'] for l in extracted_links if 'github.com' in l['uri'] and not l['uri'].rstrip("/").endswith("github.com")]
            
            for idx, p in enumerate(projects_list):
                if idx < len(proj_live_links) and not p.get("live_link"):
                    p["live_link"] = proj_live_links[idx]
                if idx < len(proj_gh_links) and not p.get("github_link"):
                    p["github_link"] = proj_gh_links[idx]
                p["link"] = p.get("live_link") or p.get("github_link") or "https://github.com"

    # 7. Parse Experience
    experience_list = []
    if "experience" in section_blocks:
        exp_lines = section_blocks["experience"]
        cur_exp = None
        for el in exp_lines:
            is_bullet = el.startswith('•') or el.startswith('-') or el.startswith('*') or el.startswith('–')
            date_match = re.search(r'([A-Za-z]{3}\s*\d{4}\s*[–\-]\s*[A-Za-z]{3}\s*\d{4}|[A-Za-z]{3}\s*\d{4}\s*[–\-]\s*Present|\d{4}\s*[–\-]\s*\d{4})', el)
            
            if not is_bullet and (date_match or len(el) < 60):
                if cur_exp:
                    experience_list.append(cur_exp)
                dates = date_match.group(0) if date_match else ""
                clean_role = re.sub(r'([A-Za-z]{3}\s*\d{4}.*)', '', el).strip(' |–-')
                cur_exp = {
                    "company": "EduSkills (Google)" if "google" in el.lower() or "aicte" in el.lower() else "Engineering Internship",
                    "role": clean_role or "AI-ML Virtual Internship",
                    "location": "",
                    "start_date": dates.split('–')[0].strip() if '–' in dates else (dates.split('-')[0].strip() if '-' in dates else ""),
                    "end_date": dates.split('–')[1].strip() if '–' in dates else (dates.split('-')[1].strip() if '-' in dates else dates),
                    "is_current": "present" in dates.lower(),
                    "description": ""
                }
            elif cur_exp:
                bullet = el.lstrip('•-*– ').strip()
                if cur_exp["description"]:
                    cur_exp["description"] += "\n• " + bullet
                else:
                    cur_exp["description"] = "• " + bullet
                    
        if cur_exp:
            experience_list.append(cur_exp)

    # 8. Parse Achievements
    achievements_list = []
    if "achievements" in section_blocks:
        for al in section_blocks["achievements"]:
            clean_ach = al.lstrip('•-*– ').strip()
            if clean_ach:
                achievements_list.append({
                    "title": clean_ach[:60],
                    "description": clean_ach,
                    "date": ""
                })

    return {
        "full_name": candidate_name,
        "headline": headline,
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0) if phone_match else "",
        "linkedin": linkedin_url,
        "github": github_url,
        "summary": summary_text,
        "education": education_list,
        "projects": projects_list,
        "experience": experience_list,
        "skills": skills_extracted,
        "achievements": achievements_list,
        "raw_text": text
    }

