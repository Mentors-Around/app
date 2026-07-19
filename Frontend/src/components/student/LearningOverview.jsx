import { Link } from 'react-router-dom';
import { PlayCircle, Clock, Calendar, ArrowRight } from 'lucide-react';

export default function LearningOverview() {
  const mockRecentClassroom = {
    id: '101',
    name: 'Mastering Calculus & Advanced Mathematics',
    teacher: 'Dr. Anand',
    progress: 70, // percentage
    completed: 7,
    total: 10,
    nextLesson: 'Derivatives Part 2 • Today at 6:00 PM',
    lastOpened: '2 hours ago'
  };

  if (!mockRecentClassroom) {
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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-brand relative overflow-hidden group hover:border-navy/20 hover-lift">
      {/* Decorative gradient background element */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-sky-50 to-transparent pointer-events-none opacity-50"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        
        {/* Left Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider rounded-md">
              <PlayCircle className="w-3.5 h-3.5" /> Continue Learning
            </span>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last opened {mockRecentClassroom.lastOpened}
            </span>
          </div>

          <h2 className="font-sora font-extrabold text-2xl md:text-3xl text-slate-900 mb-2 leading-tight">
            {mockRecentClassroom.name}
          </h2>
          
          <p className="text-slate-500 font-medium flex items-center gap-2 mb-6">
            <i className="fa-solid fa-chalkboard-user text-slate-400"></i> by {mockRecentClassroom.teacher}
          </p>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-2 w-max max-w-full">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next Lesson</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{mockRecentClassroom.nextLesson}</p>
            </div>
          </div>
        </div>

        {/* Right Content: Progress & CTA */}
        <div className="w-full md:w-64 shrink-0 flex flex-col justify-between">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Progress</span>
              <span className="font-sora font-extrabold text-navy text-lg">{mockRecentClassroom.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-navy h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${mockRecentClassroom.progress}%` }}
              ></div>
            </div>
            <p className="text-xs font-semibold text-slate-400 text-right">
              {mockRecentClassroom.completed} of {mockRecentClassroom.total} classes completed
            </p>
          </div>

          <Link 
            to={`/classroom/${mockRecentClassroom.id}`}
            className="w-full py-4 bg-navy text-white font-bold text-center rounded-xl hover:bg-navy-light transition shadow flex items-center justify-center gap-2"
          >
            Continue Learning <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
