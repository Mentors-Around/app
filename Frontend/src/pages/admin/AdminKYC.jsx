// src/pages/admin/AdminKYC.jsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Eye, CheckCircle, XCircle, AlertCircle, FileText,
  Calendar, Loader2, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import adminService from '@/services/admin.service';
import Spinner from '@/components/shared/Spinner';
import { formatDate } from '@/utils/date.util';

const StatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  const map = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-700',
    under_review: 'bg-sky-50 text-sky-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${map[s] || 'bg-slate-100 text-slate-500'}`}>
      {s === 'approved' && <CheckCircle className="w-3 h-3" />}
      {s === 'pending' && <AlertCircle className="w-3 h-3" />}
      {s === 'rejected' && <XCircle className="w-3 h-3" />}
      {s === 'under_review' && <Eye className="w-3 h-3" />}
      {s.replace('_', ' ')}
    </span>
  );
};

const DocCard = ({ label }) => (
  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
    <div className="flex items-center gap-2 mb-2 text-slate-500">
      <FileText className="w-4 h-4" />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-semibold text-navy">Document submitted</p>
    <p className="mt-2 text-xs font-bold text-sky hover:underline cursor-pointer">View Document</p>
  </div>
);

const AdminKYC = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => { document.title = 'KYC Verification — Admin'; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getPendingTeachers({ page, limit: 15 });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? payload ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load KYC requests');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filteredItems = items.filter(t => {
    const name = t.userId?.name || t.name || '';
    const email = t.userId?.email || t.email || '';
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  const handleApprove = async (teacherId) => {
    setActionBusy(true);
    try {
      await adminService.approveTeacher(teacherId);
      toast.success('KYC approved!');
      setSelected(null);
      load();
    } catch (err) { toast.error(err?.message || 'Approval failed'); }
    finally { setActionBusy(false); }
  };

  const handleReject = async (teacherId) => {
    if (!rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
    setActionBusy(true);
    try {
      await adminService.rejectTeacher(teacherId, { reason: rejectReason });
      toast.success('KYC rejected');
      setSelected(null);
      setRejectReason('');
      load();
    } catch (err) { toast.error(err?.message || 'Rejection failed'); }
    finally { setActionBusy(false); }
  };

  const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">KYC Verification</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Review and approve teacher identity verification requests.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search teachers..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Teacher</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(req => {
                  const name = req.userId?.name || req.name || 'Unknown';
                  const email = req.userId?.email || req.email || '';
                  const kycStatus = req.verificationStatus || 'pending';
                  const teacherId = req.userId?._id || req.userId || req._id;

                  return (
                    <tr key={req._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
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
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(req.createdAt)}
                        </div>
                      </td>
                      <td className="p-4"><StatusBadge status={kycStatus} /></td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => { setSelected({ ...req, teacherId, name, email, kycStatus }); setRejectReason(''); }}
                          className="px-4 py-2 bg-slate-50 border border-slate-200 text-navy text-xs font-bold rounded-lg hover:bg-slate-100 transition shadow-sm inline-flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-medium">
                {items.length === 0 ? 'No pending KYC requests. 🎉' : 'No results found.'}
              </div>
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

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[7000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="font-sora text-xl font-bold text-navy">Review KYC: {selected.name}</h2>
                <p className="text-sm font-medium text-slate-500">Submitted {formatDate(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-navy transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <DocCard label="Aadhaar Card" />
                <DocCard label="PAN Card" />
                <DocCard label="Bank Details" />
                <DocCard label="Educational Docs" />
              </div>

              {selected.subjects && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subjects</p>
                  <p className="text-sm font-semibold text-navy">{selected.subjects.join(', ')}</p>
                </div>
              )}

              {selected.kycStatus === 'rejected' && selected.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-sm font-medium text-red-900">{selected.rejectionReason}</p>
                </div>
              )}

              {(selected.kycStatus === 'pending' || selected.kycStatus === 'under_review') && (
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-navy mb-2">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="E.g. Aadhaar card image is blurry and unreadable..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-red-400 transition min-h-[100px]"
                  />
                </div>
              )}
            </div>

            {(selected.kycStatus === 'pending' || selected.kycStatus === 'under_review') && (
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  onClick={() => handleReject(selected.teacherId)}
                  disabled={actionBusy}
                  className="px-6 py-2.5 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {actionBusy && <Loader2 size={14} className="animate-spin" />}
                  Reject & Request Resubmission
                </button>
                <button
                  onClick={() => handleApprove(selected.teacherId)}
                  disabled={actionBusy}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {actionBusy && <Loader2 size={14} className="animate-spin" />}
                  <CheckCircle className="w-4 h-4" /> Approve KYC
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYC;
