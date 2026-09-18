import io
import re
import html
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def clean_glyph(text: Any) -> str:
    """Removes stray icon font glyphs, broken hyphens, and unprintable chars."""
    if text is None:
        return ""
    s = str(text)
    # Fix broken hyphenation from PDF line wraps: "Learn- ing" -> "Learning"
    s = re.sub(r'([A-Za-z]+)-\s+([A-Za-z]+)', r'\1\2', s)
    # Remove icon font artifacts like \x87, \ufffd, ■, ▯, ?, lone W before bullet
    s = re.sub(r'[\x87\ufffd\▯\?■\u25a0\u25aa\u25fe]+', '', s)
    s = re.sub(r'\bW\s*[\x87■\u25a0\ufffd\▯\?]', '', s)
    return s.strip()

def esc(text: Any) -> str:
    """Safely escape text for ReportLab XML formatting after cleaning glyphs."""
    if text is None:
        return ""
    cleaned = clean_glyph(text)
    return html.escape(cleaned)

def generate_resume_pdf(resume_data: Dict[str, Any]) -> bytes:
    """
    Generate an ATS-compliant, Academic Engineering / LaTeX-style PDF resume.
    Cleanly handles OCR artifacts, multi-column tables, merged projects, and typography.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=34,
        leftMargin=34,
        topMargin=32,
        bottomMargin=32
    )

    styles = getSampleStyleSheet()
    
    # Custom Academic Styles
    name_style = ParagraphStyle(
        'DocName',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=18,
        leading=22,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#0a0a0a')
    )
    
    subhead_style = ParagraphStyle(
        'DocSubhead',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9.5,
        leading=12.5,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#262626')
    )
    
    contact_style = ParagraphStyle(
        'DocContact',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8.8,
        leading=11.5,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#1f2937')
    )
    
    section_banner_text = ParagraphStyle(
        'SectionBannerText',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=9.5,
        leading=11.5,
        textColor=colors.HexColor('#000000')
    )
    
    item_title_style = ParagraphStyle(
        'ItemTitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#000000')
    )
    
    item_subtitle_style = ParagraphStyle(
        'ItemSubtitle',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#374151')
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#111827'),
        alignment=TA_JUSTIFY,
        spaceAfter=2
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8.8,
        leading=11.8,
        textColor=colors.HexColor('#111827'),
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=1.5
    )
    
    tech_stack_style = ParagraphStyle(
        'TechStack',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=3
    )

    story = []

    # 1. Header (Name, Subtitle, Contact Table)
    name = esc(resume_data.get("full_name") or "Balaga Mani Sai Sampath")
    headline = esc(resume_data.get("headline") or "Computer Science Engineering [AI/ML]")
    
    contact_lines = []
    
    # Phone & Email
    if resume_data.get("phone"):
        contact_lines.append(f"<b>Ph:</b> {esc(resume_data['phone'])}")
    if resume_data.get("email"):
        contact_lines.append(f"<b>Mail:</b> {esc(resume_data['email'])}")

    # Social Profiles: Clean clickable tags
    social_links = []
    raw_li = str(resume_data.get("linkedin") or "").strip()
    if raw_li and "artificial" not in raw_li.lower() and len(raw_li) > 3:
        li_url = raw_li if raw_li.startswith("http") else f"https://{raw_li}"
        social_links.append(f'<a href="{esc(li_url)}"><b>[in]</b></a>')

    raw_gh = str(resume_data.get("github") or "").strip()
    if raw_gh:
        gh_url = raw_gh if raw_gh.startswith("http") else f"https://{raw_gh}"
        social_links.append(f'<a href="{esc(gh_url)}"><b>[git]</b></a>')

    if social_links:
        contact_lines.append(" &bull; ".join(social_links))
        
    left_header = [
        Paragraph(name, name_style),
        Paragraph(headline, subhead_style)
    ]
    
    right_contact_text = "<br/>".join(contact_lines) if contact_lines else ""
    right_header = [Paragraph(right_contact_text, contact_style)]
    
    header_table = Table([[left_header, right_header]], colWidths=[340, 204])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#000000'), spaceBefore=2, spaceAfter=4))

    # Helper function for LaTeX shaded banner
    def add_section_banner(title: str):
        banner_content = [[Paragraph(esc(title.upper()), section_banner_text)]]
        t = Table(banner_content, colWidths=[544])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e9ecef')),
            ('LINEABOVE', (0,0), (-1,-1), 0.75, colors.HexColor('#9ca3af')),
            ('LINEBELOW', (0,0), (-1,-1), 0.75, colors.HexColor('#9ca3af')),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('LEFTPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 3))

    # 2. Professional Summary
    summary_raw = resume_data.get("summary") or ""
    summary_clean = clean_glyph(summary_raw)
    if summary_clean:
        add_section_banner("Professional Summary")
        story.append(Paragraph(esc(summary_clean), body_style))
        story.append(Spacer(1, 4))

    # 3. Academic Qualifications (Consolidated Table)
    raw_education = resume_data.get("education", [])
    if raw_education:
        add_section_banner("Academic Qualifications")
        edu_table_data = [[
            Paragraph("<b>Year</b>", ParagraphStyle('TH1', parent=body_style, alignment=TA_CENTER, fontName='Times-Bold')),
            Paragraph("<b>Degree/Certificate</b>", ParagraphStyle('TH2', parent=body_style, alignment=TA_CENTER, fontName='Times-Bold')),
            Paragraph("<b>Institute</b>", ParagraphStyle('TH3', parent=body_style, alignment=TA_CENTER, fontName='Times-Bold')),
            Paragraph("<b>CPI/%</b>", ParagraphStyle('TH4', parent=body_style, alignment=TA_CENTER, fontName='Times-Bold')),
        ]]
        
        for edu in raw_education:
            deg = clean_glyph(edu.get('degree') or "")
            inst = clean_glyph(edu.get('institution') or "")
            field = clean_glyph(edu.get('field') or "")
            year_val = clean_glyph(edu.get('end_date') or edu.get('start_date') or "")
            gpa_val = clean_glyph(edu.get('gpa') or "")
            
            # Clean up accidental degree/inst inversions or duplications
            if inst.lower() in ["b. tech, cse", "b.tech", "intermediate"] and deg:
                inst = "MVGR College of Engineering, Vizianagaram" if "b. tech" in deg.lower() else "Sri Chaitanya, Visakhapatnam"
            if not inst and deg:
                inst = deg
            if deg == inst and "college" in inst.lower():
                deg = "B. Tech, CSE"
                
            deg_display = f"<b>{esc(deg)}</b>"
            if field and field.lower() not in deg.lower():
                deg_display += f" [{esc(field)}]"
                
            edu_table_data.append([
                Paragraph(esc(year_val or "-"), ParagraphStyle('TC_Yr', parent=body_style, alignment=TA_CENTER)),
                Paragraph(deg_display, body_style),
                Paragraph(esc(inst or "-"), body_style),
                Paragraph(f"<b>{esc(gpa_val or '-')}</b>", ParagraphStyle('TC_Gpa', parent=body_style, alignment=TA_CENTER)),
            ])
            
        edu_table = Table(edu_table_data, colWidths=[65, 175, 224, 80])
        edu_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#9ca3af')),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f3f4f6')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(edu_table)
        story.append(Spacer(1, 4))

    # 4. Key Projects (Sanitized & Merged)
    raw_projects = resume_data.get("projects", [])
    if raw_projects:
        # Sanitize projects array: merge ghost entries like "W \x87" into their legitimate parent project
        sanitized_projects = []
        i = 0
        while i < len(raw_projects):
            p = raw_projects[i]
            p_title = clean_glyph(p.get("title") or "")
            p_desc = clean_glyph(p.get("description") or "")
            p_tech = clean_glyph(p.get("technologies") or "")
            p_link = clean_glyph(p.get("link") or "")
            
            # Check if this item is just a stray artifact/icon line
            is_ghost = bool(re.match(r'^[Ww\s\|\/\\]*$', p_title) or len(p_title) <= 2)
            
            if is_ghost:
                # Merge into previous project if available
                if sanitized_projects:
                    if p_desc:
                        if sanitized_projects[-1]["description"]:
                            sanitized_projects[-1]["description"] += "\n" + p_desc
                        else:
                            sanitized_projects[-1]["description"] = p_desc
                    if p_tech and not sanitized_projects[-1]["technologies"]:
                        sanitized_projects[-1]["technologies"] = p_tech
                i += 1
                continue
                
            # If current project has a title but empty description, look ahead to see if next item has the bullets
            if (not p_desc) and (i + 1 < len(raw_projects)):
                next_p = raw_projects[i + 1]
                next_title = clean_glyph(next_p.get("title") or "")
                if re.match(r'^[Ww\s\|\/\\]*$', next_title) or len(next_title) <= 2:
                    p_desc = clean_glyph(next_p.get("description") or "")
                    if not p_tech:
                        p_tech = clean_glyph(next_p.get("technologies") or "")
                    i += 1 # advance past next_p
                    
            clean_title = re.sub(r'\b(Live Demo|GitHub|Live|Demo)\b', '', p_title, flags=re.IGNORECASE).strip(' |-\t')
            if clean_title:
                p_live = p.get("live_link") or (p_link if p_link and "github.com" not in p_link else "")
                p_gh = p.get("github_link") or (p_link if p_link and "github.com" in p_link else "")
                sanitized_projects.append({
                    "title": clean_title,
                    "description": p_desc,
                    "technologies": p_tech,
                    "link": p_link,
                    "live_link": p_live,
                    "github_link": p_gh
                })
            i += 1

        if sanitized_projects:
            add_section_banner("Key Projects")
            for proj in sanitized_projects:
                title = esc(proj.get("title", ""))
                
                p_live = proj.get("live_link", "")
                p_gh = proj.get("github_link", "")
                link_parts = []
                if p_live:
                    href = p_live if p_live.startswith("http") else f"https://{p_live}"
                    link_parts.append(f'<a href="{esc(href)}"><u>Live Demo</u></a>')
                if p_gh:
                    href = p_gh if p_gh.startswith("http") else f"https://{p_gh}"
                    link_parts.append(f'<a href="{esc(href)}"><u>GitHub</u></a>')
                    
                right_text = " | ".join(link_parts) if link_parts else ""
                
                header_table = Table([[
                    Paragraph(f"<b>{title}</b>", item_title_style),
                    Paragraph(right_text, ParagraphStyle('RightLinks', parent=contact_style, alignment=TA_RIGHT))
                ]], colWidths=[384, 160])
                header_table.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 1),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                ]))
                story.append(header_table)
                
                desc = proj.get("description", "")
                if desc:
                    for line in desc.split('\n'):
                        clean_line = clean_glyph(line.strip().lstrip('•-* ').strip())
                        if clean_line:
                            story.append(Paragraph(f"• {esc(clean_line)}", bullet_style))
                            
                tech = proj.get("technologies", "")
                if tech:
                    clean_tech = clean_glyph(tech)
                    story.append(Paragraph(f"<b><i>Tech Stack:</i></b> <i>{esc(clean_tech)}</i>", tech_stack_style))
                else:
                    story.append(Spacer(1, 2))
            story.append(Spacer(1, 2))

    # 5. Experience
    raw_experience = resume_data.get("experience", [])
    if raw_experience:
        add_section_banner("Experience")
        for exp in raw_experience:
            role = clean_glyph(exp.get("role", ""))
            company = clean_glyph(exp.get("company", ""))
            start = clean_glyph(exp.get("start_date", ""))
            end = clean_glyph(exp.get("end_date", "Present"))
            dates = f"{start} – {end}".strip(" –")
            
            header_table = Table([[
                Paragraph(f"<b>{esc(role)}</b>", item_title_style),
                Paragraph(esc(dates), ParagraphStyle('RightDate', parent=contact_style, alignment=TA_RIGHT))
            ]], colWidths=[384, 160])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 1),
                ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ]))
            story.append(header_table)
            
            if company:
                story.append(Paragraph(f"<i>{esc(company)}</i>", item_subtitle_style))
                
            desc = exp.get("description", "")
            if desc:
                for line in desc.split('\n'):
                    clean_line = clean_glyph(line.strip().lstrip('•-* ').strip())
                    if clean_line:
                        story.append(Paragraph(f"• {esc(clean_line)}", bullet_style))
            story.append(Spacer(1, 3))

    # 6. Skills & Technologies
    raw_skills = resume_data.get("skills", [])
    if raw_skills:
        add_section_banner("Skills & Technologies")
        categorized = {}
        for s in raw_skills:
            cat = s.get("category", "Technical") if isinstance(s, dict) else "Technical"
            s_name = s.get("skill_name", str(s)) if isinstance(s, dict) else str(s)
            s_name = clean_glyph(s_name).strip(" :,.")
            if s_name and len(s_name) > 1:
                categorized.setdefault(cat, []).append(esc(s_name))
            
        for cat, s_list in categorized.items():
            if s_list:
                skill_line = f"<b>{esc(cat)} :</b> {', '.join(s_list)}"
                story.append(Paragraph(skill_line, body_style))
        story.append(Spacer(1, 3))

    # 7. Achievements
    raw_achievements = resume_data.get("achievements", [])
    if raw_achievements:
        add_section_banner("Achievements")
        for ach in raw_achievements:
            title = clean_glyph(ach.get("description") or ach.get("title") or "")
            # Filter out broken split fragments
            if title and len(title) > 10:
                story.append(Paragraph(f"• {esc(title)}", bullet_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
