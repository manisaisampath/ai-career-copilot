import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewService } from '../api/services';
import { 
  MessageSquareCode, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Clock,
  Send,
  SkipForward,
  RefreshCw,
  BarChart2,
  FileCheck2
} from 'lucide-react';

export const InterviewSessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const res = await interviewService.getInterview(id);
      setInterview(res.data);

      // Find first unanswered question
      const questions = res.data.questions || [];
      const firstUnanswered = questions.findIndex(q => !q.answer);
      if (firstUnanswered !== -1) {
        setCurrentIndex(firstUnanswered);
        setEvaluation(null);
      } else if (questions.length > 0) {
        // All answered already
        setCurrentIndex(questions.length - 1);
        setEvaluation(questions[questions.length - 1].answer);
      }
    } catch (err) {
      console.error("Interview load error:", err);
      setError("Failed to load interview session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterview();
  }, [id]);

  const currentQuestion = interview?.questions?.[currentIndex];
  const isLastQuestion = interview?.questions && currentIndex === interview.questions.length - 1;

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!currentAnswerText.trim() || !currentQuestion) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await interviewService.submitAnswer(interview.id, {
        question_id: currentQuestion.id,
        answer: currentAnswerText.trim()
      });
      setEvaluation(res.data);
      // Update local question answer state
      const updatedQuestions = [...interview.questions];
      updatedQuestions[currentIndex].answer = res.data;
      setInterview({ ...interview, questions: updatedQuestions });
    } catch (err) {
      setError("Failed to submit and evaluate answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      navigate(`/interview/report/${interview.id}`);
    } else {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswerText('');
      setEvaluation(null);
    }
  };

  const handleSkip = async () => {
    if (currentQuestion && !currentQuestion.answer) {
      try {
        setSubmitting(true);
        const res = await interviewService.submitAnswer(interview.id, {
          question_id: currentQuestion.id,
          answer: "Skipped by candidate"
        });
        const updatedQuestions = [...interview.questions];
        updatedQuestions[currentIndex].answer = res.data;
        setInterview({ ...interview, questions: updatedQuestions });
      } catch (err) {
        console.warn("Skip submission failed:", err);
      } finally {
        setSubmitting(false);
      }
    }

    if (isLastQuestion) {
      navigate(`/interview/report/${interview.id}`);
    } else {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswerText('');
      setEvaluation(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-700" />
        <p className="text-xs text-slate-500 font-medium">Preparing focused interview room...</p>
      </div>
    );
  }

  if (error || !interview || !currentQuestion) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-xs text-slate-600 font-medium">{error || "Interview session not found."}</p>
        <button
          onClick={() => navigate('/interview')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to Setup
        </button>
      </div>
    );
  }

  const answeredCount = interview.questions.filter(q => q.answer).length;
  const progressPercent = Math.round(((currentIndex + 1) / interview.questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Session Progress Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Target Role: {interview.job_title}
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            {interview.type.toUpperCase()} Mock Interview Session
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900">
              Question {currentIndex + 1} of {interview.questions.length}
            </span>
            <span className="block text-[10px] text-slate-400">{progressPercent}% complete</span>
          </div>
          <button
            onClick={() => navigate(`/interview/report/${interview.id}`)}
            className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
          >
            End & View Report
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
        <div 
          className="h-full bg-slate-900 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xs">
        
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                {currentQuestion.category}
              </span>
              {currentQuestion.context_project && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Referencing Project: {currentQuestion.context_project}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-950 leading-snug pt-1">
              {currentQuestion.question}
            </h1>
          </div>
        </div>

        {/* Answer Input or Evaluation View */}
        {!evaluation ? (
          <form onSubmit={handleSubmitAnswer} className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Your Technical Response</label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentAnswerText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={7}
                required
                value={currentAnswerText}
                onChange={(e) => setCurrentAnswerText(e.target.value)}
                placeholder="Structure your answer with situation, architecture choices, specific tools used, and technical trade-offs..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip Question</span>
              </button>

              <button
                type="submit"
                disabled={submitting || !currentAnswerText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Evaluating Response...' : 'Submit Answer'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Response Evaluation Results Card */
          <div className="space-y-5 pt-2 animate-in fade-in duration-200">
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Response Quality Indicators
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-900">
                  <span>Score: {Math.round(evaluation.overall_score)}/100</span>
                </div>
              </div>

              {/* 4 Objective Criteria Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { label: "Relevance", val: evaluation.relevance_score },
                  { label: "Technical Depth", val: evaluation.technical_score },
                  { label: "Completeness", val: evaluation.completeness_score },
                  { label: "Clarity", val: evaluation.clarity_score },
                ].map((crit, i) => (
                  <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-center">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase">{crit.label}</span>
                    <span className="text-sm font-bold text-slate-900">{Math.round(crit.val)}%</span>
                  </div>
                ))}
              </div>

              {/* Constructive Feedback */}
              <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1">
                {evaluation.feedback}
              </p>
            </div>

            {/* Strong Points & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evaluation.strong_points?.length > 0 && (
                <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    What Worked Well
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {evaluation.strong_points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold select-none">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.improvement_areas?.length > 0 && (
                <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-lg space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    How to Strengthen Next Time
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {evaluation.improvement_areas.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold select-none">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Next Action Button */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <span>{isLastQuestion ? 'Complete Interview & View Final Report' : 'Continue to Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
