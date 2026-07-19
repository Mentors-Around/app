import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import DashboardSummary from '../components/student/DashboardSummary';
import LearningOverview from '../components/student/LearningOverview';
import ActivityFeed from '../components/student/ActivityFeed';

export default function StudentDashboard() {
  const { user } = useAuth();
  useEffect(() => {
    document.title = "Student Dashboard — TrueEd";
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16 animate-fadeIn">
      {/* 1. Greeting Section */}
      <div className="bg-gradient-to-r from-navy to-blue-600 rounded-2xl border border-navy-light p-8 md:p-12 shadow-brand flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-sora font-extrabold text-white tracking-tight mb-3">
            Good morning, {user?.name?.split(' ')[0] || 'Student'}.
          </h1>
          <p className="text-blue-100 text-lg max-w-lg leading-relaxed mb-8">
            Let's keep the momentum going. You're doing great!
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/student/discover" className="px-6 py-3 bg-white text-navy font-bold rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all flex items-center gap-2">
              Discover Classrooms
            </Link>
          </div>
        </div>
        <div className="hidden md:flex w-32 h-32 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 shadow-xl items-center justify-center flex-shrink-0">
          <span className="text-4xl font-bold text-white">{user?.initials || 'U'}</span>
        </div>
      </div>

      {/* 2. Quick Stats */}
      <DashboardSummary />

      {/* 3. Continue Learning (Largest Section) */}
      <section className="pt-4">
        <LearningOverview />
      </section>

      {/* 4. Recent Activity (Expanded Width) */}
      <section className="pt-4">
        <ActivityFeed />
      </section>
    </div>
  );
}
