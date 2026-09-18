import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { resumeService } from '../../api/services';
import { Sparkles, Check, ArrowRight, ShieldCheck, RefreshCw, RotateCcw } from 'lucide-react';

export const AIEnhanceModal = ({
  isOpen,
  onClose,
  sectionType,
  originalText,
  targetRole,
  onApply
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [editableSuggested, setEditableSuggested] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await resumeService.enhanceSection({
        section_type: sectionType || 'summary',
        original_text: originalText || '',
        context_role: targetRole || 'Software Engineer'
      });
      setResult(res.data);
      setEditableSuggested(res.data?.suggested_text || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate enhancement. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    } else {
      setResult(null);
      setEditableSuggested('');
      setError('');
    }
  }, [isOpen]);

  const handleAccept = () => {
    const textToApply = editableSuggested || result?.suggested_text;
    if (textToApply) {
      onApply(textToApply);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Content Enhancement"
      subtitle={`Improving ${sectionType || 'content'} with active technical phrasing and ATS clarity`}
    >
      <div className="space-y-4">
        
        {/* Factual Grounding Disclaimer */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <b>Factual Grounding:</b> Suggestions polish active voice and technical clarity without fabricating false achievements or metrics.
          </span>
        </div>

        {loading && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-700" />
            <p className="text-xs text-slate-600 font-medium">Generating role-specific phrasing improvements...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-md font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Enhancement</span>
            </button>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Original */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Original
                </span>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {result.original_text || '(Empty text)'}
                </p>
              </div>

              {/* Suggested with inline editing */}
              <div className="p-3.5 bg-emerald-50/40 border border-emerald-300 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    AI Suggested Phrasing
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                    ATS-Optimized
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={editableSuggested}
                  onChange={(e) => setEditableSuggested(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-200 rounded text-xs text-slate-900 font-medium leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  You can fine-tune the suggestion above before applying.
                </span>
              </div>
            </div>

            {/* Changes list */}
            {result.changes_made && result.changes_made.length > 0 && (
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Key Phrasing Improvements
                </span>
                <ul className="text-xs text-slate-600 space-y-1">
                  {result.changes_made.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Keep Original
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Apply Suggestion</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
};
