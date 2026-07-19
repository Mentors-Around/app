import React from 'react';
import { CheckCircle2, Circle, PartyPopper } from 'lucide-react';

const ProfileCompletionCard = ({ type, fields, onFieldClick }) => {
  const completedFields = fields.filter(f => f.isComplete);
  const totalFields = fields.length;
  const percentage = Math.round((completedFields.length / totalFields) * 100);
  const isComplete = percentage === 100;

  const tipText = type === 'teacher' 
    ? "Complete your profile to improve visibility in search results and increase student trust."
    : "Complete your profile to receive better classroom and teacher recommendations.";

  const successTitle = type === 'teacher'
    ? "Your profile is complete!"
    : "Profile Complete!";

  const successText = type === 'teacher'
    ? "Your profile is fully optimized for discovery."
    : "Your profile is ready for the best learning experience.";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Left Side: Progress */}
        <div className="flex-1">
          <h2 className="font-sora text-lg font-bold text-navy mb-4">Profile Completion</h2>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-shimmer" style={{
                  backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  backgroundSize: '200% 100%'
                }}></div>
              </div>
            </div>
            <span className="font-bold text-navy text-lg w-12 text-right">{percentage}%</span>
          </div>
          
          <p className="text-sm font-semibold text-slate-500 mb-4">
            {completedFields.length} of {totalFields} completed
          </p>

          {isComplete ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
              <PartyPopper className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-800">{successTitle}</p>
                <p className="text-sm text-emerald-600 mt-1">{successText}</p>
              </div>
            </div>
          ) : (
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">💡</span>
              <p className="text-sm font-medium text-sky-800 leading-relaxed">
                {tipText}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Checklist */}
        <div className="flex-1 md:max-w-xs w-full bg-slate-50 rounded-xl p-5 border border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {isComplete ? 'All Requirements Met' : 'Complete these to reach 100%'}
          </h3>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {fields.map((field, idx) => (
              <div 
                key={idx}
                onClick={() => !field.isComplete && onFieldClick && onFieldClick(field.id)}
                className={`flex items-center gap-3 text-sm py-1.5 ${field.isComplete ? 'text-slate-400' : 'text-navy font-semibold cursor-pointer hover:text-sky transition-colors'}`}
              >
                {field.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span className={field.isComplete ? 'line-through decoration-slate-300' : ''}>
                  {field.name}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileCompletionCard;
