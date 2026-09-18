import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { atsService, resumeService } from '../api/services';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  RotateCcw, 
  AlertTriangle, 
  Tag, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  Layers,
  Edit3,
  Undo2,
  X,
  Save,
  Plus,
  Hash,
  ExternalLink
} from 'lucide-react';
import { ResumePreview } from '../components/resume/ResumePreview';

export const ResumeOptimizePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const analysisId = searchParams.get('id');

  const [analysis, setAnalysis] = useState(null);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState({});
  const [appliedSet, setAppliedSet] = useState(new Set());
  const [reanalyzing, setReanalyzing] = useState(false);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [mobileTab, setMobileTab] = useState('suggestions'); // 'suggestions' | 'preview'

  // Inline editing state per suggestion card
  const [customTexts, setCustomTexts] = useState({});
  const [editingMap, setEditingMap] = useState({});
  const [highlightSection, setHighlightSection] = useState(null);

  // Quick Manual Resume Editor Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTab, setManualTab] = useState('skills'); // 'skills' | 'projects' | 'summary'
  const [manualSkills, setManualSkills] = useState('');
  const [manualProjects, setManualProjects] = useState([]);
  const [manualSummary, setManualSummary] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  const isSuggestionApplied = (sugg) => {
    if (sugg.applied || appliedSet.has(sugg.id)) return true;
    if (!activeResume) return false;
    
    const target = (sugg.target_section || '').toLowerCase().trim();
    const text = (customTexts[sugg.id] || sugg.applied_text || sugg.suggested_text || '').toLowerCase().trim();
    if (!text) return false;

    if (target.includes('skill')) {
      return (activeResume.skills || []).some(s => {
        const name = (typeof s === 'object' ? s.skill_name : String(s)).toLowerCase().trim();
        return name === text || text.split(',').map(x => x.trim()).includes(name);
      });
    }
    if (target.includes('summary')) {
      return (activeResume.summary || '').toLowerCase().trim() === text;
    }
    if (target.includes('project')) {
      return (activeResume.projects || []).some(p => {
        const desc = (p.description || '').toLowerCase().trim();
        return desc.includes(text) || text.includes(desc) || desc === text;
      });
    }
    if (target.includes('experience')) {
      return (activeResume.experience || []).some(e => {
        const desc = (e.description || '').toLowerCase().trim();
        return desc.includes(text) || desc === text;
      });
    }
    return false;
  };

  const fetchOptimizationData = async () => {
    try {
      setLoading(true);
      let res;
      if (analysisId) {
        res = await atsService.getAnalysis(analysisId);
      } else {
        const resumes = await resumeService.getResumes();
        if (resumes.data.length > 0) {
          res = await atsService.getLatestForResume(resumes.data[0].id);
        }
      }
      if (res?.data) {
        setAnalysis(res.data);
        // Pre-populate applied set and custom texts from analysis record
        const initialApplied = new Set();
        const initialCustom = {};
        (res.data.optimization_suggestions || []).forEach(s => {
          if (s.applied) initialApplied.add(s.id);
          if (s.applied_text) initialCustom[s.id] = s.applied_text;
        });
        setAppliedSet(initialApplied);
        setCustomTexts(prev => ({ ...prev, ...initialCustom }));

        // Fetch corresponding active resume for live preview
        const resumeRes = await resumeService.getResume(res.data.resume_id);
        setActiveResume(resumeRes.data);
      } else {
        setError("No analysis record found.");
      }
    } catch (err) {
      console.error("Optimization load error:", err);
      setError("Failed to load optimization center.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimizationData();
  }, [analysisId]);

  const handleApplySuggestion = async (suggestion) => {
    setApplying(prev => ({ ...prev, [suggestion.id]: true }));
    setError('');
    const textToApply = customTexts[suggestion.id] !== undefined ? customTexts[suggestion.id] : suggestion.suggested_text;
    
    try {
      const res = await atsService.applySuggestion(analysis.id, {
        suggestion_id: suggestion.id,
        target_section: suggestion.target_section,
        applied_text: textToApply
      });

      // Update active resume live state immediately so preview updates instantly!
      if (res.data?.resume) {
        setActiveResume(res.data.resume);
      }

      // Update analysis state with the updated optimization suggestions
      if (res.data?.analysis?.optimization_suggestions) {
        setAnalysis(prev => ({
          ...prev,
          optimization_suggestions: res.data.analysis.optimization_suggestions
        }));
      }

      setAppliedSet(prev => new Set([...prev, suggestion.id]));
      setEditingMap(prev => ({ ...prev, [suggestion.id]: false }));
      
      // Visually highlight the target section in Live Resume Preview
      const sectionKey = (suggestion.target_section || '').toLowerCase();
      setHighlightSection(sectionKey);
      setTimeout(() => setHighlightSection(null), 4000);

      setNotification(`✓ Successfully applied suggestion to resume ${suggestion.target_section}! Live preview updated.`);
      setTimeout(() => setNotification(''), 5000);
    } catch (err) {
      console.error("Apply suggestion error:", err);
      setError(err.response?.data?.detail || "Failed to apply suggestion. Please try again.");
    } finally {
      setApplying(prev => ({ ...prev, [suggestion.id]: false }));
    }
  };

  const handleUndoSuggestion = async (suggestion) => {
    setApplying(prev => ({ ...prev, [suggestion.id]: true }));
    setError('');
    const textApplied = customTexts[suggestion.id] || suggestion.applied_text || suggestion.suggested_text;
    
    try {
      const res = await atsService.undoSuggestion(analysis.id, {
        suggestion_id: suggestion.id,
        target_section: suggestion.target_section,
        applied_text: textApplied
      });

      if (res.data?.resume) {
        setActiveResume(res.data.resume);
      }
      if (res.data?.analysis?.optimization_suggestions) {
        setAnalysis(prev => ({
          ...prev,
          optimization_suggestions: res.data.analysis.optimization_suggestions
        }));
      }

      setAppliedSet(prev => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });

      setHighlightSection(suggestion.target_section.toLowerCase());
      setTimeout(() => setHighlightSection(null), 3000);

      setNotification(`✓ Reverted "${suggestion.title}" on your resume.`);
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error("Undo error:", err);
      setError(err.response?.data?.detail || "Failed to undo suggestion.");
    } finally {
      setApplying(prev => ({ ...prev, [suggestion.id]: false }));
    }
  };

  const handleReanalyze = async () => {
    if (!analysis) return;
    setReanalyzing(true);
    setError('');
    try {
      const res = await atsService.analyze({
        resume_id: analysis.resume_id,
        job_description_id: analysis.job_description_id
      });
      setAnalysis(res.data);
      const resumeRes = await resumeService.getResume(res.data.resume_id);
      setActiveResume(resumeRes.data);
      setNotification(`✓ Re-analysis complete! New ATS Compatibility: ${Math.round(res.data.overall_score)}/100.`);
      setTimeout(() => setNotification(''), 5000);
    } catch (err) {
      console.error("Reanalyze error:", err);
      setError("Failed to re-analyze resume.");
    } finally {
      setReanalyzing(false);
    }
  };

  // Open Quick Manual Resume Editor
  const openManualModal = () => {
    if (!activeResume) return;
    
    // Convert skills to comma separated string
    const skillList = (activeResume.skills || []).map(s => typeof s === 'object' ? s.skill_name : String(s));
    setManualSkills(skillList.join(', '));
    
    // Copy projects deep
    const projs = (activeResume.projects || []).map(p => ({
      title: p.title || '',
      technologies: p.technologies || '',
      description: p.description || '',
      link: p.link || '',
      live_link: p.live_link !== undefined ? p.live_link : (!p.github_link && p.link && !p.link.includes('github.com') ? p.link : ''),
      github_link: p.github_link !== undefined ? p.github_link : (p.link && p.link.includes('github.com') ? p.link : '')
    }));
    setManualProjects(projs);
    
    setManualSummary(activeResume.summary || '');
    setShowManualModal(true);
  };

  // Save manual updates directly to active resume
  const handleSaveManual = async () => {
    if (!activeResume) return;
    setSavingManual(true);
    setError('');
    try {
      // Parse skills back into objects
      const parsedSkills = manualSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(skill_name => ({ skill_name, category: 'Technical' }));

      const updatedPayload = {
        ...activeResume,
        summary: manualSummary,
        skills: parsedSkills,
        projects: manualProjects
      };

      const res = await resumeService.updateResume(activeResume.id, updatedPayload);
      setActiveResume(res.data);
      setShowManualModal(false);
      setNotification("✓ Resume updated manually! Check the Live Preview on the right.");
      setTimeout(() => setNotification(''), 5000);
    } catch (err) {
      console.error("Manual update error:", err);
      setError("Failed to save manual changes to resume.");
    } finally {
      setSavingManual(false);
    }
  };

  // Helper to render text with numbers/metrics highlighted in emerald bold
  const renderQuantifiedText = (text) => {
    if (!text) return null;
    // Highlight percentages, numerical ranges, scale, latencies like 35%, 10,000+, 99.9%, 220ms
    const regex = /(\b\d+[\d,\.]*(?:%|\+|ms|s|k|x)?\b)/gi;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <span key={i} className="font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/60 font-mono text-[11px]">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-700" />
        <p className="text-xs text-slate-500 font-medium">Loading targeted resume optimizations...</p>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <p className="text-xs text-rose-600 font-medium">{error}</p>
        <Link to="/job-match" className="text-xs font-bold text-slate-900 underline">
          Go to Job Match
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10.5px] font-semibold text-slate-700 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            <span>Interactive Optimization Center & Live Diff Preview</span>
          </div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Targeted Fixes for {analysis?.job_title || 'Target Role'}
          </h1>
          <p className="text-[11px] text-slate-500">
            Keep essential keywords, add quantified project metrics with numbers, and preview changes live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Manual Resume Editor Button */}
          <button
            onClick={openManualModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
            title="Update Skills, Projects, or Summary manually"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>Quick Edit Resume</span>
          </button>

          {/* Full Resume Builder Link */}
          {activeResume && (
            <Link
              to={`/resume?id=${activeResume.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors"
              title="Open full 10-section resume builder"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Full Builder</span>
            </Link>
          )}

          {/* Mobile Tab Toggle */}
          <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setMobileTab('suggestions')}
              className={`px-3 py-1 text-xs font-semibold rounded-md ${mobileTab === 'suggestions' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
            >
              Suggestions
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-md ${mobileTab === 'preview' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
            >
              Live Preview
            </button>
          </div>

          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Re-analyzing...' : 'Re-Analyze Score'}</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Split Layout: Suggestions on Left, Live Resume Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[750px]">
        
        {/* Left Column: Targeted Suggestions (Col 6) */}
        <div className={`lg:col-span-6 space-y-4 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Score status card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
                {Math.round(analysis?.overall_score || 0)}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">ATS Compatibility: {analysis?.match_level}</div>
                <p className="text-[11px] text-slate-500">
                  {analysis?.optimization_suggestions?.length || 0} actionable suggestions (Keywords, Quantified Metrics & Summary).
                </p>
              </div>
            </div>

            <Link
              to={`/interview?jobId=${analysis?.job_description_id}&resumeId=${analysis?.resume_id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
            >
              <span>Mock Interview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Suggestions list */}
          <div className="space-y-4">
            {analysis?.optimization_suggestions?.map((sugg) => {
              const isApplied = isSuggestionApplied(sugg);
              const isBusy = applying[sugg.id];
              const isEditing = editingMap[sugg.id];
              const currentVal = customTexts[sugg.id] !== undefined ? customTexts[sugg.id] : (sugg.applied_text || sugg.suggested_text || '');

              const isMetric = sugg.type === 'metric' || sugg.id?.includes('metric');
              const isVocab = sugg.type === 'vocabulary' || sugg.id?.includes('vocab');
              const isSkill = sugg.type === 'skill' || (sugg.target_section === 'skills' && !isMetric && !isVocab);
              const isProject = sugg.type === 'project' || sugg.target_section === 'projects';
              const isKeyword = sugg.type === 'keyword';

              return (
                <div 
                  key={sugg.id}
                  className={`bg-white rounded-xl border p-4 space-y-3 shadow-2xs transition-all ${
                    isApplied ? 'border-emerald-300 bg-emerald-50/15' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isMetric ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-emerald-600" />
                          Numbers & Percentages
                        </span>
                      ) : isVocab ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          Professional Words
                        </span>
                      ) : isSkill ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Technical Skill
                        </span>
                      ) : isProject ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-emerald-600" />
                          Project Metrics & Numbers
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {sugg.target_section}
                        </span>
                      )}

                      {sugg.severity === 'high' && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                          High Impact
                        </span>
                      )}

                      {isApplied && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Applied
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {isApplied ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingMap(prev => ({ ...prev, [sugg.id]: !prev[sugg.id] }))}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-slate-600" />
                            <span>{isEditing ? 'Close Edit' : 'Edit & Re-apply'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUndoSuggestion(sugg)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Undo this change from your resume"
                          >
                            <Undo2 className="w-3 h-3 text-rose-600" />
                            <span>Revert</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingMap(prev => ({ ...prev, [sugg.id]: !prev[sugg.id] }))}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                              isEditing 
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isEditing ? 'Done Editing' : 'Customize'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplySuggestion(sugg)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isBusy ? 'Applying...' : 'Apply Suggestion'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Recommendation */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {sugg.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      {sugg.recommendation}
                    </p>
                  </div>

                  {/* Proposed Update Area */}
                  {(sugg.suggested_text || isEditing) && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {isEditing ? 'Customize Suggestion Before Applying:' : 'Proposed Update:'}
                        </span>
                        {isProject && isEditing && (
                          <span className="text-[10px] text-slate-500 italic">
                            Tip: Include concrete numbers & metrics below
                          </span>
                        )}
                      </div>

                      {/* Editing Mode */}
                      {isEditing ? (
                        <div className="space-y-2">
                          {isKeyword ? (
                            <div>
                              <input
                                type="text"
                                value={currentVal}
                                onChange={(e) => setCustomTexts(prev => ({ ...prev, [sugg.id]: e.target.value }))}
                                placeholder="e.g. System Design, Microservices"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                              />
                              <p className="text-[10.5px] text-slate-500 mt-1">
                                Enter the exact keyword name to add to your Technical Skills section. (Comma-separated supported)
                              </p>
                            </div>
                          ) : (
                            <div>
                              <textarea
                                rows={4}
                                value={currentVal}
                                onChange={(e) => setCustomTexts(prev => ({ ...prev, [sugg.id]: e.target.value }))}
                                className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-serif leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-900"
                              />
                              
                              {/* Quick Metric Buttons for Projects */}
                              {isProject && (
                                <div className="space-y-1 mt-1.5">
                                  <span className="text-[10px] font-semibold text-slate-500 block">
                                    Quick-add quantifiable metric templates:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const addition = "\n• Reduced latency by 35% (from 350ms to 220ms) via query optimization and Redis caching.";
                                        setCustomTexts(prev => ({ ...prev, [sugg.id]: (currentVal + addition).trim() }));
                                      }}
                                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10.5px] font-medium"
                                    >
                                      + 35% Latency Drop
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const addition = "\n• Engineered architecture serving 10,000+ daily requests with 99.9% uptime.";
                                        setCustomTexts(prev => ({ ...prev, [sugg.id]: (currentVal + addition).trim() }));
                                      }}
                                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10.5px] font-medium"
                                    >
                                      + 10,000+ Requests & 99.9%
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const addition = "\n• Automated CI/CD testing pipelines, cutting deployment turnaround time by 40%.";
                                        setCustomTexts(prev => ({ ...prev, [sugg.id]: (currentVal + addition).trim() }));
                                      }}
                                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10.5px] font-medium"
                                    >
                                      + 40% CI/CD Speed
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Save / Apply from Edit Mode */}
                          <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleApplySuggestion(sugg)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-2xs"
                            >
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{isApplied ? 'Save & Re-apply to Resume' : 'Apply Customized Text'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <div className="text-slate-900 font-medium whitespace-pre-wrap font-serif leading-relaxed">
                          {renderQuantifiedText(currentVal)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Live Resume Preview (Col 6) */}
        <div className={`lg:col-span-6 ${mobileTab === 'suggestions' ? 'hidden lg:block' : 'block'}`}>
          <div className="sticky top-20 h-[calc(100vh-6.5rem)]">
            <ResumePreview 
              resume={activeResume} 
              template="academic" 
              highlightSection={highlightSection}
            />
          </div>
        </div>

      </div>

      {/* Quick Manual Resume Editor Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-slate-700" />
                  Quick Manual Resume Editor
                </h2>
                <p className="text-[11px] text-slate-500">
                  Update your Skills, Projects, and Summary directly. Changes reflect in your Live Preview immediately.
                </p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Section Tabs */}
            <div className="flex border-b border-slate-200 px-4 bg-slate-100/60">
              <button
                onClick={() => setManualTab('skills')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  manualTab === 'skills'
                    ? 'border-slate-900 text-slate-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Technical Skills ({manualSkills.split(',').filter(Boolean).length})
              </button>
              <button
                onClick={() => setManualTab('projects')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  manualTab === 'projects'
                    ? 'border-slate-900 text-slate-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Projects ({manualProjects.length})
              </button>
              <button
                onClick={() => setManualTab('summary')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  manualTab === 'summary'
                    ? 'border-slate-900 text-slate-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Summary
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {manualTab === 'skills' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Technical Skills (Comma-separated)
                  </label>
                  <textarea
                    rows={6}
                    value={manualSkills}
                    onChange={(e) => setManualSkills(e.target.value)}
                    placeholder="Python, React, FastApi, Docker, System Design, PostgreSQL, Unit Testing..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <p className="text-[11px] text-slate-500">
                    Keep keywords requested by the job description to maximize ATS search match.
                  </p>
                </div>
              )}

              {manualTab === 'projects' && (
                <div className="space-y-4">
                  {manualProjects.map((proj, pIdx) => (
                    <div key={pIdx} className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">Project Title</label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => {
                              const updated = [...manualProjects];
                              updated[pIdx].title = e.target.value;
                              setManualProjects(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">Tech Stack</label>
                          <input
                            type="text"
                            value={proj.technologies}
                            onChange={(e) => {
                              const updated = [...manualProjects];
                              updated[pIdx].technologies = e.target.value;
                              setManualProjects(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">Live Demo URL</label>
                          <input
                            type="text"
                            value={proj.live_link || ''}
                            onChange={(e) => {
                              const updated = [...manualProjects];
                              updated[pIdx].live_link = e.target.value;
                              updated[pIdx].link = e.target.value || updated[pIdx].github_link || '';
                              setManualProjects(updated);
                            }}
                            placeholder="https://demo.app"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">GitHub Repo URL</label>
                          <input
                            type="text"
                            value={proj.github_link || ''}
                            onChange={(e) => {
                              const updated = [...manualProjects];
                              updated[pIdx].github_link = e.target.value;
                              updated[pIdx].link = updated[pIdx].live_link || e.target.value || '';
                              setManualProjects(updated);
                            }}
                            placeholder="https://github.com/..."
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Description (Include numbers & metrics)
                          </label>
                          <span className="text-[10px] text-slate-500">Use bullet lines (•)</span>
                        </div>
                        <textarea
                          rows={4}
                          value={proj.description}
                          onChange={(e) => {
                            const updated = [...manualProjects];
                            updated[pIdx].description = e.target.value;
                            setManualProjects(updated);
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setManualProjects(prev => [
                        ...prev,
                        { title: "New Project", technologies: "", description: "• Built feature delivering 30% performance boost.", link: "" }
                      ]);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-slate-700 font-medium text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Project</span>
                  </button>
                </div>
              )}

              {manualTab === 'summary' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Professional Summary
                  </label>
                  <textarea
                    rows={5}
                    value={manualSummary}
                    onChange={(e) => setManualSummary(e.target.value)}
                    placeholder="Results-driven Software Engineer with hands-on experience building scalable applications..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed font-serif focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <p className="text-[11px] text-slate-500">
                    Align your summary toward the target role requirements and quantify your scope.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              {activeResume && (
                <Link
                  to={`/resume?id=${activeResume.id}`}
                  className="text-xs text-slate-600 hover:text-slate-900 underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Full Resume Builder</span>
                </Link>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManual}
                  disabled={savingManual}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{savingManual ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
