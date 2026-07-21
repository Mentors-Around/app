import { Link } from 'react-router-dom';
import { PlayCircle, Clock, Calendar, ArrowRight, Loader2 } from 'lucide-react';

export default function LearningOverview({ activeEnrollments, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-brand h-48 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    );
  }

  const recentEnrollment = activeEnrollments?.[0];
  const classroom = recentEnrollment?.classroomId;

  if (!classroom) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
        <PlayCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="font-sora font-bold text-slate-900 text-xl mb-2">Ready to Start Learning?</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">Join a live classroom and start your educational journey today. You'll see your progress here.</p>
        <Link 
          to="/student/discover"
          className="inline-flex items-center gap-2 px-8 py-3 bg-navy text-white font-bold rounded-xl shadow-sm hover:shadow hover:bg-navy-light transition"
        >
          Discover Classes <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const teacherName = classroom.teacherId?.name || 'Tutor';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-brand relative overflow-hidden group hover:border-navy/20 hover-lift">
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-sky-50 to-transparent pointer-events-none opacity-50"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider rounded-md">
              <PlayCircle className="w-3.5 h-3.5" /> Continue Learning
            </span>
          </div>

          <h2 className="font-sora font-extrabold text-2xl md:text-3xl text-slate-900 mb-2 leading-tight">
            {classroom.title}
          </h2>
          
          <p className="text-slate-500 font-medium flex items-center gap-2 mb-6">
            by {teacherName} • <span className="text-navy font-bold">{classroom.subject}</span>
          </p>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-2 w-max max-w-full">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Mode</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{classroom.mode || 'Online Interactive'}</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 shrink-0 flex flex-col justify-between">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</span>
              <span className="font-sora font-extrabold text-emerald-600 text-sm uppercase">Active Student</span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Enrolled on {new Date(recentEnrollment.createdAt).toLocaleDateString()}
            </p>
          </div>

          <Link 
            to={`/classroom/${classroom._id}`}
            className="w-full py-4 bg-navy text-white font-bold text-center rounded-xl hover:bg-navy-light transition shadow flex items-center justify-center gap-2"
          >
            View Classroom <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
