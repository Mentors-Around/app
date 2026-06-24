import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const getFormattedDate = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  if (daysOffset === 0) return 'Today';
  if (daysOffset === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const mockSessions = [
  { id: 1, teacher: 'Dr. Anand', initials: 'DA', subject: 'Physics', date: getFormattedDate(0), time: '5:00 PM', mode: 'Online' },
  { id: 2, teacher: 'Mrs. Sharma', initials: 'MS', subject: 'Mathematics', date: getFormattedDate(1), time: '10:00 AM', mode: 'Offline' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recommendedClassrooms, setRecommendedClassrooms] = useState([]);

  useEffect(() => {
    document.title = "Student Dashboard — TrueEd";
    
    // Fetch classrooms from local storage or mock
    try {
      const stored = localStorage.getItem('trueed_teacher_classrooms');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Take first 3 active classrooms
          setRecommendedClassrooms(parsed.filter(c => c.status === 'active').slice(0, 4));
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    // Fallback Mock
    setRecommendedClassrooms([
      { id: '1', name: 'Mastering Calculus', subject: 'Mathematics', classLevel: 'JEE', mode: 'Online', pricePerStudent: 999, availableSeats: 15 },
      { id: '2', name: 'Advanced Physics', subject: 'Physics', classLevel: 'NEET', mode: 'Offline', pricePerStudent: 1200, availableSeats: 5 },
      { id: '3', name: 'Python for Beginners', subject: 'Programming', classLevel: 'Class 10', mode: 'Online', pricePerStudent: 799, availableSeats: 20 },
      { id: '4', name: 'Organic Chemistry', subject: 'Chemistry', classLevel: 'Class 12', mode: 'Online', pricePerStudent: 899, availableSeats: 10 },
    ]);
  }, []);

  // Assuming 1 pending query based on requirements mock
  const pendingQueriesCount = 1;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-fadeIn">
      {/* SaaS Hero Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-sora font-extrabold text-slate-900 tracking-tight mb-3">
            Good morning, {user?.name?.split(' ')[0] || 'Student'}.
          </h1>
          <p className="text-slate-500 text-lg max-w-lg leading-relaxed mb-8">
            You have <strong className="text-navy font-semibold">{mockSessions.length} upcoming classes</strong> and <strong className="text-amber-600 font-semibold">{pendingQueriesCount} pending query</strong>. Let's keep the momentum going.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/student/discover" className="px-6 py-3 bg-navy text-white font-semibold rounded-lg shadow-sm hover:shadow hover:bg-navy-light transition-all flex items-center gap-2">
              Discover Classrooms
            </Link>
            <Link to="/student/my-queries" className="px-6 py-3 bg-white text-slate-700 border border-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              My Queries
            </Link>
          </div>
        </div>
        <div className="hidden md:flex w-32 h-32 rounded-full bg-slate-50 border-4 border-white shadow-xl items-center justify-center flex-shrink-0">
          <span className="text-4xl font-bold text-navy">{user?.initials || 'U'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Primary Section: Upcoming Classes */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-sora font-bold text-slate-900 tracking-tight">Upcoming Classes</h2>
              <Link to="/student/bookings" className="text-sm font-semibold text-sky hover:text-navy transition">
                View Calendar <i className="fa-solid fa-arrow-right ml-1"></i>
              </Link>
            </div>
            
            <div className="space-y-4">
              {mockSessions.length === 0 ? (
                <div className="p-8 border border-slate-200 rounded-xl text-center bg-slate-50">
                  <p className="text-slate-500 font-medium">No upcoming classes scheduled.</p>
                </div>
              ) : (
                mockSessions.map((session) => (
                  <div key={session.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all cursor-pointer gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-colors">
                        {session.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg mb-0.5">{session.subject}</h3>
                        <p className="text-sm text-slate-500 font-medium">with {session.teacher}</p>
                      </div>
                    </div>
                    <div className="sm:text-right flex sm:block items-center justify-between sm:w-auto w-full border-t border-slate-100 sm:border-0 pt-3 sm:pt-0">
                      <p className="font-bold text-slate-900">{session.time}</p>
                      <p className="text-sm text-slate-500 font-medium">{session.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recommended Classrooms */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-sora font-bold text-slate-900 tracking-tight">Recommended Classrooms</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {recommendedClassrooms.map((cls) => (
                <div key={cls.id} className="p-5 border border-slate-200 rounded-xl bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex flex-col">
                  <div className="mb-6">
                    <h3 className="font-bold text-slate-900 text-lg leading-snug mb-1.5 line-clamp-1">{cls.name || 'Classroom'}</h3>
                    <p className="text-sm text-slate-500 font-medium">{cls.subject} • {cls.classLevel || 'General'}</p>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Price</p>
                      <p className="font-bold text-slate-900">₹{cls.pricePerStudent}</p>
                    </div>
                    <Link to={`/student/classroom/${cls.id}`} className="text-sm font-semibold text-navy hover:text-sky transition flex items-center gap-1">
                      Details <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Minimal Quick Actions */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="font-sora font-bold text-slate-900 mb-5">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/student/discover" className="flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-600 hover:text-slate-900 font-medium text-sm group">
                <span className="flex items-center gap-3">
                  <i className="fa-solid fa-compass text-slate-400 group-hover:text-navy transition-colors w-4"></i> 
                  Explore Classes
                </span>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
              </Link>
              <Link to="/student/bookings" className="flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-600 hover:text-slate-900 font-medium text-sm group">
                <span className="flex items-center gap-3">
                  <i className="fa-solid fa-calendar-alt text-slate-400 group-hover:text-navy transition-colors w-4"></i> 
                  My Schedule
                </span>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
              </Link>
              <Link to="/student/profile" className="flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-600 hover:text-slate-900 font-medium text-sm group">
                <span className="flex items-center gap-3">
                  <i className="fa-solid fa-user text-slate-400 group-hover:text-navy transition-colors w-4"></i> 
                  Edit Profile
                </span>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
              </Link>
              <Link to="/contact" className="flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-600 hover:text-slate-900 font-medium text-sm group">
                <span className="flex items-center gap-3">
                  <i className="fa-regular fa-life-ring text-slate-400 group-hover:text-navy transition-colors w-4"></i> 
                  Get Support
                </span>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
