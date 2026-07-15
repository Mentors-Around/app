import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Loader2, TrendingUp } from 'lucide-react';
import teacherService from '@/services/teacher.service';
import payoutService from '@/services/payout.service';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/shared/StatCard';
import Modal from '@/components/shared/Modal';
import Pagination from '@/components/shared/Pagination';
import Spinner from '@/components/shared/Spinner';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';
import { formatDateTime } from '@/utils/date.util';
import openRazorpayCheckout from '@/utils/razorpay.util';

const payoutStatusPill = {
  queued: 'bg-slate-100 text-slate-500',
  processing: 'bg-sky/10 text-sky',
  completed: 'bg-emerald-500/10 text-emerald-600',
  failed: 'bg-error/10 text-error',
  on_hold: 'bg-amber/10 text-amber-hover',
};

const TeacherWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, payoutsRes] = await Promise.all([
        teacherService.getWallet(),
        payoutService.getMyPayouts({ page, limit: 15 }),
      ]);
      setWallet(walletRes.data?.data ?? walletRes.data);
      const payload = payoutsRes.data?.data ?? payoutsRes.data;
      setPayouts(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load wallet');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const submitDeposit = async () => {
    const rupees = Number(depositAmount);
    if (!rupees || rupees < 1) { toast.error('Enter a valid amount'); return; }
    setDepositing(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const { data } = await teacherService.initiateDeposit({ amountPaise: Math.round(rupees * 100) }, idempotencyKey);
      const { razorpayOrder } = data?.data ?? data;

      const payment = await openRazorpayCheckout({
        order: razorpayOrder,
        description: 'Teacher wallet deposit',
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      });

      await teacherService.verifyDeposit({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });

      toast.success('Deposit successful!');
      setDepositOpen(false);
      setDepositAmount('');
      loadAll();
    } catch (err) {
      toast.error(err?.message || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  const submitWithdrawal = async () => {
    const rupees = Number(withdrawAmount);
    if (!rupees || rupees < 1) { toast.error('Enter a valid amount'); return; }
    setWithdrawing(true);
    try {
      await payoutService.requestWithdrawal({ amountPaise: Math.round(rupees * 100) });
      toast.success('Withdrawal requested.');
      setWithdrawOpen(false);
      setWithdrawAmount('');
      loadAll();
    } catch (err) {
      toast.error(err?.message || 'Withdrawal request failed. Add your bank account in KYC first.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading && !wallet) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="font-sora text-2xl font-extrabold text-navy mb-6">Wallet &amp; Payouts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={WalletIcon} iconBg="bg-navy/10" iconColor="text-navy" label="Wallet balance" value={formatCurrency(wallet?.walletRupees ?? 0)} />
        <StatCard icon={TrendingUp} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" label="Total earnings" value={formatCurrency((wallet?.totalEarningsPaise || 0) / 100)} />
        <StatCard icon={ArrowUpFromLine} iconBg="bg-amber/10" iconColor="text-amber" label="Withdrawn" value={formatCurrency((wallet?.withdrawnPaise || 0) / 100)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-brand shadow-brand p-5">
          <ArrowDownToLine className="text-sky mb-3" size={22} />
          <p className="font-sora font-bold text-navy mb-1">Deposit to wallet</p>
          <p className="text-xs text-muted mb-4">Add funds (e.g. to cover teacher deposit requirements).</p>
          <button onClick={() => setDepositOpen(true)} className="w-full bg-sky text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition">
            Deposit
          </button>
        </div>
        <div className="bg-white rounded-brand shadow-brand p-5">
          <ArrowUpFromLine className="text-coral mb-3" size={22} />
          <p className="font-sora font-bold text-navy mb-1">Withdraw earnings</p>
          <p className="text-xs text-muted mb-4">Move your wallet balance to your linked bank account.</p>
          <button onClick={() => setWithdrawOpen(true)} className="w-full border-2 border-coral text-coral text-sm font-bold py-2.5 rounded-xl hover:bg-coral/5 transition">
            Withdraw
          </button>
        </div>
      </div>

      <div className="bg-white rounded-brand shadow-brand p-6">
        <h2 className="font-sora font-bold text-navy flex items-center gap-2 mb-4"><WalletIcon size={18} /> Payout history</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">No payouts yet.</p>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {payouts.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{p.classroomId?.title || 'Withdrawal'}</p>
                    <p className="text-xs text-muted">{formatDateTime(p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-navy">{formatCurrency((p.amountPaise || 0) / 100)}</p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${payoutStatusPill[p.status] || 'bg-slate-100 text-slate-500'}`}>
                      {humanizeEnum(p.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        title="Deposit to wallet"
        footer={
          <>
            <button onClick={() => setDepositOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={submitDeposit} disabled={depositing} className="px-4 py-2.5 rounded-xl bg-sky text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {depositing && <Loader2 size={14} className="animate-spin" />} Proceed to pay
            </button>
          </>
        }
      >
        <label className="block text-sm font-semibold text-navy mb-2">Amount (₹)</label>
        <input type="number" min="1" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
      </Modal>

      <Modal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Withdraw earnings"
        footer={
          <>
            <button onClick={() => setWithdrawOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={submitWithdrawal} disabled={withdrawing} className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50">
              {withdrawing ? 'Requesting...' : 'Request withdrawal'}
            </button>
          </>
        }
      >
        <label className="block text-sm font-semibold text-navy mb-2">Amount (₹)</label>
        <input type="number" min="1" max={wallet?.walletRupees} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder={`Up to ${formatCurrency(wallet?.walletRupees ?? 0)}`}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
        <p className="text-xs text-muted mt-2">Requires a verified bank account (add one in KYC).</p>
      </Modal>
    </div>
  );
};

export default TeacherWallet;
