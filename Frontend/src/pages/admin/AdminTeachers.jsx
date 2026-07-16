// src/pages/admin/AdminTeachers.jsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, CheckCircle2, XCircle, AlertCircle, ShieldAlert,
  Ban, CheckCircle, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import adminService from '@/services/admin.service';
import Spinner from '@/components/shared/Spinner';
import Modal from '@/components/shared/Modal';

const KYCBadge = ({ status }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-700',
    under_review: 'bg-sky-50 text-sky-700',
  };
  const icons = {
    approved: <CheckCircle2 className="w-3 h-3" />,
    pending: <ShieldAlert className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
    under_review: <AlertCircle className="w-3 h-3" />,
  };
  const key = (status || 'pending').toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${map[key] || 'bg-slate-100 text-slate-500'}`}>
      {icons[key] || <AlertCircle className="w-3 h-3" />} {key.replace('_', ' ')}
    </span>
  );
};

const ReasonModal = ({ open, title, onClose, onSubmit, submitLabel = 'Confirm', submitClass = 'bg-navy hover:bg-navy-hover' }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setReason(''); }, [open]);
  const submit = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason'); return; }
    setBusy(true);
    try { await onSubmit(reason); onClose(); }
    catch (err) { toast.error(err?.message || 'Action failed'); }
    finally { setBusy(false); }
  };
  return (
    <Modal isOpen={open} onClose={onClose} title={title}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={busy} className={`px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2 ${submitClass}`}>
            {busy && <Loader2 size={14} className="animate-spin" />} {submitLabel}
          </button>
        </>
      }
    >
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason / note *"
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
    </Modal>
  );
};

const AdminTeachers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  useEffect(() => { document.title = 'Teachers — Admin'; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllTeachers({ page, limit: 15, search: search || undefined });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? payload ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load teachers');
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const approve = async (teacherId) => {
    try {
      await adminService.approveTeacher(teacherId);
      toast.success('Teacher approved');
      load();
    } catch (err) { toast.error(err?.message || 'Approval failed'); }
  };

  const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Teachers</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Manage all registered teachers on TrueEd.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Teacher</th>
                  <th className="p-4">KYC Status</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(t => {
                  const userId = t._id || t.userId?._id || t.userId;
                  const name = t.name || t.userId?.name || 'Unknown';
                  const email = t.email || t.userId?.email || '';
                  const kycStatus = t.kycStatus || t.verificationStatus || 'pending';
                  const isBanned = t.isBanned || false;

                  return (
                    <tr key={userId} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {initials(name)}
                          </div>
                          <div>
                            <p className="font-bold text-navy text-sm">{name}</p>
                            <p className="text-xs font-medium text-slate-500">{email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><KYCBadge status={kycStatus} /></td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isBanned ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(kycStatus === 'pending' || kycStatus === 'under_review') && (
                            <button onClick={() => approve(userId)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          {(kycStatus === 'pending' || kycStatus === 'under_review') && (
                            <button onClick={() => setRejectTarget({ id: userId, name })} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition">
                              Reject
                            </button>
                          )}
                          {!isBanned ? (
                            <button onClick={() => setSuspendTarget({ id: userId, name })} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition flex items-center gap-1">
                              <Ban className="w-3.5 h-3.5" /> Suspend
                            </button>
                          ) : (
                            <button onClick={async () => {
                              try { await adminService.unbanUser(userId); toast.success('Teacher unbanned'); load(); }
                              catch (err) { toast.error(err?.message || 'Action failed'); }
                            }} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition">
                              Unban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-medium">No teachers found.</div>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <ReasonModal open={!!rejectTarget} title={`Reject KYC: ${rejectTarget?.name}`}
        onClose={() => setRejectTarget(null)} submitLabel="Reject"
        submitClass="bg-error hover:bg-red-600"
        onSubmit={async (reason) => {
          await adminService.rejectTeacher(rejectTarget.id, { reason });
          toast.success('Teacher KYC rejected'); load();
        }}
      />
      <ReasonModal open={!!suspendTarget} title={`Suspend: ${suspendTarget?.name}`}
        onClose={() => setSuspendTarget(null)} submitLabel="Suspend"
        submitClass="bg-error hover:bg-red-600"
        onSubmit={async (reason) => {
          await adminService.suspendTeacher(suspendTarget.id, { reason });
          toast.success('Teacher suspended'); load();
        }}
      />
    </div>
  );
};

export default AdminTeachers;
