import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, Trophy, TrendingUp, Users, BookOpen, DollarSign, Star } from 'lucide-react';
import adminService from '@/services/admin.service';
import Spinner from '@/components/shared/Spinner';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';

const StatBox = ({ icon: Icon, label, value, sub, color = 'text-navy', bg = 'bg-navy/10' }) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-sora font-black text-navy text-xl">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 font-semibold">{sub}</p>}
    </div>
  </div>
);

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [topTeachers, setTopTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Analytics — TrueEd Admin';
    const fetchAll = async () => {
      try {
        const [statsRes, topRes] = await Promise.all([
          adminService.getPlatformStats(),
          adminService.getTopTeachers({ limit: 10 }),
        ]);
        setStats(statsRes.data?.data ?? statsRes.data);
        const topPayload = topRes.data?.data ?? topRes.data;
        setTopTeachers(topPayload?.teachers ?? topPayload ?? []);
      } catch {
        toast.error('Could not load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const userStats = stats?.userStats || [];
  const classroomStats = stats?.classroomStats || [];
  const paymentStats = stats?.paymentStats || [];

  const totalUsers = userStats.reduce((s, u) => s + u.count, 0);
  const totalActiveUsers = userStats.reduce((s, u) => s + (u.active || 0), 0);
  const totalClassrooms = classroomStats.reduce((s, c) => s + c.count, 0);
  const totalRevenuePaise = paymentStats.reduce((s, p) => s + (p.totalPaise || 0), 0);

  return (
    <div className="font-inter pb-10">
      <div className="mb-6">
        <h1 className="font-sora text-2xl font-extrabold text-navy">Platform Analytics</h1>
        <p className="text-sm text-muted mt-1">Overview of platform performance and key metrics.</p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox icon={Users} label="Total Users" value={totalUsers} sub={`${totalActiveUsers} active`} />
        <StatBox icon={BookOpen} label="Total Classrooms" value={totalClassrooms} color="text-sky" bg="bg-sky/10" />
        <StatBox icon={DollarSign} label="Gross Revenue" value={formatCurrency(totalRevenuePaise / 100)} color="text-emerald-600" bg="bg-emerald-50" sub="All captured payments" />
        <StatBox icon={TrendingUp} label="Payment Types" value={paymentStats.length} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Users by Role */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-6">
          <h2 className="font-sora font-bold text-navy mb-4 flex items-center gap-2">
            <Users size={16} className="text-navy" /> Users by Role
          </h2>
          <div className="space-y-3">
            {userStats.map((u) => {
              const pct = totalUsers > 0 ? Math.round((u.count / totalUsers) * 100) : 0;
              return (
                <div key={u._id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-navy capitalize">{u._id}</span>
                    <span className="text-slate-500">{u.count} ({u.active} active)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-navy rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Classrooms by Status */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-6">
          <h2 className="font-sora font-bold text-navy mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-navy" /> Classrooms by Status
          </h2>
          <div className="space-y-3">
            {classroomStats.map((c) => {
              const pct = totalClassrooms > 0 ? Math.round((c.count / totalClassrooms) * 100) : 0;
              return (
                <div key={c._id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-navy">{humanizeEnum(c._id)}</span>
                    <span className="text-slate-500">{c.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Type */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-6">
          <h2 className="font-sora font-bold text-navy mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-navy" /> Revenue by Payment Type
          </h2>
          <div className="space-y-3">
            {paymentStats.map((p) => (
              <div key={p._id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600 font-semibold">{humanizeEnum(p._id)}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-navy">{formatCurrency((p.totalPaise || 0) / 100)}</p>
                  <p className="text-[10px] text-slate-400">{p.count} transactions</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Teachers */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-6">
          <h2 className="font-sora font-bold text-navy mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" /> Top Performing Teachers
          </h2>
          {topTeachers.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">No data available</p>
          ) : (
            <div className="space-y-3">
              {topTeachers.slice(0, 8).map((t, idx) => (
                <div key={t._id || idx} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${idx < 3 ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-navy">{t.name || t.userId?.name || 'Teacher'}</p>
                      <p className="text-[10px] text-muted">{t.totalStudentsTaught || 0} students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={12} className="fill-amber-400" />
                    <span className="text-xs font-bold text-navy">{(t.avgRating || t.stats?.avgRating || 0).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
