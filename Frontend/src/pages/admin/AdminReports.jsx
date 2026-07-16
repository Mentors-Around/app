// src/pages/admin/AdminReports.jsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, MoreVertical, CheckCircle, AlertTriangle,
  XCircle, ShieldAlert, Ban, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import adminService from '@/services/admin.service';
import { humanizeEnum } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';
import Spinner from '@/components/shared/Spinner';
import Modal from '@/components/shared/Modal';

const ReasonModal = ({ open, title, extraField, onClose, onSubmit, submitLabel = 'Confirm', submitClass = 'bg-navy hover:bg-navy-hover' }) => {
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setReason(''); setExtra(''); } }, [open]);
  const submit = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason/note'); return; }
    setBusy(true);
    try { await onSubmit(reason, extra); onClose(); }
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
      {extraField && (
        <input value={extra} onChange={e => setExtra(e.target.value)} placeholder={extraField}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-navy" />
      )}
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Note / reason *"
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
    </Modal>
  );
};

const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();
  if (s === 'open') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase"><AlertTriangle className="w-3 h-3" /> Open</span>;
  if (s === 'resolved') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3" /> Resolved</span>;
  if (s === 'dismissed') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase"><XCircle className="w-3 h-3" /> Dismissed</span>;
  return <span className="text-xs text-slate-500 capitalize">{s}</span>;
};

const AdminReports = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [dismissTarget, setDismissTarget] = useState(null);

  useEffect(() => { document.title = 'Reports — Admin'; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter !== 'ALL') params.status = filter.toLowerCase();
      const { data } = await adminService.getOpenReports(params);
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? payload ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load reports');
    } finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.reportedBy?.name?.toLowerCase().includes(s) ||
      r.teacherId?.name?.toLowerCase().includes(s) ||
      r.reason?.toLowerCase().includes(s)
    );
  });

  const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="max-w-7xl mx-auto space-y-6" onClick={() => setOpenDropdown(null)}>
      <div>
        <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Reports</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Review and resolve reports submitted by users.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by user or reason..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            {['ALL', 'OPEN', 'RESOLVED', 'DISMISSED'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition ${filter === f ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Reported By</th>
                  <th className="p-4">Against</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(report => (
                  <tr key={report._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {initials(report.reportedBy?.name)}
                        </div>
                        <div>
                          <p className="font-bold text-navy text-sm">{report.reportedBy?.name || '—'}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">student</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {initials(report.teacherId?.name)}
                        </div>
                        <div>
                          <p className="font-bold text-navy text-sm">{report.teacherId?.name || '—'}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">teacher</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-navy text-sm">{humanizeEnum(report.reason)}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]" title={report.description}>{report.description}</p>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-600">{formatDate(report.createdAt)}</td>
                    <td className="p-4"><StatusBadge status={report.status} /></td>
                    <td className="p-4 text-right relative" onClick={e => e.stopPropagation()}>
                      {report.status === 'open' ? (
                        <>
                          <button onClick={() => setOpenDropdown(openDropdown === report._id ? null : report._id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-navy">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdown === report._id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                              <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                                <button onClick={() => { setResolveTarget(report); setOpenDropdown(null); }}
                                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" /> Resolve Report
                                </button>
                                <button onClick={() => { setDismissTarget(report); setOpenDropdown(null); }}
                                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-2">
                                  <XCircle className="w-4 h-4" /> Dismiss
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-medium">No reports found.</div>
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

      <ReasonModal open={!!resolveTarget} title="Resolve report"
        extraField="Action taken (e.g. warned teacher, refunded student)"
        onClose={() => setResolveTarget(null)} submitLabel="Resolve"
        onSubmit={async (note, actionTaken) => {
          await adminService.resolveReport(resolveTarget._id, { actionTaken, note });
          toast.success('Report resolved'); load();
        }}
      />
      <ReasonModal open={!!dismissTarget} title="Dismiss report"
        onClose={() => setDismissTarget(null)} submitLabel="Dismiss"
        submitClass="bg-slate-600 hover:bg-slate-700"
        onSubmit={async (note) => {
          await adminService.dismissReport(dismissTarget._id, { note });
          toast.success('Report dismissed'); load();
        }}
      />
    </div>
  );
};

export default AdminReports;
