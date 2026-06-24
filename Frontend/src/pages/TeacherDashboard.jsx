import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const mockTodayClasses = [
  { id: 1, name: 'Physics Masterclass', time: '10:00 AM – 11:30 AM', students: '12 / 15', mode: 'Online' },
  { id: 2, name: 'Mathematics Batch', time: '2:00 PM – 3:00 PM', students: '18 / 20', mode: 'Offline' },
  { id: 3, name: 'Chemistry Revision', time: '4:30 PM – 6:00 PM', students: '8 / 10', mode: 'Online' },
];

const mockUpcoming = [
  { id: 201, name: 'Physics Doubt Session', date: 'Tomorrow', time: '10:00 AM' },
  { id: 202, name: 'Math Weekly Test', date: 'Friday', time: '4:00 PM' },
];

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [pendingQueries, setPendingQueries] = useState([]);
  const [customClassrooms, setCustomClassrooms] = useState([]);

  useEffect(() => {
    document.title = "Teacher Dashboard — TrueEd";
    let combinedData = [];
    const savedClassroom = localStorage.getItem('trueed_classroom_queries');
    if (savedClassroom) combinedData = [...combinedData, ...JSON.parse(savedClassroom)];
    const savedGeneral = localStorage.getItem('trueed_general_queries');
    if (savedGeneral) combinedData = [...combinedData, ...JSON.parse(savedGeneral)];
    
    // For dashboard, just show pending ones meant for this teacher
    // We mock teacher identity matching by just taking all pending if no specific ID logic
    const pending = combinedData
      .filter(q => q.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4); // Only show top 4 on dashboard
      
    setPendingQueries(pending);

    const savedTeacherClassrooms = localStorage.getItem('trueed_teacher_classrooms');
    if (savedTeacherClassrooms) {
      const allClassrooms = JSON.parse(savedTeacherClassrooms);
      // Mock filtering by teacher identity: usually we'd match user.id
      const queryClassrooms = allClassrooms.filter(c => c.isCustomForQuery);
      setCustomClassrooms(queryClassrooms);
    }
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-fadeIn">
      {/* SaaS Hero Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-sora font-extrabold text-slate-900 tracking-tight mb-5">
            Good Morning, {user?.name?.split(' ')[0] || 'Teacher'} 👋
          </h1>
          <div className="space-y-2 mb-8">
            <p className="text-slate-600 font-medium flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-navy"></span> {mockTodayClasses.length} classes today
            </p>
            <p className="text-slate-600 font-medium flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {pendingQueries.length} pending queries
            </p>
            <p className="text-slate-600 font-medium flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> 1 classroom reaching capacity
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/teacher/classrooms" className="px-6 py-3 bg-navy text-white font-semibold rounded-lg shadow-sm hover:shadow hover:bg-navy-light transition-all flex items-center gap-2">
              Create Classroom
            </Link>
            <Link to="/teacher/queries" className="px-6 py-3 bg-white text-slate-700 border border-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              View Queries
            </Link>
          </div>
        </div>
        <div className="hidden md:flex w-32 h-32 rounded-full bg-slate-50 border-4 border-white shadow-xl items-center justify-center flex-shrink-0">
          <span className="text-4xl font-bold text-navy">{user?.initials || 'T'}</span>
        </div>
      </div>

      {/* Classrooms Overview Minimal Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Active Classrooms', value: '4' },
          { label: 'Total Students', value: '67' },
          { label: 'Pending Queries', value: pendingQueries.length },
          { label: 'Monthly Earnings', value: '₹22,400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-2xl font-sora font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-12">
          {/* Today's Classes */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-sora font-bold text-slate-900 tracking-tight">Today's Classes</h2>
              <Link to="/teacher/classrooms" className="text-sm font-semibold text-navy hover:text-sky transition">
                View All <i className="fa-solid fa-arrow-right ml-1"></i>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {mockTodayClasses.map((cls) => (
                <div key={cls.id} className="p-6 border border-slate-200 rounded-xl bg-white hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{cls.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{cls.time}</p>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-5 text-sm font-medium">
                      <span className="text-slate-600">{cls.students} Students</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${cls.mode === 'Online' ? 'bg-sky-50 text-sky-600' : 'bg-purple-50 text-purple-600'}`}>{cls.mode}</span>
                    </div>
                    <button className="w-full py-2.5 bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-sm">
                      Open Classroom
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pending Classroom Queries */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-sora font-bold text-slate-900 tracking-tight">Pending Queries</h2>
              <Link to="/teacher/queries" className="text-sm font-semibold text-navy hover:text-sky transition">
                Manage All <i className="fa-solid fa-arrow-right ml-1"></i>
              </Link>
            </div>
            
            <div className="space-y-4">
              {pendingQueries.length === 0 ? (
                <div className="p-8 border border-slate-200 rounded-xl bg-white text-center">
                  <p className="text-slate-500 font-medium">No pending queries right now.</p>
                </div>
              ) : (
                pendingQueries.map((query) => (
                  <div key={query.id} className="p-5 border border-slate-200 rounded-xl bg-white hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-500 font-bold flex items-center justify-center shrink-0 text-sm">
                          {query.studentName ? query.studentName.charAt(0) : (query.student ? query.student.charAt(0) : '?')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{query.studentName || query.student}</h4>
                            <span className="text-xs text-slate-400 font-medium">• {formatDate(query.createdAt)}</span>
                          </div>
                          
                          <div className="mb-2">
                            <span className={`text-[10px] uppercase tracking-wider font-bold inline-block px-2 py-1 rounded border ${
                              query.type === 'general' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-navy border-slate-100'
                            }`}>
                              {query.type === 'general' ? 'General Inquiry' : query.classroomName}
                            </span>
                          </div>

                          <p className="text-sm text-slate-600 leading-relaxed max-w-xl font-medium">
                            "{query.message}"
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex shrink-0 sm:w-32 w-full mt-2 sm:mt-0">
                        <Link to="/teacher/queries" className="flex-1 w-full text-center py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition-all">
                          Respond
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Space */}
        <div className="space-y-10">
          {/* Earnings Minimal Card */}
          <section>
            <h2 className="text-lg font-sora font-bold text-slate-900 mb-5 tracking-tight">Earnings</h2>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">This Month</p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-sora font-extrabold text-slate-900">₹22,400</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1.5 border border-emerald-100">+18.5%</span>
                </div>
              </div>
              <div className="pt-5 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Month</p>
                <p className="text-lg font-bold text-slate-600">₹18,900</p>
              </div>
            </div>
          </section>

          {/* Upcoming Timeline */}
          <section>
            <h2 className="text-lg font-sora font-bold text-slate-900 mb-5 tracking-tight">Upcoming Schedule</h2>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 py-2">
                {mockUpcoming.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-navy"></span>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{item.date} • {item.time}</p>
                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                  </div>
                ))}
                <div className="relative pl-6">
                  <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-slate-200"></span>
                  <Link to="/teacher/classrooms" className="text-sm font-semibold text-slate-500 hover:text-navy transition">
                    View full calendar &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Classrooms from Queries Widget */}
          <section>
            <h2 className="text-lg font-sora font-bold text-slate-900 mb-5 tracking-tight">Custom Classrooms</h2>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              {customClassrooms.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">No private classrooms created from queries yet.</p>
              ) : (
                <div className="space-y-4">
                  {customClassrooms.map(c => (
                    <div key={c.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-navy text-sm line-clamp-1 pr-2">{c.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          c.enrolled > 0 ? 'bg-success/10 text-success' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {c.enrolled > 0 ? 'Enrolled' : 'Awaiting'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">Student: <span className="font-semibold text-slate-700">{c.linkedStudent}</span></p>
                      <p className="text-xs text-slate-500">{c.schedule}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
