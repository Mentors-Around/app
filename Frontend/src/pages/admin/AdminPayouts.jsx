import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle, PauseCircle, Search, Filter, ChevronRight } from 'lucide-react';
import payoutService from '@/services/payout.service';
import adminService from '@/services/admin.service';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';

const statusColors = {
  queued:     'bg-slate-100 text-slate-500',
  processing: 'bg-sky/10 text-sky',
  completed:  'bg-emerald-50 text-emerald-600',
  failed:     'bg-red-50 text-error',
  on_hold:    'bg-amber/10 text-amber-hover',
};

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const [holdModal, setHoldModal] = useState(null);
  const [holdReason, setHoldReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await payoutService.adminGetAll({ page, limit: 20, status: statusFilter || undefined });
      const payload = data?.data ?? data;
      setPayouts(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch {
      toast.error('Could not load payouts');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    document.title = 'Payout Management — TrueEd Admin';
    loadPayouts();
  }, [loadPayouts]);

  const handleHold = async () => {
    if (!holdReason.trim()) { toast.error('Provide a hold reason'); return; }
    setProcessing(true);
    try {
      await payoutService.adminHold(holdModal._id, { reason: holdReason });
      toast.success('Payout placed on hold.');
      setHoldModal(null);
      setHoldReason('');
      loadPayouts();
    } catch (err) {
      toast.error(err?.message || 'Could not hold payout');
    } finally {
      setProcessing(false);
    }
  };

  const handleRelease = async (payoutId) => {
    if (!window.confirm('Release this payout and process it now?')) return;
    try {
      await payoutService.adminRelease(payoutId);
      toast.success('Payout released for processing.');
      loadPayouts();
    } catch (err) {
      toast.error(err?.message || 'Could not release payout');
    }
  };

  return (
    <div className="font-inter pb-10">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">Payout Management</h1>
          <p className="text-sm text-muted mt-1">Hold or release teacher withdrawal payouts.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-navy bg-white"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : payouts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-brand-sm">
          <CreditCard className="mx-auto text-slate-300 mb-3" size={44} />
          <p className="text-sm font-bold text-navy">No payouts found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 shadow-brand-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payouts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy text-sm">{p.teacherId?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted">{p.teacherId?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-navy">{formatCurrency((p.amountPaise || 0) / 100)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[p.status] || 'bg-slate-100 text-slate-500'}`}>
                          {humanizeEnum(p.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted">{formatDate(p.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {p.status === 'queued' && (
                            <button
                              onClick={() => { setHoldModal(p); setHoldReason(''); }}
                              className="px-3 py-1.5 bg-amber/10 text-amber-hover text-xs font-bold rounded-lg hover:bg-amber/20 transition"
                            >
                              <PauseCircle size={12} className="inline mr-1" /> Hold
                            </button>
                          )}
                          {p.status === 'on_hold' && (
                            <button
                              onClick={() => handleRelease(p._id)}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition"
                            >
                              <CheckCircle size={12} className="inline mr-1" /> Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={!!holdModal}
        onClose={() => setHoldModal(null)}
        title="Place Payout On Hold"
        footer={
          <>
            <button onClick={() => setHoldModal(null)} className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleHold} disabled={processing} className="px-4 py-2.5 bg-amber text-white rounded-xl text-xs font-bold disabled:opacity-50">
              {processing ? 'Processing...' : 'Place on Hold'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Hold the payout of <strong>{formatCurrency((holdModal?.amountPaise || 0) / 100)}</strong> to{' '}
            <strong>{holdModal?.teacherId?.name}</strong>?
          </p>
          <textarea
            rows={3}
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            placeholder="Reason for holding (required)..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy resize-none"
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminPayouts;
