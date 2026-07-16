// src/pages/admin/AdminClassrooms.jsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Users, IndianRupee, Ban, Loader2, ChevronLeft, ChevronRight, MoreVertical,
} from 'lucide-react';
import adminService from '@/services/admin.service';
import { humanizeEnum, formatCurrency } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';
import Spinner from '@/components/shared/Spinner';
import Modal from '@/components/shared/Modal';

const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();
  const map = {
    active: 'bg-emerald-50 text-emerald-600',
    completed: 'bg-sky-50 text-sky-600',
    cancelled: 'bg-red-50 text-red-600',
    draft: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[s] || 'bg-slate-100 text-slate-500'}`}>
      {humanizeEnum(status)}
    </span>
  );
};

const CancelModal = ({ open, title, onClose, onSubmit }) => {
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
          <button onClick={submit} disabled={busy} className="px-4 py-2.5 rounded-xl bg-error text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-red-600">
            {busy && <Loader2 size={14} className="animate-spin" />} Cancel Classroom
          </button>
        </>
      }
    >
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for cancellation *"
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
    </Modal>
  );
};

const AdminClassrooms = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => { document.title = 'Classrooms — Admin'; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllClassrooms({ page, limit: 15, search: search || undefined });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? payload ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load classrooms');
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T';

  return (
    <div className="max-w-7xl mx-auto space-y-6" onClick={() => setOpenDropdown(null)}>
      <div>
        <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Classrooms</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Monitor and manage all classrooms on TrueEd.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search classrooms or teachers..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
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
                  <th className="p-4">Classroom</th>
                  <th className="p-4">Students</th>
                  <th className="p-4">Fee</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(room => {
                  const teacherName = room.teacherId?.name || '—';
                  const priceRupees = (room.feePaise || room.fee || 0) / 100;

                  return (
                    <tr key={room._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {initials(teacherName)}
                          </div>
                          <span className="font-bold text-navy text-sm">{teacherName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700 text-sm">{room.title}</p>
                        <p className="text-xs text-slate-400">{room.subject}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                          <Users className="w-4 h-4 text-sky-500" />
                          {room.enrolledStudents?.length ?? room.totalStudents ?? 0}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-navy font-bold text-sm">
                          <IndianRupee className="w-4 h-4 text-emerald-600" />
                          {priceRupees > 0 ? priceRupees : (room.fee || '—')}
                        </div>
                      </td>
                      <td className="p-4"><StatusBadge status={room.status} /></td>
                      <td className="p-4 text-right relative" onClick={e => e.stopPropagation()}>
                        {room.status !== 'cancelled' && (
                          <>
                            <button onClick={() => setOpenDropdown(openDropdown === room._id ? null : room._id)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-navy">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {openDropdown === room._id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                                <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                                  <button onClick={() => { setCancelTarget(room); setOpenDropdown(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <Ban className="w-4 h-4" /> Cancel Classroom
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && <div className="p-8 text-center text-slate-500 font-medium">No classrooms found.</div>}
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

      <CancelModal
        open={!!cancelTarget}
        title={`Cancel "${cancelTarget?.title}"`}
        onClose={() => setCancelTarget(null)}
        onSubmit={async (reason) => {
          await adminService.cancelClassroom(cancelTarget._id, { reason });
          toast.success('Classroom cancelled');
          load();
        }}
      />
    </div>
  );
};

export default AdminClassrooms;
