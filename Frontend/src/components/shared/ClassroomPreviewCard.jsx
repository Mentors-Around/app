import React from 'react';
import { Star, IndianRupee, Users, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClassroomPreviewCard = ({ classroomId, name, subject, teacherName, rating, price, enrolled, schedule, onEnroll }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mt-2 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="flex-1">
        <h4 className="font-bold text-navy text-lg line-clamp-1">{name || 'Advanced Mastery Class'}</h4>
        <p className="text-sm text-slate-500 font-medium mb-3">{subject || 'Various Subjects'} • by {teacherName || 'Teacher'}</p>
        
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {rating || '4.8'}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {enrolled || '12'} Enrolled
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {schedule || 'Mon, Wed, Fri'}
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 text-success">
            <IndianRupee className="w-3.5 h-3.5" />
            {price || '1200'}/mo
          </div>
        </div>
      </div>
      
      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
        {onEnroll && (
          <button 
            onClick={onEnroll}
            className="flex-1 md:flex-none px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg shadow-sm hover:bg-navy-light transition text-center"
          >
            Enroll Now
          </button>
        )}
        <Link 
          to={`/classroom/${classroomId || 1}`} 
          className="flex-1 md:flex-none px-4 py-2 bg-white text-navy border border-slate-200 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition text-center flex items-center justify-center gap-1"
        >
          View Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default ClassroomPreviewCard;
