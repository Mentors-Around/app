// src/pages/admin/AdminWallet.jsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, IndianRupee, CheckCircle, XCircle, ArrowUpRight,
  ArrowDownLeft, Clock, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import payoutService from '@/services/payout.service';
import walletService from '@/services/wallet.service';
import { formatCurrency } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';
import Spinner from '@/components/shared/Spinner';
import Modal from '@/components/shared/Modal';

const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase"><Clock className="w-3 h-3" /> Pending</span>;
  if (s === 'released' || s === 'completed' || s === 'approved') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3" /> Released</span>;
  if (s === 'held' || s === 'on_hold') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase"><XCircle className="w-3 h-3" /> On Hold</span>;
  return <span className="text-xs text-slate-500 capitalize">{s}</span>;
};

const HoldModal = ({ open, onClose, onSubmit }) => {
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
    <Modal isOpen={open} onClose={onClose} title="Put payout on hold"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={busy} className="px-4 py-2.5 rounded-xl bg-error text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-red-600">
            {busy && <Loader2 size={14} className="animate-spin" />} Hold
          </button>
        </>
      }
    >
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for hold *"
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
    </Modal>
  );
};

// Withdrawals / payouts tab
const WithdrawalsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [holdTarget, setHoldTarget] = useState(null);
  const [releaseBusy, setReleaseBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await payoutService.adminGetAll({ page, limit: 15 });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? payload ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load payouts');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const release = async (id) => {
    setReleaseBusy(id);
    try {
      await payoutService.adminRelease(id);
      toast.success('Payout released');
      load();
    } catch (err) { toast.error(err?.message || 'Release failed'); }
    finally { setReleaseBusy(null); }
  };

  const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T';

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-4">Teacher</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Requested On</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(req => {
              const name = req.teacherId?.name || req.userId?.name || 'Unknown';
              const amountRupees = (req.amountPaise || req.amount || 0) / 100;
              const isReleaseLoading = releaseBusy === req._id;
              return (
                <tr key={req._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {initials(name)}
                      </div>
                      <span className="font-bold text-navy text-sm">{name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-navy font-bold">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      {amountRupees > 0 ? formatCurrency(amountRupees) : `₹${amountRupees}`}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-600">{formatDate(req.createdAt)}</td>
                  <td className="p-4"><StatusBadge status={req.status} /></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => setHoldTarget(req)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition">Hold</button>
                          <button onClick={() => release(req._id)} disabled={isReleaseLoading}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 disabled:opacity-50">
                            {isReleaseLoading && <Loader2 size={11} className="animate-spin" />}
                            Release
                          </button>
                        </>
                      )}
                      {req.status === 'held' || req.status === 'on_hold' ? (
                        <button onClick={() => release(req._id)} disabled={isReleaseLoading}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 disabled:opacity-50">
                          {isReleaseLoading && <Loader2 size={11} className="animate-spin" />}
                          Release
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-8 text-center text-slate-500 font-medium">No payout requests found.</div>}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-100">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"><ChevronRight size={16} /></button>
        </div>
      )}
      <HoldModal open={!!holdTarget} onClose={() => setHoldTarget(null)} onSubmit={async (reason) => {
        await payoutService.adminHold(holdTarget._id, { reason });
        toast.success('Payout held'); load();
      }} />
    </>
  );
};

// Transactions tab
const TransactionsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Use general wallet transactions endpoint (admin context)
      const { data } = await walletService.getTransactions({ page, limit: 20 });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? payload ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      // Graceful degradation — endpoint may be student-only
      setItems([]);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(tx => {
    if (!search) return true;
    const s = search.toLowerCase();
    return tx.description?.toLowerCase().includes(s) || tx.type?.toLowerCase().includes(s);
  });

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <>
      <div className="p-4 border-b border-slate-100">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search transactions..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-4">Type</th>
              <th className="p-4">Description</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tx => {
              const amountRupees = (tx.amountPaise || tx.amount || 0) / 100;
              const isCredit = tx.type === 'credit' || amountRupees > 0;
              return (
                <tr key={tx._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">{tx.type}</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-600">{tx.description || '—'}</td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1 font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      <IndianRupee className="w-3.5 h-3.5" />
                      {Math.abs(amountRupees)}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-600">{formatDate(tx.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500 font-medium">No transactions found.</div>}
      </div>
    </>
  );
};

const TABS = ['withdrawals', 'transactions'];

const AdminWallet = () => {
  const [activeTab, setActiveTab] = useState('withdrawals');

  useEffect(() => { document.title = 'Wallet & Payments — Admin'; }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Wallet & Payments</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Manage platform finances, withdrawals, and transactions.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto inline-flex">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-2 text-xs font-bold rounded-md transition capitalize ${activeTab === tab ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'withdrawals' && <WithdrawalsTab />}
        {activeTab === 'transactions' && <TransactionsTab />}
      </div>
    </div>
  );
};

export default AdminWallet;
