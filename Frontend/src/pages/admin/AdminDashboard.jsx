import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutGrid, ShieldCheck, FileWarning, Users, School,
  CheckCircle2, XCircle, Ban, Loader2,
} from 'lucide-react';
import adminService from '@/services/admin.service';
import StatCard from '@/components/shared/StatCard';
import Pagination from '@/components/shared/Pagination';
import Spinner from '@/components/shared/Spinner';
import Modal from '@/components/shared/Modal';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'teachers', label: 'Teacher KYC', icon: ShieldCheck },
  { key: 'reports', label: 'Reports', icon: FileWarning },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'classrooms', label: 'Classrooms', icon: School },
];

// ─── Reason prompt modal (used for reject/ban/dismiss/resolve actions) ───────
const ReasonModal = ({ open, title, onClose, onSubmit, submitLabel = 'Confirm', extraField }) => {
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setReason(''); setExtra(''); } }, [open]);

  const submit = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason'); return; }
    setBusy(true);
    try {
      await onSubmit(reason, extra);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={busy} className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50 flex items-center gap-2">
            {busy && <Loader2 size={14} className="animate-spin" />} {submitLabel}
          </button>
        </>
      }
    >
      {extraField && (
        <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={extraField}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-navy" />
      )}
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason / note *"
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
    </Modal>
  );
};

