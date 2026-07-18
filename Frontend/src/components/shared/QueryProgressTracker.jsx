import React from 'react';
import { Check } from 'lucide-react';

const QueryProgressTracker = ({ currentStatus }) => {
  // Map our backend statuses to the UI steps
  const steps = [
    { id: 'submitted', label: 'Submitted', statuses: ['pending', 'pending_review'] },
    { id: 'reviewing', label: 'Teacher Reviewing', statuses: ['waiting_for_student'] },
    { id: 'action', label: 'Waiting for Action', statuses: ['accepted', 'approved_waiting_payment'] },
    { id: 'enrolled', label: 'Resolved / Enrolled', statuses: ['enrolled', 'resolved'] }
  ];

  // Determine current step index
  let currentIndex = 0;
  if (['rejected', 'auto_rejected', 'approval_expired', 'closed_inactive', 'expired', 'lapsed'].includes(currentStatus)) {
    return (
      <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
        Query Closed: {currentStatus.replace(/_/g, ' ')}
      </div>
    );
  }

  if (['enrolled', 'resolved'].includes(currentStatus)) currentIndex = 3;
  else if (['accepted', 'approved_waiting_payment', 'waiting_for_student'].includes(currentStatus)) currentIndex = 2;
  else if (['pending', 'pending_review'].includes(currentStatus)) currentIndex = 1;
  else currentIndex = 0;

  return (
    <div className="w-full py-4 font-inter">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
        
        {/* Progress line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-navy rounded-full z-0 transition-all duration-500 ease-in-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                isCompleted ? 'bg-navy border-navy text-white' :
                isCurrent ? 'bg-white border-navy text-navy font-bold' :
                'bg-white border-slate-200 text-slate-300'
              }`}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] sm:text-xs font-bold">{index + 1}</span>}
              </div>
              <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-center absolute top-9 w-20 ${
                isCurrent ? 'text-navy' : isCompleted ? 'text-slate-700' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-6"></div> {/* Spacer for absolute labels */}
    </div>
  );
};

export default QueryProgressTracker;
