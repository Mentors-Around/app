import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api.js';

const mockTodayClasses = [
  { id: 1, name: 'Physics Masterclass', time: '10:00 AM – 11:30 AM', students: '12 / 15', mode: 'Online' },
  { id: 2, name: 'Mathematics Batch', time: '2:00 PM – 3:00 PM', students: '18 / 20', mode: 'Offline' },
];

const mockUpcoming = [
  { id: 201, name: 'Physics Doubt Session', date: 'Tomorrow', time: '10:00 AM' },
  { id: 202, name: 'Math Weekly Test', date: 'Friday', time: '4:00 PM' },
];

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState({
    activeClassroomsCount: 4,
    pendingQueriesCount: 0,
    resolvedQueriesCount: 9,
    thisMonthEarningsRs: 22400,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Teacher Dashboard — TrueEd";
    
    const fetchTeacherStats = async () => {
      try {
        const data = await api.teacher.getDashboard();
        if (data) {
          setDashboardData(prev => ({
            ...prev,
            activeClassroomsCount: data.activeClassroomsCount ?? data.classroomsCount ?? prev.activeClassroomsCount,
            pendingQueriesCount: data.pendingQueriesCount ?? data.pendingQueries ?? prev.pendingQueriesCount,
            resolvedQueriesCount: data.resolvedQueriesCount ?? data.resolvedQueries ?? prev.resolvedQueriesCount,
            thisMonthEarningsRs: data.thisMonthEarningsRs ?? (data.thisMonthEarningsPaise / 100) ?? prev.thisMonthEarningsRs,
          }));
        }
      } catch (err) {
        console.warn('Teacher dashboard backend sync info:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherStats();
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-sora font-extrabold text-slate-900 tracking-tight mb-5">
            Good Morning, {user?.name?.split(' ')[0] || 'Teacher'} 👋
          </h1>
          <div className="space-y-3 mb-8">
            <p className="text-slate-600 font-medium flex items-center gap-3">
              <span className="text-xl">📅</span> {mockTodayClasses.length} Classes Today
            </p>
            <Link to="/teacher/queries" className="text-slate-600 font-medium flex items-center gap-3 hover:text-sky transition-colors w-max">
              <span className="text-xl">💬</span> {dashboardData.pendingQueriesCount} New Queries Awaiting Review
            </Link>
            <p className="text-slate-600 font-medium flex items-center gap-3">
              <span className="text-xl">⚠️</span> 1 Classroom Near Capacity
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/teacher/classrooms" className="px-6 py-3 bg-navy text-white font-semibold rounded-lg shadow-sm hover:shadow hover:bg-navy-light transition-all flex items-center gap-2">
              Create Classroom
            </Link>
          </div>
        </div>
        
        {/* Teacher Profile Avatar */}
        <div className="hidden md:flex flex-col items-center justify-center shrink-0 relative pl-8">
          <div className="absolute inset-0 bg-sky-400/20 blur-3xl rounded-full translate-y-2 scale-75"></div>
          <div className="relative w-[150px] h-[150px] rounded-full bg-slate-50 border-[5px] border-white shadow-[0_12px_30px_rgba(15,23,42,0.12)] flex items-center justify-center mb-5">
            <span className="text-[52px] font-bold text-navy">{user?.initials || 'HL'}</span>
          </div>
          <div className="text-center relative">
            <h3 className="text-[20px] font-bold text-slate-900">{user?.name || 'Hari Prasad L'}</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center justify-center gap-1.5">
              Verified Teacher <i className="fa-solid fa-circle-check text-sky"></i>
            </p>
          </div>
        </div>
      </div>

      {/* Classrooms Overview Minimal Cards */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover-lift transition-all flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Classrooms</p>
          <p className="text-2xl font-sora font-bold text-slate-900">{dashboardData.activeClassroomsCount}</p>
        </div>
        
        <Link to="/teacher/queries" className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover-lift transition-all flex flex-col justify-between group">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Queries</p>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Pending</p>
              <p className="text-xl font-sora font-bold text-amber-500">{dashboardData.pendingQueriesCount}</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Resolved</p>
              <p className="text-xl font-sora font-bold text-slate-900">{dashboardData.resolvedQueriesCount}</p>
            </div>
          </div>
        </Link>
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
                    <Link to={`/teacher/classrooms/${cls.id}`} className="block text-center w-full py-2.5 bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-sm cursor-pointer">
                      Open Classroom
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pending Classroom Queries Removed As Per Instruction */}
        </div>

        {/* Sidebar Space */}
        <div className="space-y-10">
          {/* Earnings Minimal Card */}
          <section>
            <h2 className="text-lg font-sora font-bold text-slate-900 mb-5 tracking-tight">Earnings</h2>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover-lift transition-all">
              <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">This Month</p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-sora font-extrabold text-slate-900">₹22,400</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1.5 border border-emerald-100">+18.5%</span>
                </div>
              </div>
              <div className="pt-5 border-t border-slate-100 mb-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Month</p>
                <p className="text-lg font-bold text-slate-600">₹18,900</p>
              </div>
              <Link to="/teacher/earnings" className="text-sm font-semibold text-navy hover:text-sky transition flex items-center justify-center w-full py-2 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100">
                View Earnings
              </Link>
            </div>
          </section>

          {/* Upcoming Timeline */}
          <section>
            <h2 className="text-lg font-sora font-bold text-slate-900 mb-5 tracking-tight">Upcoming Schedule</h2>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover-lift transition-all">
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
        </div>
      </div>
    </div>
  );
}
