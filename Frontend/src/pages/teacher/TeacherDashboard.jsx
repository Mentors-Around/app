import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, Users2, ShieldAlert, HelpCircle, CalendarClock, Wallet, Video, MapPin, PlusCircle, ToggleLeft, ToggleRight, Loader2, MessageSquare } from 'lucide-react';
import teacherService from '@/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/shared/StatCard';
import Spinner from '@/components/shared/Spinner';
import { formatCurrency } from '@/utils/format.util';
import { VERIFICATION_STATUS } from '@/constants/enums';

const VerificationBanner = ({ status }) => {
  if (status === VERIFICATION_STATUS.APPROVED) return null;
  const copy = {
    [VERIFICATION_STATUS.PENDING]: { text: 'Your KYC is pending submission. Complete it to start accepting students.', tone: 'bg-amber/10 text-amber-hover border-amber/20' },
    [VERIFICATION_STATUS.REJECTED]: { text: 'Your last KYC submission was rejected. Please review and resubmit.', tone: 'bg-error/10 text-error border-error/20' },
    [VERIFICATION_STATUS.SUSPENDED]: { text: 'Your account is suspended. Contact support for details.', tone: 'bg-error/10 text-error border-error/20' },
    under_review: { text: 'Your KYC documents are under review. This usually takes 1-2 business days.', tone: 'bg-sky/10 text-sky border-sky/20' },
  };
  const info = copy[status] || copy[VERIFICATION_STATUS.PENDING];
  return (
    <div className={`flex items-center justify-between gap-4 rounded-brand border p-4 mb-6 ${info.tone}`}>
      <div className="flex items-center gap-3">
        <ShieldAlert size={20} />
        <p className="text-sm font-semibold">{info.text}</p>
      </div>
      {status !== 'under_review' && (
        <Link to="/teacher/kyc" className="shrink-0 text-sm font-bold bg-white/70 px-3 py-1.5 rounded-lg hover:bg-white transition">
          Complete KYC
        </Link>
      )}
    </div>
  );
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await teacherService.getDashboard();
        const payload = res?.data ?? res;
        setData(payload);
        // Availability comes from profile data
        if (payload?.isAvailableForNewClassrooms !== undefined) {
          setAvailable(payload.isAvailableForNewClassrooms);
        }
      } catch (err) {
        toast.error(err?.message || 'Could not load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      await teacherService.updateAvailability({ isAvailableForNewClassrooms: !available });
      setAvailable((prev) => !prev);
      toast.success(available ? 'Availability turned OFF — students cannot send new queries.' : 'Availability turned ON — students can discover you!');
    } catch (err) {
      toast.error(err?.message || 'Could not update availability');
    } finally {
      setTogglingAvail(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  const stats = data?.classroomStats || { total: 0, active: 0, completed: 0, totalStudents: 0 };
  const upcoming = data?.upcomingClasses || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy mb-1">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-muted">Here's your teaching activity at a glance.</p>
        </div>
        <Link to="/teacher/classrooms" className="hidden sm:flex items-center gap-2 bg-navy text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-navy-hover transition">
          <PlusCircle size={16} /> New classroom
        </Link>
      </div>

      <VerificationBanner status={data?.verificationStatus} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users2} iconBg="bg-sky/10" iconColor="text-sky" label="Active classrooms" value={stats.active} />
        <StatCard icon={Users} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" label="Total students" value={stats.totalStudents} />
        <StatCard icon={MessageSquare} iconBg="bg-amber/10" iconColor="text-amber" label="Pending queries" value={data?.pendingQueries ?? 0} />
        <StatCard icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" label="Wallet balance" value={formatCurrency(data?.walletRupees ?? 0)} />
      </div>

      {/* Availability Toggle */}
      <div className={`rounded-xl border p-4 mb-6 flex items-center justify-between gap-4 transition-all ${
        available ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            available ? 'bg-emerald-500/20' : 'bg-slate-300/30'
          }`}>
            {available
              ? <ToggleRight size={20} className="text-emerald-600" />
              : <ToggleLeft size={20} className="text-slate-500" />}
          </div>
          <div>
            <p className={`text-sm font-bold ${available ? 'text-emerald-800' : 'text-slate-600'}`}>
              {available ? 'You are available for new enrollments' : 'You are not accepting new students'}
            </p>
            <p className="text-[11px] font-semibold text-slate-500">
              {available
                ? 'Students can discover your profile and send enrollment queries.'
                : 'Your profile is hidden from new student searches.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleAvailability}
          disabled={togglingAvail}
          className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            available
              ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              : 'bg-navy text-white hover:bg-navy-hover'
          } disabled:opacity-50`}
        >
          {togglingAvail && <Loader2 size={12} className="animate-spin" />}
          {available ? 'Turn Off' : 'Turn On'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-brand shadow-brand p-6">
          <h2 className="font-sora font-bold text-navy flex items-center gap-2 mb-4"><CalendarClock size={18} /> Upcoming this week</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted text-center py-12">No classes scheduled in the next 7 days.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-sky/10 flex items-center justify-center shrink-0">
                    {s.gmeetLink ? <Video size={16} className="text-sky" /> : <MapPin size={16} className="text-sky" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/teacher/classrooms/${s.classroomId}`}>
                      <p className="text-sm font-bold text-navy truncate hover:text-sky transition-colors">{s.classroomTitle}</p>
                    </Link>
                    <p className="text-xs text-muted">{s.date} &middot; {s.startTime}</p>
                  </div>
                  {s.gmeetLink && (
                    <a href={s.gmeetLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-white bg-navy px-3 py-1.5 rounded-lg hover:bg-navy-hover transition shrink-0">Join</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-brand shadow-brand p-6">
            <h2 className="font-sora font-bold text-navy flex items-center gap-2 mb-4"><HelpCircle size={18} /> Needs attention</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Open doubts</span><span className="font-bold text-navy">{data?.pendingDoubts ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-muted">Extra class requests</span><span className="font-bold text-navy">{data?.pendingExtraClasses ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-muted">Pending queries</span><span className="font-bold text-navy">{data?.pendingQueries ?? 0}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-brand shadow-brand p-6">
            <h2 className="font-sora font-bold text-navy flex items-center gap-2 mb-4"><Wallet size={18} /> Wallet</h2>
            <p className="font-sora font-extrabold text-2xl text-navy mb-1">{formatCurrency(data?.walletRupees ?? 0)}</p>
            <Link to="/teacher/wallet" className="text-xs font-bold text-sky hover:underline">View wallet &amp; payouts &rarr;</Link>
          </div>

          <div className="bg-white rounded-brand shadow-brand p-6">
            <h2 className="font-sora font-bold text-navy flex items-center gap-2 mb-3"><Users size={18} /> Total classrooms</h2>
            <p className="font-sora font-extrabold text-2xl text-navy">{stats.total}</p>
            <p className="text-xs text-muted mt-1">{stats.completed} completed &middot; {stats.active} active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
