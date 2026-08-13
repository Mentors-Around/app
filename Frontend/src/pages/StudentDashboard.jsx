import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import DashboardSummary from '../components/student/DashboardSummary';
import LearningOverview from '../components/student/LearningOverview';
import ActivityFeed from '../components/student/ActivityFeed';

import StudentAvatar from '../components/shared/StudentAvatar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Student Dashboard — TrueEd";
    const fetchStats = async () => {
      try {
        const data = await api.user.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 md:space-y-12 pb-16 animate-fadeIn">
      {/* 1. Greeting Section */}
      <div className="bg-gradient-to-r from-navy to-blue-600 rounded-2xl border border-navy-light p-5 sm:p-8 md:p-12 shadow-brand flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="w-full md:w-auto text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-sora font-extrabold text-white tracking-tight mb-2 sm:mb-3">
            Good morning, {user?.name?.split(' ')[0] || 'Student'}.
          </h1>
          <p className="text-blue-100 text-sm sm:text-lg max-w-lg leading-relaxed mb-6 sm:mb-8">
            Let's keep the momentum going. You're doing great!
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/student/discover" className="w-full sm:w-auto text-center px-6 py-3 bg-white text-navy font-bold rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              Discover Classrooms
            </Link>
          </div>
        </div>
        <div className="hidden md:flex w-32 h-32 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 shadow-xl items-center justify-center flex-shrink-0 overflow-hidden">
          <StudentAvatar studentId={user?.id || user?._id} name={user?.name} initials={user?.initials} className="w-full h-full text-4xl" />
        </div>
      </div>

      {/* 2. Quick Stats */}
      <DashboardSummary stats={stats} loading={loading} />

      {/* 3. Continue Learning */}
      <section className="pt-4">
        <LearningOverview activeEnrollments={stats?.activeEnrollments} loading={loading} />
      </section>

      {/* 4. Recent Activity */}
      <section className="pt-4">
        <ActivityFeed activities={stats?.recentActivities} loading={loading} />
      </section>
    </div>
  );
}
