import React from 'react';

export const ScoreBadge = ({ score, matchLevel, size = "md", subtitle = "" }) => {
  const numericScore = typeof score === 'number' ? Math.round(score) : 0;
  
  let colorTheme = {
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    fill: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300"
  };

  if (numericScore < 60) {
    colorTheme = {
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      fill: "text-amber-700",
      badge: "bg-amber-100 text-amber-800 border-amber-300"
    };
  } else if (numericScore < 80) {
    colorTheme = {
      bg: "bg-blue-50 text-blue-800 border-blue-200",
      fill: "text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-300"
    };
  }

  if (size === "lg") {
    return (
      <div className={`p-6 rounded-xl border ${colorTheme.bg} flex flex-col sm:flex-row items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="w-18 h-18 rounded-full bg-white border-2 border-current shadow-xs flex items-center justify-center">
            <span className="text-3xl font-bold tracking-tight">
              {numericScore}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                ATS Compatibility Score
              </h3>
              {matchLevel && (
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${colorTheme.badge}`}>
                  {matchLevel}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-md">
              {subtitle || "An estimated score based on your resume's alignment with this job's keywords, skills, and structure."}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-slate-900">{numericScore} <span className="text-sm font-normal text-slate-500">/ 100</span></div>
          <span className="text-[11px] text-slate-500 font-medium">Explainable 6-Pillar Model</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorTheme.bg}`}>
      <span className="font-bold text-sm">{numericScore}/100</span>
      {matchLevel && (
        <span className="text-xs font-medium border-l border-slate-300/80 pl-2">
          {matchLevel}
        </span>
      )}
    </div>
  );
};
