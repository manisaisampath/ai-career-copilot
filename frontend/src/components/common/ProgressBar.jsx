import React from 'react';

export const ProgressBar = ({ label, score, weight, description }) => {
  const percentage = Math.min(100, Math.max(0, Math.round(score || 0)));
  
  let barColor = "bg-emerald-600";
  if (percentage < 55) {
    barColor = "bg-amber-500";
  } else if (percentage < 75) {
    barColor = "bg-blue-600";
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800">{label}</span>
          {weight && (
            <span className="text-[11px] text-slate-400 font-normal">
              ({weight}% weight)
            </span>
          )}
        </div>
        <span className="font-bold text-slate-900">{percentage}%</span>
      </div>
      
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
        <div 
          className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {description && (
        <p className="text-[11px] text-slate-500">{description}</p>
      )}
    </div>
  );
};
