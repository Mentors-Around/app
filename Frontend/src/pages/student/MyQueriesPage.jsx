import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessagesSquare, CheckCircle, Clock, XCircle, ChevronRight, AlertCircle, RefreshCw, Star, MessageSquare, CreditCard, Wallet, BookOpen } from 'lucide-react';
import enrollmentService from '@/services/enrollment.service';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import QueryTimeline from '@/components/shared/QueryTimeline';
import QueryProgressTracker from '@/components/shared/QueryProgressTracker';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import { formatCurrency, humanizeEnum } from '@/utils/format.util';
import { formatDate, getCountdown } from '@/utils/date.util';
import openRazorpayCheckout from '@/utils/razorpay.util';

const TAB_MAPPING = [
  { id: 'active', label: 'Active Queries' },
  { id: 'accepted', label: 'Approved (Waiting Payment)' },
  { id: 'enrolled', label: 'Enrolled' },
  { id: 'rejected', label: 'Declined' },
  { id: 'expired', label: 'Payment Lapsed' },
];

const MyQueriesPage = () => {
  const { user } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const navigate = useNavigate();

  const [queries, setQueries] = useState([]);
  const [tab, setTab] = useState('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tabCounts, setTabCounts] = useState({});

  // Payment states
  const [paymentModalTarget, setPaymentModalTarget] = useState(null);
  const [paying, setPaying] = useState(false);
  const [walletPassword, setWalletPassword] = useState('');
  const [showWalletPassword, setShowWalletPassword] = useState(false);

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await enrollmentService.getMyQueries({
        tab,
        page,
        limit: 10,
      });
      const payload = data?.data ?? data;
      setQueries(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
      setTabCounts(payload?.tabCounts ?? {});
    } catch (err) {
      toast.error(err?.message || 'Could not load queries');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(1);
  };

  const handleEnrollWallet = async (e) => {
    if (e) e.preventDefault();
    if (!paymentModalTarget) return;

    if (!walletPassword) {
      toast.error('Please enter your account password to authorize wallet cash payment.');
      return;
    }

    const feesPaise = paymentModalTarget.classroomId?.feesPaise || 0;
    if ((wallet?.cashBalancePaise ?? 0) < feesPaise) {
      toast.error('Insufficient wallet balance. Please top up first or use gateway payment.');
      return;
    }

    setPaying(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await enrollmentService.enroll(
        paymentModalTarget._id,
        { useWalletCash: true, password: walletPassword },
        idempotencyKey
      );
      toast.success('Successfully enrolled! Payment receipt sent to your email.');
      setPaymentModalTarget(null);
      setWalletPassword('');
      refreshWallet();
      loadQueries();
    } catch (err) {
      toast.error(err?.message || 'Enrollment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleEnrollGateway = async () => {
    if (!paymentModalTarget) return;
    setPaying(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const { data } = await enrollmentService.enroll(
        paymentModalTarget._id,
        { useWalletCash: false },
        idempotencyKey
      );
      const payload = data?.data ?? data;
      const { razorpayOrder } = payload;

      const payment = await openRazorpayCheckout({
        order: razorpayOrder,
        description: `Enrollment - ${paymentModalTarget.classroomId?.title}`,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      });

      await enrollmentService.verifyEnrollPayment(paymentModalTarget._id, {
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });

      toast.success('Successfully enrolled in classroom!');
      setPaymentModalTarget(null);
      refreshWallet();
      loadQueries();
    } catch (err) {
      toast.error(err?.message || 'Gateway payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">My Classroom Queries</h1>
          <p className="text-sm text-muted mt-1">Track pending applications and complete enrollment payments.</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2">
          <Wallet size={16} className="text-navy" />
          <span className="text-xs font-semibold text-slate-600">Wallet Cash:</span>
          <span className="text-sm font-bold text-navy">
            {formatCurrency((wallet?.cashBalancePaise || 0) / 100)}
          </span>
        </div>
      </div>

      {/* Tabs with badge counts */}
      <div className="flex gap-2 mb-6 border-b border-slate-100 pb-3 overflow-x-auto hide-scrollbar">
        {TAB_MAPPING.map((t) => {
          const count = tabCounts[t.id] ?? 0;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                tab === t.id
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-white/20 text-white' : 'bg-navy/10 text-navy'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : queries.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-brand-sm">
          <MessagesSquare className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-sora font-bold text-navy text-lg mb-2">No queries in this section</h3>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            You don't have any queries marked as {TAB_MAPPING.find(t => t.id === tab)?.label.toLowerCase()}.
          </p>
          <Link
            to="/student/discover"
            className="px-6 py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:shadow-md transition inline-block"
          >
            Discover Classrooms
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {queries.map((query) => {
            const classroom = query.classroomId;
            const teacher = query.teacherId;
            if (!classroom) return null;

            // Generate timeline events from query fields
            const events = [
              { id: '1', type: 'submitted', timestamp: query.createdAt, content: query.message || 'Sent query request to teacher.' },
            ];
            if (query.teacherMessage) {
              events.push({ id: '2', type: 'teacher_reply', timestamp: query.updatedAt, content: query.teacherMessage });
            }
            if (query.status === 'enrolled') {
              events.push({ id: '3', type: 'system_action', actionType: 'enrolled', timestamp: query.updatedAt, content: 'Payment successful. Enrolled in classroom.' });
            } else if (query.status === 'rejected') {
              events.push({ id: '4', type: 'system_action', actionType: 'teacher_rejected', timestamp: query.updatedAt, content: 'Teacher declined the request.' });
            } else if (query.status === 'expired') {
              events.push({ id: '5', type: 'system_action', actionType: 'approval_expired', timestamp: query.updatedAt, content: 'Approval expired (24 hour limit).' });
            }

            const paymentTimer = query.studentEnrollDeadline ? getCountdown(query.studentEnrollDeadline) : null;

            return (
              <div
                key={query._id}
                className="bg-white rounded-xl border border-slate-100 p-6 shadow-brand-sm flex flex-col lg:flex-row gap-6 hover:shadow-brand transition-all"
              >
                {/* Left pane: Query details & status */}
                <div className="lg:w-[35%] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        query.status === 'accepted' ? 'bg-sky/10 text-sky' :
                        query.status === 'enrolled' ? 'bg-emerald-500/10 text-emerald-600' :
                        query.status === 'pending' ? 'bg-amber/10 text-amber-hover' :
                        'bg-error/10 text-error'
                      }`}>
                        {humanizeEnum(query.status)}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {formatDate(query.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-sora font-bold text-navy text-lg leading-snug mb-1">
                      {classroom.title}
                    </h3>
                    <p className="text-xs text-muted mb-4">
                      Taught by <strong className="text-slate-700 font-semibold">{teacher?.name || 'Verified Teacher'}</strong>
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600 mb-6">
                      <span className="px-2 py-1 rounded bg-slate-100">
                        {classroom.subject}
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-100 capitalize">
                        {classroom.mode}
                      </span>
                    </div>
                  </div>

                  <div>
                    <QueryProgressTracker currentStatus={query.status} />
                  </div>
                </div>

                {/* Right pane: timeline, payment deadlines, and actions */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Action Banner for approved query awaiting payment */}
                  {query.status === 'accepted' && (
                    <div className="bg-sky/5 p-4 rounded-xl border border-sky/10 mb-4 flex flex-col gap-3">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="text-sky shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="text-xs font-bold text-navy">Action Required: Secure your seat</p>
                          <p className="text-[11px] text-muted leading-relaxed">
                            Your seat is temporarily reserved. Complete the payment before the deadline.
                          </p>
                        </div>
                      </div>

                      {paymentTimer && !paymentTimer.expired && (
                        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 w-max ${
                          paymentTimer.isUrgent ? 'text-coral bg-coral/5 border-coral/10' : 'text-sky bg-sky/5 border-sky/10'
                        }`}>
                          <Clock size={13} />
                          Closes in {paymentTimer.text}
                        </div>
                      )}

                      <button
                        onClick={() => setPaymentModalTarget(query)}
                        className="bg-navy text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-navy-hover transition flex items-center justify-center gap-1.5 w-full shadow-brand-sm"
                      >
                        <CreditCard size={14} />
                        Proceed to Payment ({formatCurrency((classroom.feesPaise || 0) / 100)})
                      </button>
                    </div>
                  )}

                  <div className="flex-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-4">
                    <QueryTimeline events={events} userType="student" />
                  </div>

                  {query.status === 'enrolled' && (
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => navigate(`/classroom/${classroom._id}`)}
                        className="bg-navy text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-navy-hover transition flex items-center gap-1.5"
                      >
                        <BookOpen size={14} /> Enter Classroom
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {paymentModalTarget && (
        <Modal
          isOpen={!!paymentModalTarget}
          onClose={() => {
            setPaymentModalTarget(null);
            setWalletPassword('');
          }}
          title="Confirm Enrollment Payment"
          footer={
            <>
              <button
                onClick={() => {
                  setPaymentModalTarget(null);
                  setWalletPassword('');
                }}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollGateway}
                disabled={paying}
                className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                <CreditCard size={16} /> Pay via Card/UPI
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-sora font-bold text-navy text-sm mb-1">
                {paymentModalTarget.classroomId?.title}
              </h4>
              <p className="text-xs text-muted mb-3">
                Subject: {paymentModalTarget.classroomId?.subject}
              </p>
              <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Fees:</span>
                <span className="font-sora font-extrabold text-navy text-lg">
                  {formatCurrency((paymentModalTarget.classroomId?.feesPaise || 0) / 100)}
                </span>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                    Wallet Cash Balance
                  </p>
                  <p className="font-sora font-extrabold text-navy text-base">
                    {formatCurrency((wallet?.cashBalancePaise || 0) / 100)}
                  </p>
                </div>
                {(wallet?.cashBalancePaise ?? 0) < (paymentModalTarget.classroomId?.feesPaise || 0) && (
                  <span className="text-xs font-bold text-coral bg-coral/10 px-2.5 py-1 rounded-md">
                    Insufficient Cash
                  </span>
                )}
              </div>

              {(wallet?.cashBalancePaise ?? 0) >= (paymentModalTarget.classroomId?.feesPaise || 0) && (
                <form onSubmit={handleEnrollWallet} className="space-y-3 pt-2 border-t border-emerald-500/10">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Password Verification <span className="text-coral">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showWalletPassword ? 'text' : 'password'}
                        placeholder="Enter your account password to authorize payment"
                        value={walletPassword}
                        onChange={(e) => setWalletPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy dark:bg-slate-800 dark:text-slate-100"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowWalletPassword(!showWalletPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy dark:hover:text-slate-200 transition"
                      >
                        {showWalletPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={paying || !walletPassword}
                    className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Wallet size={14} /> Confirm & Pay using Wallet Cash
                  </button>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyQueriesPage;
