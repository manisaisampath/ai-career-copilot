import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Printer, LayoutTemplate, ExternalLink, Mail, Phone, MapPin, 
  Linkedin, Github, Globe, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut, 
  X, FileText, CheckCircle2 
} from 'lucide-react';
import { resumeService } from '../../api/services';
import { downloadResumePdf } from '../../utils/resumeDownload';

export const ResumeDocument = ({ 
  resume, 
  template = 'academic', 
  fontSizeClass = 'text-[12px] leading-relaxed', 
  highlightSection = null, 
  highlightedText = null, 
  skillsByCategory = {},
  id = 'resume-printable' 
}) => {
  return (
    <div 
      id={id}
      className={`
        w-[800px] max-w-full min-h-[1100px] bg-white text-slate-950 shadow-md border border-slate-300 p-8 sm:p-10 font-serif shrink-0
        ${fontSizeClass}
      `}
      style={{ fontFamily: template === 'modern' ? 'Inter, sans-serif' : 'Georgia, "Times New Roman", Times, serif' }}
    >
      {/* Header */}
      <header className="pb-2 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-800 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              {resume.full_name || 'Balaga Mani Sai Sampath'}
            </h1>
            <p className="text-xs text-slate-800 font-medium mt-0.5">
              {resume.headline || (resume.location ? `Computer Science Engineering • ${resume.location}` : 'Computer Science Engineering [AI/ML]')}
            </p>
          </div>

          {/* Right contacts */}
          <div className="mt-2 sm:mt-0 flex flex-col sm:items-end text-[11px] text-slate-800 space-y-1">
            <div className="flex flex-wrap items-center sm:justify-end gap-2.5">
              {resume.email && (
                <a href={`mailto:${resume.email}`} className="inline-flex items-center gap-1 hover:underline text-slate-900">
                  <Mail className="w-3 h-3 text-slate-700 shrink-0" />
                  <span>{resume.email}</span>
                </a>
              )}
              {resume.phone && (
                <span className="inline-flex items-center gap-1 text-slate-900">
                  <Phone className="w-3 h-3 text-slate-700 shrink-0" />
                  <span>{resume.phone}</span>
                </span>
              )}
              {/* LinkedIn Symbol only */}
              {resume.linkedin && (
                <a 
                  href={resume.linkedin.startsWith('http') ? resume.linkedin : `https://${resume.linkedin}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center justify-center p-0.5 text-slate-800 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                  title={`LinkedIn: ${resume.linkedin}`}
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              )}
              {/* GitHub Symbol only */}
              {resume.github && (
                <a 
                  href={resume.github.startsWith('http') ? resume.github : `https://${resume.github}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center justify-center p-0.5 text-slate-800 hover:text-black hover:bg-slate-100 rounded transition-colors"
                  title={`GitHub: ${resume.github}`}
                  aria-label="GitHub Profile"
                >
                  <Github className="w-3.5 h-3.5" />
                </a>
              )}
              {/* Portfolio Symbol if present */}
              {resume.portfolio && (
                <a 
                  href={resume.portfolio.startsWith('http') ? resume.portfolio : `https://${resume.portfolio}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center justify-center p-0.5 text-slate-800 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                  title={`Portfolio: ${resume.portfolio}`}
                  aria-label="Portfolio"
                >
                  <Globe className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {resume.location && (
              <div className="text-[10px] text-slate-600 font-medium">
                {resume.location}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. Professional Summary */}
      {resume.summary && (
        <section className={`mb-3.5 transition-all duration-300 rounded ${highlightSection === 'summary' ? 'ring-2 ring-emerald-500 bg-emerald-50/50 p-1.5' : ''}`}>
          <div className="flex items-center justify-between bg-[#e9ecef] border-y border-slate-400 px-2 py-0.5 mb-1.5">
            <h2 className="text-[11.5px] font-bold text-black uppercase tracking-wider">
              Professional Summary
            </h2>
            {highlightSection === 'summary' && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                Just Updated
              </span>
            )}
          </div>
          <p className="text-slate-900 leading-relaxed px-1 text-justify">
            {resume.summary}
          </p>
        </section>
      )}

      {/* 2. Academic Qualifications (Formatted Table) */}
      {resume.education && resume.education.length > 0 && (
        <section className="mb-3.5">
          <div className="bg-[#e9ecef] border-y border-slate-400 px-2 py-0.5 mb-1.5">
            <h2 className="text-[11.5px] font-bold text-black uppercase tracking-wider">
              Academic Qualifications
            </h2>
          </div>
          <div className="overflow-x-auto px-1">
            <table className="w-full border-collapse border border-slate-400 text-[11px] text-center">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="border border-slate-400 px-3 py-1 w-20">Year</th>
                  <th className="border border-slate-400 px-3 py-1">Degree/Certificate</th>
                  <th className="border border-slate-400 px-3 py-1">Institute</th>
                  <th className="border border-slate-400 px-3 py-1 w-24">CPI/%</th>
                </tr>
              </thead>
              <tbody>
                {resume.education.map((edu, idx) => (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="border border-slate-400 px-2 py-1 font-medium">{edu.end_date || edu.start_date || '-'}</td>
                    <td className="border border-slate-400 px-2 py-1 text-left font-medium">
                      {edu.degree} {edu.field && !edu.degree?.includes(edu.field) ? `[${edu.field}]` : ''}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-left">{edu.institution}</td>
                    <td className="border border-slate-400 px-2 py-1 font-bold">{edu.gpa || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Key Projects */}
      {(() => {
        const rawProjects = resume.projects || [];
        if (!rawProjects.length) return null;

        // Clean & merge any stray "W" or ghost artifact projects
        const displayProjects = [];
        let i = 0;
        while (i < rawProjects.length) {
          const p = rawProjects[i];
          const title = (p.title || '').trim();
          const isGhost = /^([Ww\s\|\/\\]+|live demo|github)$/i.test(title) || (title.length <= 2 && !/[a-z]{2,}/i.test(title));

          if (isGhost) {
            if (displayProjects.length > 0) {
              const prev = displayProjects[displayProjects.length - 1];
              if (p.description && !prev.description) {
                prev.description = p.description;
              } else if (p.description && prev.description && !prev.description.includes(p.description.slice(0, 30))) {
                prev.description += '\n' + p.description;
              }
              if (p.technologies && !prev.technologies) {
                prev.technologies = p.technologies;
              }
              if (p.live_link && !prev.live_link) prev.live_link = p.live_link;
              if (p.github_link && !prev.github_link) prev.github_link = p.github_link;
              if (p.link && !prev.link) prev.link = p.link;
            }
            i++;
            continue;
          }

          // Check if current project has empty description, and next is ghost with description
          let mergedDesc = p.description || '';
          let mergedTech = p.technologies || '';
          let mergedLive = p.live_link || '';
          let mergedGh = p.github_link || '';
          let mergedLink = p.link || '';

          if (!mergedDesc && i + 1 < rawProjects.length) {
            const nextP = rawProjects[i + 1];
            const nextTitle = (nextP.title || '').trim();
            if (/^([Ww\s\|\/\\]+|live demo|github)$/i.test(nextTitle) || nextTitle.length <= 2) {
              mergedDesc = nextP.description || '';
              if (!mergedTech) mergedTech = nextP.technologies || '';
              if (!mergedLive) mergedLive = nextP.live_link || '';
              if (!mergedGh) mergedGh = nextP.github_link || '';
              if (!mergedLink) mergedLink = nextP.link || '';
              i++;
            }
          }

          displayProjects.push({
            ...p,
            title: title.replace(/\b(Live Demo|GitHub|Live|Demo)\b/gi, '').replace(/[\|\x87\ufffd\▯\?]+/g, '').trim(),
            description: mergedDesc,
            technologies: mergedTech,
            live_link: mergedLive || (mergedLink && !mergedLink.includes('github.com') ? mergedLink : ''),
            github_link: mergedGh || (mergedLink && mergedLink.includes('github.com') ? mergedLink : ''),
            link: mergedLink
          });
          i++;
        }

        if (!displayProjects.length) return null;

        return (
          <section className={`mb-3.5 transition-all duration-300 rounded ${highlightSection === 'projects' || highlightSection === 'project' ? 'ring-2 ring-emerald-500 bg-emerald-50/40 p-1.5' : ''}`}>
            <div className="flex items-center justify-between bg-[#e9ecef] border-y border-slate-400 px-2 py-0.5 mb-1.5">
              <h2 className="text-[11.5px] font-bold text-black uppercase tracking-wider">
                Key Projects
              </h2>
              {(highlightSection === 'projects' || highlightSection === 'project') && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                  Just Updated
                </span>
              )}
            </div>
            <div className="space-y-3 px-1">
              {displayProjects.map((proj, idx) => {
                const rawLink = proj.link || '';
                const liveUrl = proj.live_link || (!proj.github_link && rawLink && !rawLink.includes('github.com') ? rawLink : '');
                const githubUrl = proj.github_link || (rawLink && rawLink.includes('github.com') ? rawLink : '');

                return (
                  <div key={idx}>
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-black text-[12.5px]">{proj.title}</span>
                      {(liveUrl || githubUrl) && (
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-700">
                          {liveUrl && (
                            <a 
                              href={liveUrl.startsWith('http') ? liveUrl : `https://${liveUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 hover:underline text-slate-800 font-semibold"
                            >
                              <ExternalLink className="w-2.5 h-2.5 text-indigo-600" /> Live Demo
                            </a>
                          )}
                          {liveUrl && githubUrl && <span className="text-slate-400">|</span>}
                          {githubUrl && (
                            <a 
                              href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 hover:underline text-slate-800 font-semibold"
                            >
                              <Github className="w-2.5 h-2.5" /> GitHub
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {proj.description && (
                      <div className="mt-1 space-y-0.5 text-slate-900">
                        {proj.description.split('\n').filter(Boolean).map((line, lIdx) => (
                          <p key={lIdx} className="flex items-start gap-1.5 text-justify">
                            <span className="select-none font-bold">•</span>
                            <span>{line.replace(/^[•\-\*–■]\s*/, '')}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {proj.technologies && (
                      <p className="text-[11px] text-slate-800 mt-1">
                        <span className="font-bold italic">Tech Stack:</span> <span className="italic">{proj.technologies}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* 4. Experience / Internships */}
      {resume.experience && resume.experience.length > 0 && (
        <section className={`mb-3.5 transition-all duration-300 rounded ${highlightSection === 'experience' ? 'ring-2 ring-emerald-500 bg-emerald-50/40 p-1.5' : ''}`}>
          <div className="flex items-center justify-between bg-[#e9ecef] border-y border-slate-400 px-2 py-0.5 mb-1.5">
            <h2 className="text-[11.5px] font-bold text-black uppercase tracking-wider">
              Experience
            </h2>
            {highlightSection === 'experience' && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                Just Updated
              </span>
            )}
          </div>
          <div className="space-y-3 px-1">
            {resume.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-black text-[12.5px]">{exp.role}</span>
                  <span className="text-[11px] text-slate-800 font-medium">
                    {exp.start_date} {exp.start_date && (exp.end_date || exp.is_current) ? '–' : ''} {exp.is_current ? 'Present' : exp.end_date}
                  </span>
                </div>
                {exp.company && (
                  <p className="text-[11.5px] text-slate-800 italic">{exp.company}</p>
                )}
                {exp.description && (
                  <div className="mt-1 space-y-0.5 text-slate-900">
                    {exp.description.split('\n').filter(Boolean).map((line, lIdx) => (
                      <p key={lIdx} className="flex items-start gap-1.5 text-justify">
                        <span className="select-none font-bold">•</span>
                        <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Skills & Technologies (Formatted 2-Column Key-Value List) */}
      {Object.keys(skillsByCategory).length > 0 && (
        <section className={`mb-3.5 transition-all duration-300 rounded ${highlightSection === 'skills' || highlightSection === 'skill' ? 'ring-2 ring-emerald-500 bg-emerald-50/40 p-1.5' : ''}`}>
          <div className="flex items-center justify-between bg-[#e9ecef] border-y border-slate-400 px-2 py-0.5 mb-1.5">
            <h2 className="text-[11.5px] font-bold text-black uppercase tracking-wider">
              Skills & Technologies
            </h2>
            {(highlightSection === 'skills' || highlightSection === 'skill') && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                Just Updated
              </span>
            )}
          </div>
          <div className="space-y-1 px-1 text-[11.5px]">
            {Object.entries(skillsByCategory).map(([cat, skillsList], idx) => (
              <div key={idx} className="flex items-baseline gap-2">
                <span className="font-bold text-black min-w-[160px]">{cat} :</span>
                <span className="text-slate-900">{skillsList.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Achievements */}
      {resume.achievements && resume.achievements.length > 0 && (
        <section className="mb-2">
          <div className="bg-[#e9ecef] border-y border-slate-400 px-2 py-0.5 mb-1.5">
            <h2 className="text-[11.5px] font-bold text-black uppercase tracking-wider">
              Achievements
            </h2>
          </div>
          <div className="space-y-1 px-1 text-slate-900">
            {resume.achievements.map((ach, idx) => (
              <p key={idx} className="flex items-start gap-1.5 text-justify">
                <span className="select-none font-bold">•</span>
                <span>{ach.description || ach.title}</span>
              </p>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export const ResumePreview = ({ 
  resume, 
  template: propTemplate, 
  highlightedText = null, 
  highlightSection = null,
  isFullPageMode = false 
}) => {
  const [template, setTemplate] = useState(propTemplate || resume?.template || 'academic');
  const [fontSize, setFontSize] = useState('normal');
  const [downloading, setDownloading] = useState(false);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [autoFit, setAutoFit] = useState(true);
  const [zoom, setZoom] = useState(0.75);
  const [modalZoom, setModalZoom] = useState(1.0);
  const containerRef = useRef(null);
  const modalContainerRef = useRef(null);

  // Dynamic Auto-fit Zoom: Automatically fits the 800px resume sheet edge-to-edge
  // inside whatever column width is available without any horizontal scrolling or cutoff.
  useEffect(() => {
    if (!containerRef.current) return;

    const computeFitScale = () => {
      if (!autoFit || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width > 80) {
        // Resume is 800px wide. Keep 24px padding margin for clean aesthetic
        const availableWidth = width - 28;
        const scale = Math.min(1.05, Math.max(0.35, Number((availableWidth / 805).toFixed(2))));
        setZoom(scale);
      }
    };

    computeFitScale();

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        computeFitScale();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', computeFitScale);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', computeFitScale);
    };
  }, [autoFit]);

  // Dynamic Fit for Fullscreen Modal as well
  useEffect(() => {
    if (!isFullViewOpen || !modalContainerRef.current) return;
    const computeModalFit = () => {
      if (!modalContainerRef.current) return;
      const width = modalContainerRef.current.clientWidth;
      if (width > 100) {
        const availableWidth = width - 48;
        const scale = Math.min(1.15, Math.max(0.5, Number((availableWidth / 820).toFixed(2))));
        setModalZoom(scale);
      }
    };
    computeModalFit();
    window.addEventListener('resize', computeModalFit);
    return () => window.removeEventListener('resize', computeModalFit);
  }, [isFullViewOpen]);

  // Close full view on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullViewOpen) {
        setIsFullViewOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullViewOpen]);

  if (!resume) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
        No resume data to preview.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    await downloadResumePdf(resume, setDownloading);
  };

  const fontSizeClass = {
    small: 'text-[11px] leading-normal',
    normal: 'text-[12px] leading-relaxed',
    compact: 'text-[10.5px] leading-snug'
  }[fontSize];

  // Group skills by category for academic table layout
  const skillsByCategory = {};
  if (resume.skills && Array.isArray(resume.skills)) {
    resume.skills.forEach(s => {
      const cat = (typeof s === 'object' ? s.category : 'Technical') || 'Technical';
      const name = typeof s === 'object' ? s.skill_name : String(s);
      if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
      if (name && !skillsByCategory[cat].includes(name)) {
        skillsByCategory[cat].push(name);
      }
    });
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      
      {/* Preview Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
        
        {/* Template Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">Template:</span>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="academic">Academic / LaTeX Style (Photo Standard)</option>
            <option value="modern">Modern Executive</option>
            <option value="classic">Classic Minimal</option>
          </select>
        </div>

        {/* Density Selector */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 font-medium mr-1">Density:</span>
          {['compact', 'normal', 'small'].map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium transition-colors ${
                fontSize === size 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Zoom Controls with Auto-Fit Width */}
        <div className="flex items-center gap-1 text-xs border border-slate-200 rounded-md px-1.5 py-0.5 bg-slate-50">
          <button
            onClick={() => {
              setAutoFit(false);
              setZoom(prev => Math.max(0.35, Number((prev - 0.05).toFixed(2))));
            }}
            className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[11px] font-mono font-medium text-slate-700 px-1 min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => {
              setAutoFit(false);
              setZoom(prev => Math.min(1.4, Number((prev + 0.05).toFixed(2))));
            }}
            className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              if (autoFit) {
                setAutoFit(false);
                setZoom(1.0);
              } else {
                setAutoFit(true);
              }
            }}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
              autoFit 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
            title={autoFit ? "Auto-Fit Width is Active (Click for 100%)" : "Fit resume completely to screen"}
          >
            {autoFit ? 'Fit Width ✓' : 'Fit Width'}
          </button>
        </div>

        {/* Action buttons: Full View, Print, Download ATS PDF */}
        <div className="flex items-center gap-2">
          
          {/* Full View Button */}
          <button
            onClick={() => {
              setIsFullViewOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            title="Open Fullscreen Resume View"
            id="btn-resume-full-view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full View</span>
          </button>

          <button
            onClick={handlePrint}
            title="Print Resume"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloading ? 'Downloading...' : 'Download ATS PDF'}</span>
          </button>
        </div>
      </div>

      {/* Live Printable Document Sheet Canvas with Auto-fit Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100/70 p-2 sm:p-4 rounded-xl border border-slate-200 flex justify-center items-start"
      >
        <div 
          style={{ zoom: zoom }} 
          className="transition-all duration-150 my-1 origin-top shrink-0"
        >
          <ResumeDocument
            resume={resume}
            template={template}
            fontSizeClass={fontSizeClass}
            highlightSection={highlightSection}
            highlightedText={highlightedText}
            skillsByCategory={skillsByCategory}
            id="resume-printable"
          />
        </div>
      </div>

      {/* Full Screen Resume Presentation Modal */}
      {isFullViewOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Fullscreen Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    {resume.title || 'Full Resume View'}
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                    Full View A4
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {resume.full_name} • {resume.headline || 'Standard ATS Format'}
                </p>
              </div>
            </div>

            {/* Center: Zoom Controls */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setModalZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium text-slate-200 min-w-[45px] text-center">
                {Math.round(modalZoom * 100)}%
              </span>
              <button
                onClick={() => setModalZoom(prev => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <button
                onClick={() => setModalZoom(1.0)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${modalZoom === 1.0 ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
              >
                100%
              </button>
              <button
                onClick={() => {
                  if (modalContainerRef.current) {
                    const width = modalContainerRef.current.clientWidth;
                    const scale = Math.min(1.15, Math.max(0.5, Number(((width - 48) / 820).toFixed(2))));
                    setModalZoom(scale);
                  }
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors text-slate-300 hover:bg-slate-700"
              >
                Fit Page
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{downloading ? 'Exporting...' : 'Download ATS PDF'}</span>
              </button>

              <button
                onClick={() => setIsFullViewOpen(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg transition-all shadow-sm ml-2 border border-rose-500 cursor-pointer"
                title="Exit Full View (or press Esc)"
                id="btn-exit-full-view"
              >
                <X className="w-4 h-4" />
                <span>Exit Full View</span>
              </button>
            </div>
          </div>

          {/* Floating Exit Button for instant click access */}
          <button
            onClick={() => setIsFullViewOpen(false)}
            className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900/90 hover:bg-rose-600 rounded-full shadow-2xl backdrop-blur-md border border-slate-700 hover:border-rose-500 transition-all hover:scale-105 cursor-pointer"
            title="Exit Full View (Esc)"
          >
            <X className="w-4 h-4 text-rose-400 group-hover:text-white" />
            <span>Exit Full View (Esc)</span>
          </button>

          {/* Full Screen Scrollable Canvas */}
          <div ref={modalContainerRef} className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
            <div 
              style={{ zoom: modalZoom }} 
              className="transition-all duration-150 my-2 origin-top"
            >
              <ResumeDocument
                resume={resume}
                template={template}
                fontSizeClass={fontSizeClass}
                highlightSection={highlightSection}
                highlightedText={highlightedText}
                skillsByCategory={skillsByCategory}
                id="resume-printable-fullscreen"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

