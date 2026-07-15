import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Ticket, Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Loader2, TrendingUp } from 'lucide-react';
import walletService from '@/services/wallet.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import StatCard from '@/components/shared/StatCard';
import Modal from '@/components/shared/Modal';
import Pagination from '@/components/shared/Pagination';
import Spinner from '@/components/shared/Spinner';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';
import { formatDateTime } from '@/utils/date.util';
import openRazorpayCheckout from '@/utils/razorpay.util';

const TOKEN_PRICE_RUPEES = 19;
const TOKENS_PER_PURCHASE = 3;

const StudentWallet = () => {
  const { user } = useAuth();
  const { wallet, refreshWallet } = useWallet();

  const [txns, setTxns] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [buyingTokens, setBuyingTokens] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const loadTxns = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await walletService.getTransactions({ page, limit: 15 });
      const payload = data?.data ?? data;
      setTxns(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load transactions');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadTxns(); }, [loadTxns]);

  const buyTokens = async () => {
    setBuyingTokens(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const { data } = await walletService.createTokenCheckout({}, idempotencyKey);
      const { razorpayOrder } = data?.data ?? data;

      const payment = await openRazorpayCheckout({
        order: razorpayOrder,
        description: `${TOKENS_PER_PURCHASE} query tokens`,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      });

      await walletService.verifyTokenPurchase({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });

      toast.success(`${TOKENS_PER_PURCHASE} tokens added to your wallet!`);
      refreshWallet();
      loadTxns();
    } catch (err) {
      toast.error(err?.message || 'Token purchase failed');
    } finally {
      setBuyingTokens(false);
    }
  };

  const submitDeposit = async () => {
    const rupees = Number(depositAmount);
    if (!rupees || rupees < 1) { toast.error('Enter a valid amount'); return; }
    setDepositing(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const { data } = await walletService.createDepositCheckout({ amountPaise: Math.round(rupees * 100) }, idempotencyKey);
      const { razorpayOrder } = data?.data ?? data;

      const payment = await openRazorpayCheckout({
        order: razorpayOrder,
        description: 'Wallet cash deposit',
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      });

      await walletService.verifyDeposit({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });

      toast.success('Deposit successful!');
      setDepositOpen(false);
      setDepositAmount('');
      refreshWallet();
      loadTxns();
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
      await walletService.requestWithdrawal({ amountPaise: Math.round(rupees * 100) });
      toast.success('Withdrawal requested. This may take a few business days.');
      setWithdrawOpen(false);
      setWithdrawAmount('');
      refreshWallet();
    } catch (err) {
      toast.error(err?.message || 'Withdrawal request failed');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div>
      <h1 className="font-sora text-2xl font-extrabold text-navy mb-6">Wallet &amp; Payments</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Ticket} iconBg="bg-amber/10" iconColor="text-amber" label="Query tokens" value={wallet?.tokenBalance ?? 0} />
        <StatCard icon={WalletIcon} iconBg="bg-navy/10" iconColor="text-navy" label="Cash balance" value={formatCurrency((wallet?.cashBalancePaise || 0) / 100)} />
        <StatCard icon={TrendingUp} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" label="Tokens purchased" value={wallet?.totalTokensPurchased ?? 0} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-brand shadow-brand p-5">
          <Ticket className="text-amber mb-3" size={22} />
          <p className="font-sora font-bold text-navy mb-1">Buy query tokens</p>
          <p className="text-xs text-muted mb-4">{TOKENS_PER_PURCHASE} tokens for {formatCurrency(TOKEN_PRICE_RUPEES)}</p>
          <button onClick={buyTokens} disabled={buyingTokens} className="w-full bg-navy text-white text-sm font-bold py-2.5 rounded-xl hover:bg-navy-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
            {buyingTokens && <Loader2 size={14} className="animate-spin" />} Buy now
          </button>
        </div>

        <div className="bg-white rounded-brand shadow-brand p-5">
          <ArrowDownToLine className="text-sky mb-3" size={22} />
          <p className="font-sora font-bold text-navy mb-1">Deposit cash</p>
          <p className="text-xs text-muted mb-4">Add money to pay for classroom fees directly.</p>
          <button onClick={() => setDepositOpen(true)} className="w-full bg-sky text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition">
            Deposit
          </button>
        </div>

        <div className="bg-white rounded-brand shadow-brand p-5">
          <ArrowUpFromLine className="text-coral mb-3" size={22} />
          <p className="font-sora font-bold text-navy mb-1">Withdraw to bank</p>
          <p className="text-xs text-muted mb-4">Move your cash balance back to your bank account.</p>
          <button onClick={() => setWithdrawOpen(true)} className="w-full border-2 border-coral text-coral text-sm font-bold py-2.5 rounded-xl hover:bg-coral/5 transition">
            Withdraw
          </button>
        </div>
      </div>

      <div className="bg-white rounded-brand shadow-brand p-6">
        <h2 className="font-sora font-bold text-navy flex items-center gap-2 mb-4"><WalletIcon size={18} /> Transaction history</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : txns.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">No transactions yet.</p>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {txns.map((t) => (
                <div key={t._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{humanizeEnum(t.type)}</p>
                    <p className="text-xs text-muted">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-bold ${['purchased', 'bonus', 'refunded'].includes(t.type) ? 'text-emerald-500' : 'text-coral'}`}>
                    {['purchased', 'bonus', 'refunded'].includes(t.type) ? '+' : '-'}{Math.abs(t.amount ?? t.tokens ?? 0)}
                  </span>
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
        title="Deposit cash"
        footer={
          <>
            <button onClick={() => setDepositOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={submitDeposit} disabled={depositing} className="px-4 py-2.5 rounded-xl bg-sky text-white text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {depositing ? 'Processing...' : 'Proceed to pay'}
            </button>
          </>
        }
      >
        <label className="block text-sm font-semibold text-navy mb-2">Amount (₹)</label>
        <input
          type="number" min="1" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="e.g. 500"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy"
        />
      </Modal>

      <Modal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Withdraw to bank"
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
        <input
          type="number" min="1" max={(wallet?.cashBalancePaise || 0) / 100} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder={`Up to ${formatCurrency((wallet?.cashBalancePaise || 0) / 100)}`}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy"
        />
      </Modal>
    </div>
  );
};

export default StudentWallet;
