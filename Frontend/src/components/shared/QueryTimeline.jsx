import React from 'react';
import { User, MessageCircle, CheckCircle, PlusCircle, AlertCircle, Calendar, GraduationCap, XCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';

const QueryTimeline = ({ events, userType }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
        No conversation yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {events.map((event, index) => {
        const isStudent = event.type === 'submitted' || event.type === 'student_reply';
        const isSystem = event.type === 'system_action' || event.type === 'private_classroom' || event.type === 'payment_completed';
        
        let Icon = MessageCircle;
        let iconBg = 'bg-slate-100 text-slate-500';
        
        if (event.type === 'submitted') { Icon = User; iconBg = 'bg-blue-100 text-blue-500'; }
        if (event.type === 'teacher_reply') { Icon = GraduationCap; iconBg = 'bg-green-100 text-green-500'; }
        if (isSystem) {
          if (event.actionType === 'teacher_approved' || event.actionType === 'enrolled') { Icon = CheckCircle; iconBg = 'bg-success/20 text-success'; }
          if (event.actionType === 'teacher_rejected') { Icon = XCircle; iconBg = 'bg-error/20 text-error'; }
          if (event.type === 'private_classroom') { Icon = PlusCircle; iconBg = 'bg-purple-100 text-purple-500'; }
        }

        return (
          <div key={event.id || index} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            {/* Icon */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${iconBg} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
              <Icon className="w-4 h-4" />
            </div>
            
            {/* Card */}
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-sm ${isSystem ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {isStudent ? (userType === 'student' ? 'You' : 'Student') : 
                   isSystem ? 'System' : 
                   (userType === 'teacher' ? 'You' : 'Teacher')}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{formatDate(event.timestamp)}</span>
              </div>
              
              <div className="text-sm font-medium text-slate-700">
                {event.content}
              </div>
              
              {/* Optional embedded content (like classroom card preview placeholder) */}
              {event.children}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QueryTimeline;