// ─── Overview tab ─────────────────────────────────────────────────────────────
const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminService.getPlatformStats();
        setStats(data?.data ?? data);
      } catch (err) {
        toast.error(err?.message || 'Could not load stats');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  const users = stats?.userStats || [];
  const classrooms = stats?.classroomStats || [];
  const payments = stats?.paymentStats || [];
  const totalUsers = users.reduce((s, u) => s + u.count, 0);
  const totalRevenue = payments.reduce((s, p) => s + (p.totalPaise || 0), 0) / 100;
  const openReports = stats?.openReportsCount ?? 0;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} iconBg="bg-navy/10" iconColor="text-navy" label="Total users" value={totalUsers} />
        <StatCard icon={School} iconBg="bg-sky/10" iconColor="text-sky" label="Total classrooms" value={classrooms.reduce((s, c) => s + c.count, 0)} />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" label="Captured revenue" value={formatCurrency(totalRevenue)} />
        <StatCard icon={FileWarning} iconBg="bg-error/10" iconColor="text-error" label="Open reports" value={openReports} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-brand shadow-brand p-6">
          <h2 className="font-sora font-bold text-navy mb-4">Users by role</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u._id} className="flex justify-between text-sm">
                <span className="text-muted capitalize">{u._id}</span>
                <span className="font-bold text-navy">{u.count} <span className="text-muted font-normal">({u.active} active)</span></span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-brand shadow-brand p-6">
          <h2 className="font-sora font-bold text-navy mb-4">Classrooms by status</h2>
          <div className="space-y-2">
            {classrooms.map((c) => (
              <div key={c._id} className="flex justify-between text-sm">
                <span className="text-muted capitalize">{humanizeEnum(c._id)}</span>
                <span className="font-bold text-navy">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Teacher KYC tab ──────────────────────────────────────────────────────────
const TeachersTab = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getPendingTeachers({ page, limit: 10 });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load pending teachers');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const approve = async (teacherId) => {
    try {
      await adminService.approveTeacher(teacherId);
      toast.success('Teacher approved');
      load();
    } catch (err) { toast.error(err?.message || 'Approval failed'); }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-muted text-center py-24">No pending teacher verifications. 🎉</p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((t) => (
              <div key={t._id} className="bg-white rounded-brand shadow-brand p-5 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-sora font-bold text-navy">{t.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted">{t.userId?.email} &middot; {t.userId?.phone}</p>
                  <p className="text-xs text-muted mt-1">{t.subjects?.join(', ')} &middot; {t.city}, {t.state}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Submitted {formatDate(t.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve(t.userId?._id || t.userId)} className="flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-emerald-600 transition">
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button onClick={() => setRejectTarget(t)} className="flex items-center gap-1.5 border-2 border-error text-error text-sm font-bold px-4 py-2 rounded-xl hover:bg-error/5 transition">
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ReasonModal
        open={!!rejectTarget}
        title={`Reject ${rejectTarget?.userId?.name || 'teacher'}`}
        onClose={() => setRejectTarget(null)}
        submitLabel="Reject"
        onSubmit={async (reason) => {
          await adminService.rejectTeacher(rejectTarget.userId?._id || rejectTarget.userId, { reason });
          toast.success('Teacher rejected');
          load();
        }}
      />
    </div>
  );
};

// ─── Reports tab ──────────────────────────────────────────────────────────────
const ReportsTab = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [dismissTarget, setDismissTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getOpenReports({ page, limit: 10 });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load reports');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-muted text-center py-24">No open reports. All clear.</p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r._id} className="bg-white rounded-brand shadow-brand p-5 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-sora font-bold text-navy">{humanizeEnum(r.reason)}</p>
                  <p className="text-sm text-muted mt-0.5 max-w-md">{r.description}</p>
                  <p className="text-xs text-muted mt-1">
                    {r.classroomId?.title} &middot; reported by {r.reportedBy?.name} against {r.teacherId?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{formatDate(r.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setResolveTarget(r)} className="flex items-center gap-1.5 bg-navy text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-navy-hover transition">
                    <CheckCircle2 size={14} /> Resolve
                  </button>
                  <button onClick={() => setDismissTarget(r)} className="flex items-center gap-1.5 border-2 border-slate-200 text-slate-500 text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-50 transition">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ReasonModal
        open={!!resolveTarget}
        title="Resolve report"
        extraField="Action taken (e.g. warned teacher, refunded student)"
        onClose={() => setResolveTarget(null)}
        submitLabel="Resolve"
        onSubmit={async (note, actionTaken) => {
          await adminService.resolveReport(resolveTarget._id, { actionTaken, note });
          toast.success('Report resolved');
          load();
        }}
      />
      <ReasonModal
        open={!!dismissTarget}
        title="Dismiss report"
        onClose={() => setDismissTarget(null)}
        submitLabel="Dismiss"
        onSubmit={async (note) => {
          await adminService.dismissReport(dismissTarget._id, { note });
          toast.success('Report dismissed');
          load();
        }}
      />
    </div>
  );
};

// ─── Users tab ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllUsers({ page, limit: 15, search: search || undefined });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load users');
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const unban = async (userId) => {
    try {
      await adminService.unbanUser(userId);
      toast.success('User unbanned');
      load();
    } catch (err) { toast.error(err?.message || 'Action failed'); }
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name..."
        className="w-full sm:w-72 rounded-xl border border-slate-200 px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-navy"
      />
      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="bg-white rounded-brand shadow-brand overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold text-muted uppercase">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error">Banned</span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.isBanned ? (
                        <button onClick={() => unban(u._id)} className="text-xs font-bold text-sky hover:underline">Unban</button>
                      ) : (
                        <button onClick={() => setBanTarget(u)} className="flex items-center gap-1 text-xs font-bold text-error hover:underline ml-auto">
                          <Ban size={12} /> Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ReasonModal
        open={!!banTarget}
        title={`Ban ${banTarget?.name || 'user'}`}
        onClose={() => setBanTarget(null)}
        submitLabel="Ban user"
        onSubmit={async (reason) => {
          await adminService.banUser(banTarget._id, { reason });
          toast.success('User banned');
          load();
        }}
      />
    </div>
  );
};

// ─── Classrooms tab ───────────────────────────────────────────────────────────
const ClassroomsTab = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllClassrooms({ page, limit: 15 });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load classrooms');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="bg-white rounded-brand shadow-brand overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold text-muted uppercase">
                <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Teacher</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c._id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{c.title}</p>
                      <p className="text-xs text-muted">{c.subject}</p>
                    </td>
                    <td className="px-4 py-3">{c.teacherId?.name || '—'}</td>
                    <td className="px-4 py-3 capitalize">{humanizeEnum(c.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status !== 'cancelled' && (
                        <button onClick={() => setCancelTarget(c)} className="text-xs font-bold text-error hover:underline">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ReasonModal
        open={!!cancelTarget}
        title={`Cancel "${cancelTarget?.title}"`}
        onClose={() => setCancelTarget(null)}
        submitLabel="Cancel classroom"
        onSubmit={async (reason) => {
          await adminService.cancelClassroom(cancelTarget._id, { reason });
          toast.success('Classroom cancelled');
          load();
        }}
      />
    </div>
  );
};

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');

  return (
    <div>
      <h1 className="font-sora text-2xl font-extrabold text-navy mb-6">Admin Control Center</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                tab === t.key ? 'bg-navy text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-navy'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'teachers' && <TeachersTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'classrooms' && <ClassroomsTab />}
    </div>
  );
};

export default AdminDashboard;
