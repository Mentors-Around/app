import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Compass, CheckCircle2, Wallet, Clock, Bell, Video, MapPin, Users2, Ticket } from 'lucide-react';
import enrollmentService from '@/services/enrollment.service';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/shared/StatCard';
import Spinner from '@/components/shared/Spinner';
import { formatCurrency } from '@/utils/format.util';
import { timeAgo } from '@/utils/date.util';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await enrollmentService.getStudentDashboard();
        setData(res?.data ?? res);
      } catch (err) {
        toast.error(err?.message || 'Could not load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  const counts = data?.classroomCounts || { active: 0, completed: 0 };
  const wallet = data?.wallet || { tokenBalance: 0, cashBalancePaise: 0 };
  const upcoming = data?.upcomingClasses || [];
  const notices = data?.recentNotices || [];
  const tabCounts = data?.queryTabCounts || {};

  return (
    <div>
      <h1 className="font-sora text-2xl font-extrabold text-navy mb-1">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
      <p className="text-sm text-muted mb-6">Here's what's happening with your learning.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users2} iconBg="bg-sky/10" iconColor="text-sky" label="Active classrooms" value={counts.active} />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" label="Completed" value={counts.completed} />
        <StatCard icon={Ticket} iconBg="bg-amber/10" iconColor="text-amber" label="Query tokens" value={wallet.tokenBalance} />
        <StatCard icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" label="Cash balance" value={formatCurrency((wallet.cashBalancePaise || 0) / 100)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming classes */}
        <div className="lg:col-span-2 bg-white rounded-brand shadow-brand p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-bold text-navy flex items-center gap-2"><Clock size={18} /> Upcoming this week</h2>
            <Link to="/student/discover" className="text-xs font-bold text-sky hover:underline">Find more classrooms</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Compass className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-sm text-muted mb-4">No classes scheduled in the next 7 days.</p>
              <Link to="/student/discover" className="inline-flex items-center gap-2 bg-navy text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-navy-hover transition">
                Discover classrooms
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition">
                  <div className="w-10 h-10 rounded-full bg-sky/10 flex items-center justify-center shrink-0">
                    {s.mode === 'online' || s.gmeetLink ? <Video size={16} className="text-sky" /> : <MapPin size={16} className="text-sky" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/classroom/${s.classroomId}`}>
                      <p className="text-sm font-bold text-navy truncate hover:text-sky transition-colors">{s.classroomTitle}</p>
                    </Link>
                    <p className="text-xs text-muted">{s.date} &middot; {s.startTime}</p>
                  </div>
                  {s.gmeetLink && (
                    <a href={s.gmeetLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-white bg-navy px-3 py-1.5 rounded-lg hover:bg-navy-hover transition shrink-0">
                      Join
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: notices + query status */}
        <div className="space-y-6">
          <div className="bg-white rounded-brand shadow-brand p-6">
            <h2 className="font-sora font-bold text-navy flex items-center gap-2 mb-4"><Bell size={18} /> Recent notices</h2>
            {notices.length === 0 ? (
              <p className="text-sm text-muted">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {notices.slice(0, 5).map((n) => (
                  <div key={n._id} className="text-sm">
                    <p className="font-semibold text-navy line-clamp-1">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-brand shadow-brand p-6">
            <h2 className="font-sora font-bold text-navy flex items-center gap-2 mb-4"><CheckCircle2 size={18} /> Query status</h2>
            <div className="space-y-2 text-sm">
              {['active', 'accepted', 'enrolled', 'rejected', 'expired'].map((k) => (
                <div key={k} className="flex justify-between">
                  <span className="capitalize text-muted">{k}</span>
                  <span className="font-bold text-navy">{tabCounts[k] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
