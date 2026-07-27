import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare, CheckCircle, Clock, XCircle, ChevronRight, AlertCircle, RefreshCw, Star, MessageSquare, CreditCard, Loader2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import { getPaymentTimer } from '../utils/paymentExpiry';
import QueryTimeline from '../components/shared/QueryTimeline';
import QueryProgressTracker from '../components/shared/QueryProgressTracker';
import TokenHistoryModal from '../components/shared/TokenHistoryModal';
import ClassroomPreviewCard from '../components/shared/ClassroomPreviewCard';
import api from '../services/api.js';

const MyQueriesPage = () => {
  const { user } = useAuth();
  const { tokens, openTokenModal, openPaymentModal, showToast } = useWallet();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollToast, setEnrollToast] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  
  const [filter, setFilter] = useState('All');
  const [tokenHistoryOpen, setTokenHistoryOpen] = useState(false);

  // Password Modal State for MyQueries page
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [enrollPassword, setEnrollPassword] = useState('');
  const [showEnrollPassword, setShowEnrollPassword] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Reply Modal & Archiving State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeQueryForReply, setActiveQueryForReply] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await api.enrollment.getMyQueries().catch(() => null);
      const list = Array.isArray(res) ? res : (res?.queries || res?.docs || []);
      
      const mapped = list.map(q => {
        const classroom = q.classroomId || {};
        const teacher = q.teacherId || classroom.teacherId || {};
        const studentIdVal = q.studentId?._id || q.studentId || user?._id;
        return {
          id:              q._id || q.id,
          studentId:       studentIdVal,
          teacherName:     teacher.name || q.teacherName || 'Teacher',
          classroomName:   classroom.title || q.classroomName || 'Classroom Query',
          classroomId:     classroom._id || q.classroomId,
          price:           classroom.feesPaise ? classroom.feesPaise / 100 : 1500,
          status:          q.status || 'pending',
          message:         q.message || '',
          createdAt:       q.createdAt,
          archived:        q.isArchivedByStudent || false,
          paymentDeadline: q.studentEnrollDeadline || q.paymentDeadline || new Date(new Date(q.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
          events:          [
            {
              id:        'initial_query',
              type:      'submitted',
              timestamp: q.createdAt,
              content:   q.message || 'Query submitted.',
            },
            ...(q.messages || []).map((msg, index) => ({
              id:        msg._id || `msg_${index}`,
              type:      (msg.senderId?._id || msg.senderId) === studentIdVal ? 'submitted' : 'teacher_reply',
              timestamp: msg.createdAt,
              content:   msg.text,
            })),
            (q.teacherMessage && !(q.messages || []).some(m => m.text === q.teacherMessage)) ? {
              id:        'teacher_decide_msg',
              type:      'teacher_reply',
              timestamp: q.respondedAt || q.updatedAt,
              content:   q.teacherMessage,
            } : null,
            q.status === 'accepted' ? {
              id:        'sys_accept',
              type:      'system_action',
              actionType: 'teacher_approved',
              timestamp: q.respondedAt || q.updatedAt,
              content:   'Query approved by teacher. Waiting for enrollment payment.',
            } : null,
            q.status === 'rejected' ? {
              id:        'sys_reject',
              type:      'system_action',
              actionType: 'teacher_rejected',
              timestamp: q.respondedAt || q.updatedAt,
              content:   `Query rejected by teacher. Reason: ${q.rejectionReason || 'None'}`,
            } : null,
            q.status === 'expired' ? {
              id:        'sys_expire',
              type:      'system_action',
              actionType: 'teacher_rejected',
              timestamp: q.updatedAt,
              content:   'Query expired: teacher did not respond in 24 hours. 1 token refunded.',
            } : null,
            q.status === 'lapsed' ? {
              id:        'sys_lapse',
              type:      'system_action',
              actionType: 'teacher_rejected',
              timestamp: q.updatedAt,
              content:   'Query lapsed: enrollment fee not paid within 24 hours.',
            } : null,
            q.status === 'enrolled' ? {
              id:        'sys_enroll',
              type:      'system_action',
              actionType: 'enrolled',
              timestamp: q.updatedAt,
              content:   'Payment successful. You are now enrolled.',
            } : null,
          ].filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        };
      });

      setQueries(mapped);
    } catch (err) {
      console.warn('Failed to load student queries:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'My Queries — TrueEd';
    window.scrollTo(0, 0);
    fetchQueries();
  }, [user]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  const handleWithdraw = async (queryId) => {
    if (!window.confirm('Are you sure you want to withdraw this query? Your token will be refunded.')) return;
    try {
      await api.enrollment.withdrawQuery(queryId);
      setQueries(queries.map(q => q.id === queryId ? {
        ...q,
        status: 'lapsed',
        events: [...(q.events || []), {
          id: `e_${Date.now()}`, type: 'system_action', actionType: 'withdrawn', timestamp: new Date().toISOString(), content: 'Query withdrawn by student. 1 token refunded.'
        }]
      } : q));
      showToast('Query withdrawn and 1 token refunded to your wallet.');
    } catch (err) {
      showToast(err.message || 'Failed to withdraw query.');
    }
  };

  const handlePayment = (query) => {
    setSelectedQuery(query);
    setEnrollPassword('');
    setEnrollError(null);
    setShowPasswordModal(true);
  };

  const handleConfirmEnrollment = async () => {
    if (!enrollPassword.trim()) {
      setEnrollError('Password is required.');
      return;
    }
    setIsEnrolling(true);
    setEnrollError(null);
    try {
      await api.enrollment.enrollInClassroom(selectedQuery.id, 'wallet', enrollPassword);
      setQueries(queries.map(q => q.id === selectedQuery.id ? {
        ...q,
        status: 'enrolled',
        events: [...(q.events || []), { id: `e_${Date.now()}`, type: 'system_action', actionType: 'enrolled', timestamp: new Date().toISOString(), content: 'Payment successful. You are now enrolled.' }]
      } : q));
      setEnrollToast(true);
      setShowPasswordModal(false);
      setTimeout(() => setEnrollToast(false), 3000);
    } catch (err) {
      setEnrollError(err.message || 'Enrollment failed. Please check your password.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const openReplyModal = (query) => {
    setActiveQueryForReply(query);
    setResponseText('');
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!responseText.trim()) return;
    setSendingReply(true);
    try {
      await api.enrollment.sendQueryMessage(activeQueryForReply.id, responseText);
      showToast('Message Sent Successfully.');
      setReplyModalOpen(false);
      fetchQueries();
    } catch (err) {
      showToast(err.message || 'Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleArchive = async (queryId, archiveStatus) => {
    try {
      await api.enrollment.archiveQuery(queryId, archiveStatus);
      showToast(archiveStatus ? 'Query Archived' : 'Query Restored');
      fetchQueries();
    } catch (err) {
      showToast(err.message || 'Failed to toggle archive status');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6 relative">
      <h1 className="font-sora text-3xl font-bold text-navy">My Queries</h1>
      <p className="text-slate-500 font-medium">Track your classroom queries here.</p>

      {/* Enroll Toast */}
      {enrollToast && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle className="w-5 h-5 text-success" />
          Successfully Enrolled!
        </div>
      )}
      
      {/* Error Toast */}
      {enrollError && (
        <div className="fixed bottom-4 right-4 bg-error text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <AlertCircle className="w-5 h-5" />
          {enrollError}
          <button onClick={() => setEnrollError(null)} className="ml-2 bg-white/20 hover:bg-white/30 rounded-full p-1"><XCircle className="w-4 h-4"/></button>
        </div>
      )}
      
      {/* Tokens Status Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 text-slate-700 cursor-pointer hover:opacity-80 transition" onClick={() => setTokenHistoryOpen(true)}>
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-navy shrink-0 border border-slate-100">
            <span className="font-sora font-extrabold text-lg">{tokens}</span>
          </div>
          <div>
            <span className="font-bold text-sm block">Query Tokens</span>
            <span className="text-xs font-medium text-sky-600 flex items-center gap-1 mt-0.5 hover:underline">
              View History <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
        <button 
          onClick={() => openTokenModal()}
          className="px-5 py-2.5 bg-navy text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md hover:bg-navy-light transition flex gap-2 items-center"
        >
          <i className="fa-solid fa-cart-shopping"></i> Buy Tokens
        </button>
      </div>

      <TokenHistoryModal isOpen={tokenHistoryOpen} onClose={() => setTokenHistoryOpen(false)} currentTokens={tokens} />

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto hide-scrollbar">
        {[
          { id: 'All', label: 'All Queries' },
          { id: 'Active', label: 'Active / Pending' },
          { id: 'Accepted', label: 'Accepted & Waiting' },
          { id: 'Enrolled', label: 'Enrolled' },
          { id: 'Rejected', label: 'Rejected' },
          { id: 'Expired', label: 'Expired (Unpaid)' },
          { id: 'Archived', label: 'Archived' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              filter === tab.id 
                ? 'bg-navy text-white shadow-sm' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Query List */}
      <div className="space-y-6">
        {queries.filter(q => {
          if (filter === 'Archived') return q.archived;
          if (q.archived) return false;

          if (filter === 'Active') return q.status === 'pending';
          if (filter === 'Accepted') return q.status === 'accepted';
          if (filter === 'Enrolled') return q.status === 'enrolled';
          if (filter === 'Rejected') return q.status === 'rejected' || q.status === 'expired';
          if (filter === 'Expired') return q.status === 'lapsed';
          return true;
        }).length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              <MessagesSquare className="w-8 h-8" />
            </div>
            <h3 className="font-sora font-bold text-navy text-lg mb-2">No queries sent yet</h3>
            <p className="text-muted text-sm mb-6 max-w-sm mx-auto">Find a classroom and send your first query to discuss your needs with the teacher.</p>
            <Link to="/student/discover" className="px-6 py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:shadow-md transition inline-block">
              Find a Classroom
            </Link>
          </div>
        ) : (
          queries.filter(q => {
            if (filter === 'Active') return q.status === 'open' || q.status === 'pending' || q.status === 'in_progress';
            if (filter === 'Accepted') return q.status === 'accepted' || q.status === 'approved_waiting_payment';
            if (filter === 'Rejected') return q.status === 'rejected' || q.status === 'auto_rejected';
            if (filter === 'Expired') return q.status === 'approval_expired' || q.status === 'closed_inactive' || q.status === 'expired';
            return true;
          }).map(query => (
            <div key={query.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-8">
              
              {/* Left Info & Progress */}
              <div className="w-full md:w-[35%] shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-8 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      query.status === 'accepted' || query.status === 'enrolled' || query.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      query.status === 'approved_waiting_payment' ? 'bg-blue-100 text-blue-700' :
                      query.status === 'auto_rejected' ? 'bg-slate-100 text-slate-700' :
                      (query.status === 'rejected' || query.status === 'approval_expired' || query.status === 'closed_inactive') ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {query.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{formatDate(query.createdAt)}</span>
                </div>
                
                <h4 className="font-bold text-navy text-xl leading-tight mb-1">
                  {query.classroomName}
                </h4>
                <p className="text-sm font-semibold text-slate-500 mb-6">
                  to {query.teacherName || query.teacher || 'Teacher'}
                </p>
                
                <div className="mb-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-100 text-blue-700">
                    Classroom Query
                  </span>
                </div>

                <div className="mt-auto hidden md:block">
                  <QueryProgressTracker currentStatus={query.status} />
                </div>
              </div>

              {/* Right Timeline & Actions */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="md:hidden mb-6">
                  <QueryProgressTracker currentStatus={query.status} />
                </div>

                {/* Expiry Warning for Payments */}
                {query.status === 'accepted' && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col gap-2 mb-6">
                    <p className="text-sm text-amber-700 font-bold">Action Required: Complete Payment</p>
                    <p className="text-xs text-amber-600 font-medium">Your request has been accepted by the teacher. Complete payment before the deadline to secure your seat.</p>
                    <div className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-2 w-max ${
                      getPaymentTimer(query.paymentDeadline)?.isUrgent ? 'text-red-600 bg-red-100 border-red-200' : 'text-amber-600 bg-white border-amber-200'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {getPaymentTimer(query.paymentDeadline)?.text}
                    </div>
                    
                    <button 
                      onClick={() => handlePayment(query)}
                      className="mt-3 w-full py-2.5 bg-navy text-white text-sm font-bold rounded-lg shadow-sm hover:bg-navy-light transition flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" /> Proceed to Payment
                    </button>
                  </div>
                )}

                <div className="flex-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <QueryTimeline 
                    events={[
                      query?.message ? { id: 's1', type: 'submitted', timestamp: query?.createdAt, content: query.message } : null,
                      ...(query?.events || (query?.reply ? [{ id: 's2', type: 'teacher_reply', timestamp: query?.replyDate || query?.createdAt, content: query.reply }] : [])).map(e => {
                        // Inject classroom preview card if it's a private classroom event
                        if (e?.type === 'private_classroom') {
                          return {
                            ...e,
                            children: (
                              <ClassroomPreviewCard 
                                classroomId={query.customClassroomId || 1}
                                name={'Classroom'}
                                subject={query.subject}
                                teacherName={query.teacherName || query.teacher}
                                onEnroll={null}
                              />
                            )
                          };
                        }
                        return e;
                      })
                    ].filter(Boolean)} 
                    userType="student" 
                  />
                </div>

                {/* Additional Actions Based on Status */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                   {(query.status === 'pending' || query.status === 'pending_review') && (
                     <>
                       <button onClick={() => handleWithdraw(query.id)} className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-error text-xs font-bold rounded-lg hover:bg-slate-50 transition">
                         Withdraw Query
                       </button>
                       <button 
                         onClick={() => openReplyModal(query)}
                         className="w-full sm:w-auto px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition flex items-center justify-center gap-1"
                       >
                         <MessageSquare className="w-3.5 h-3.5" /> Send Message
                       </button>
                     </>
                   )}

                   {query.status !== 'pending' && (
                     <button 
                       onClick={() => handleToggleArchive(query.id, !query.archived)} 
                       className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-1"
                     >
                       <i className="fa-solid fa-box-archive" /> {query.archived ? 'Restore' : 'Archive'}
                     </button>
                   )}
                   
                   {(query.status === 'rejected' || query.status === 'auto_rejected' || query.status === 'approval_expired' || query.status === 'closed_inactive') && (
                     <button onClick={() => {/* Handle query again */}} className="w-full sm:w-auto px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition flex items-center justify-center gap-1">
                       <RefreshCw className="w-3 h-3" /> Send Query Again
                     </button>
                   )}

                   {(query.status === 'enrolled' || query.status === 'resolved') && (
                     <button className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-amber-500 text-xs font-bold rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-1">
                       <Star className="w-3.5 h-3.5" /> Rate Teacher
                     </button>
                   )}

                   {query.status === 'enrolled' && query.classroomId && (
                     <Link to={`/classroom/${query.classroomId}`} className="w-full sm:w-auto px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition flex items-center justify-center gap-1">
                       <MessageSquare className="w-3.5 h-3.5" /> Enter Classroom
                     </Link>
                   )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Password Confirmation Modal for Enrollment Payment */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="font-sora font-bold text-xl text-navy">Confirm Enrollment</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">Enter your password to authorize payment</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl">
                <p className="text-sm font-bold text-navy mb-1">💳 Payment Summary</p>
                <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span className="truncate max-w-[200px]">{selectedQuery?.classroomName}</span>
                  <span>₹{selectedQuery?.price?.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Amount will be deducted from your TrueEd wallet</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showEnrollPassword ? 'text' : 'password'}
                    placeholder="Enter your account password"
                    value={enrollPassword}
                    onChange={e => setEnrollPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirmEnrollment()}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-navy outline-none pr-12"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowEnrollPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy text-xs font-bold"
                  >
                    {showEnrollPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {enrollError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{enrollError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEnrollment}
                  disabled={isEnrolling}
                  className="flex-[2] py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isEnrolling ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                  ) : <><CheckCircle className="w-4 h-4" />Confirm & Pay ₹{selectedQuery?.price?.toFixed(2)}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reply Modal */}
      {replyModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="font-sora font-bold text-xl text-navy">Send Message</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">Communicate under this classroom query</p>
              </div>
              <button onClick={() => setReplyModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Message</label>
                <textarea
                  rows={4}
                  placeholder="Type your message here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-navy outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReplyModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !responseText.trim()}
                  className="flex-[2] py-3.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {sendingReply ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                  ) : <><MessageSquare className="w-4 h-4" />Send Message</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyQueriesPage;
