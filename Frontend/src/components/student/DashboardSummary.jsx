import { Link } from 'react-router-dom';
import { Flame, Book, Calendar, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';

export default function DashboardSummary({ stats, loading }) {
  const streak = stats?.streakDays || 0;
  const activeClassrooms = stats?.activeClassroomsCount || 0;
  const upcomingClass = stats?.upcomingClasses?.[0] || null;
  const pendingQueries = stats?.pendingQueriesCount || 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-36 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Learning Streak */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-brand flex flex-col justify-between hover-lift group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Learning Streak</h3>
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="font-sora font-extrabold text-3xl text-slate-900 mb-1">{streak} Days</p>
          <p className="text-xs font-semibold text-amber-600">Keep learning every day!</p>
        </div>
      </div>

      {/* Active Classrooms */}
      <Link to="/student/rooms" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-brand flex flex-col justify-between hover-lift group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Classrooms</h3>
          <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky group-hover:bg-sky-100 transition-colors">
            <Book className="w-4 h-4" />
          </div>
        </div>
        <div>
          {activeClassrooms > 0 ? (
            <p className="font-sora font-extrabold text-3xl text-slate-900 mb-1">{activeClassrooms}</p>
          ) : (
            <p className="text-sm font-medium text-slate-500 mt-2 mb-2">No active classrooms.</p>
          )}
          <p className="text-xs font-semibold text-sky group-hover:underline flex items-center gap-1 transition-colors">
            View Classrooms <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </Link>

      {/* Upcoming Class */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-brand flex flex-col justify-between hover-lift group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Upcoming Class</h3>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-navy group-hover:bg-slate-100 transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div>
          {upcomingClass ? (
            <>
              <p className="font-bold text-navy text-sm mb-1 truncate">{upcomingClass.title}</p>
              <p className="text-xs font-medium text-slate-500 mb-2">{upcomingClass.teacherName}</p>
              <Link to={`/student/lobby/${upcomingClass.classroomId}`} className="block w-full text-center py-1.5 px-3 bg-navy text-white text-[11px] font-bold uppercase tracking-wider rounded-md hover:bg-navy-light transition shadow-sm">
                Join Class
              </Link>
            </>
          ) : (
            <p className="text-sm font-medium text-slate-500 my-auto pb-4">No upcoming classes.</p>
          )}
        </div>
      </div>

      {/* Queries */}
      <Link to="/student/my-queries" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-brand flex flex-col justify-between hover-lift group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Queries</h3>
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-100 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active Queries</p>
              <p className="font-sora font-bold text-xl text-slate-900">{pendingQueries}</p>
            </div>
            <p className="text-xs font-semibold text-purple-600 group-hover:underline flex items-center gap-1">
              Track <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
