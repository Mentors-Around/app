import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, Clock, XCircle, CheckCircle, Search, ArrowRight, Check, AlertCircle, Phone, Mail, Award, BookOpen } from 'lucide-react';
import enrollmentService from '@/services/enrollment.service';
import teacherService from '@/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import openRazorpayCheckout from '@/utils/razorpay.util';
import { formatCurrency } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';

const statusPills = {
  pending: 'bg-amber/10 text-amber-hover border-amber/20',
  accepted: 'bg-sky/10 text-sky border-sky/20',
  enrolled: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  rejected: 'bg-red-50 text-error border-red-100',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
  refunded: 'bg-purple-50 text-purple-600 border-purple-100',
};

const TeacherQueriesPage = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState('pending'); // pending, accepted, enrolled, rejected, all
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(null);

  const [teacherMessage, setTeacherMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await enrollmentService.getMyQueries({
        page,
        limit: 10,
        status: tab === 'all' ? undefined : tab,
      });
      const payload = data?.data ?? data;
      setQueries(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load queries');
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => {
    document.title = 'Enrollment Queries — TrueEd';
    loadQueries();
  }, [loadQueries]);

  const handleOpenAccept = (query) => {
    setActiveQuery(query);
    setTeacherMessage('');
    setAcceptModalOpen(true);
  };

  const handleOpenReject = (query) => {
    setActiveQuery(query);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await enrollmentService.acceptQuery(activeQuery._id, {
        teacherMessage,
      });
      
      const payload = res.data?.data ?? res.data;
      if (res.status === 202 && payload.razorpayOrder) {
        // Teacher has insufficient wallet, trigger Razorpay payment direct checkout
        toast.success('Deposit payment required. Launching payment gateway...');
        setAcceptModalOpen(false);

        try {
          const payment = await openRazorpayCheckout({
            order: payload.razorpayOrder,
            description: `4% Security Deposit: ${activeQuery.classroomId?.title}`,
            prefill: { name: user?.name, email: user?.email, contact: user?.phone },
          });
          toast.success('Payment completed! Waiting for verification...');
          loadQueries();
        } catch (paymentErr) {
          toast.error('Payment checkout cancelled or failed.');
        }
      } else {
        toast.success('Query accepted successfully!');
        setAcceptModalOpen(false);
        loadQueries();
      }
    } catch (err) {
      toast.error(err?.message || 'Could not accept query');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setSubmitting(true);
    try {
      await enrollmentService.rejectQuery(activeQuery._id, {
        reason: rejectReason,
        teacherMessage: `Request declined: ${rejectReason}`,
      });
      toast.success('Query rejected.');
      setRejectModalOpen(false);
      loadQueries();
    } catch (err) {
      toast.error(err?.message || 'Could not reject query');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQueries = queries.filter((q) => {
    const studentName = q.studentId?.name || '';
    const classroomTitle = q.classroomId?.title || '';
    const matchText = searchQuery.toLowerCase();
    return (
      studentName.toLowerCase().includes(matchText) ||
      classroomTitle.toLowerCase().includes(matchText)
    );
  });

  return (
    <div className="font-inter max-w-5xl mx-auto pb-10">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">Enrollment Queries</h1>
          <p className="text-sm text-muted mt-1">
            Review student applications for your classrooms. Accept requests or decline them with options.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by student or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        {['pending', 'accepted', 'enrolled', 'rejected', 'all'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              tab === t
                ? 'border-navy text-navy font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-brand-sm">
          <MessageSquare className="mx-auto text-slate-300 mb-3" size={44} />
          <p className="text-sm font-bold text-navy">No queries found</p>
          <p className="text-xs text-muted mt-1">There are no queries matching this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((q) => {
            const initials = q.studentId?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'S';

            const depositAmt = (q.classroomId?.feesPaise || 0) * 0.04;

            return (
              <div
                key={q._id}
                className="bg-white rounded-xl border border-slate-100 p-5 shadow-brand-sm flex flex-col md:flex-row justify-between gap-5 hover:shadow-brand transition"
              >
                <div className="flex gap-4 items-start">
                  {q.studentId?.avatarUrl ? (
                    <img
                      src={q.studentId.avatarUrl}
                      alt={q.studentId.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-sky text-white rounded-full flex items-center justify-center font-sora font-extrabold text-sm shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-sora font-bold text-navy text-sm">
                        {q.studentId?.name}
                      </h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusPills[q.status] || 'bg-slate-100 text-slate-600'}`}>
                        {q.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Applied for classroom:{' '}
                      <strong className="text-navy font-semibold">
                        {q.classroomId?.title || 'Unknown Class'}
                      </strong>{' '}
                      ({q.classroomId?.subject})
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 font-semibold pt-1">
                      <span>Applied: {formatDate(q.createdAt)}</span>
                      <span>Month: {q.monthKey}</span>
                      <span>Class Fees: {formatCurrency((q.classroomId?.feesPaise || 0) / 100)}</span>
                    </div>

                    {q.studentMessage && (
                      <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 italic">
                        &ldquo;{q.studentMessage}&rdquo;
                      </div>
                    )}

                    {q.teacherMessage && (
                      <div className="mt-2 bg-sky/5 border border-sky/10 rounded-lg p-3 text-xs text-navy font-medium">
                        Response: {q.teacherMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col justify-end items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {q.status === 'pending' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleOpenReject(q)}
                        className="flex-1 md:flex-none px-3.5 py-2 rounded-lg border border-red-200 text-error hover:bg-red-50 text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <XCircle size={14} /> Decline
                      </button>
                      <button
                        onClick={() => handleOpenAccept(q)}
                        className="flex-1 md:flex-none px-3.5 py-2 rounded-lg bg-navy hover:bg-navy-hover text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={14} /> Accept
                      </button>
                    </div>
                  )}

                  {q.status === 'accepted' && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Security Deposit Paid
                      </p>
                      <p className="text-xs font-bold text-navy mt-0.5">
                        {formatCurrency(depositAmt / 100)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Accept Modal */}
      <Modal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept Query"
        footer={
          <>
            <button
              onClick={() => setAcceptModalOpen(false)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleAcceptSubmit}
              className="px-4 py-2 bg-navy hover:bg-navy-hover text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" /> : 'Confirm & Accept'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAcceptSubmit} className="space-y-4">
          <div className="bg-navy/5 border border-navy/10 rounded-xl p-4 text-xs text-navy space-y-2">
            <p className="font-bold flex items-center gap-1 text-slate-700">
              <AlertCircle size={14} className="text-amber" /> 4% Security Deposit Notice
            </p>
            <p className="text-slate-600 font-medium">
              Accepting an enrollment request places a 4% security deposit from your wallet balance in escrow (₹
              {formatCurrency(((activeQuery?.classroomId?.feesPaise || 0) * 0.04) / 100)}).
            </p>
            <p className="text-slate-600 font-medium">
              If your balance is insufficient, you will be redirected to the Razorpay payment gateway to fund the escrow deposit.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
              Optional Message to Student
            </label>
            <textarea
              placeholder="e.g. Welcome! Please complete your enrollment payment so we can start planning the schedules."
              value={teacherMessage}
              onChange={(e) => setTeacherMessage(e.target.value)}
              className="w-full h-24 p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy resize-none"
              maxLength={500}
            />
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Decline Query"
        footer={
          <>
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              className="px-4 py-2 bg-error hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" /> : 'Confirm Decline'}
            </button>
          </>
        }
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Are you sure you want to decline this request? The student's application token will be fully refunded to their account.
          </p>

          <div>
            <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
              Reason for Declining (Required)
            </label>
            <input
              type="text"
              placeholder="e.g. Schedule mismatch / Classroom full / Incorrect subject choice"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherQueriesPage;
