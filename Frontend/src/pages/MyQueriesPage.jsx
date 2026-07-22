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

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await api.enrollment.getMyQueries().catch(() => null);
      const list = Array.isArray(res) ? res : (res?.queries || res?.docs || []);
      
      const localQueriesRaw = localStorage.getItem('trueed_classroom_queries');
      let localList = [];
      if (localQueriesRaw) {
        try {
          localList = JSON.parse(localQueriesRaw);
        } catch (e) {}
      }

      const combinedMap = new Map();
      
      localList.forEach(q => {
        const idKey = (q.id || q._id)?.toString();
        if (idKey) {
          combinedMap.set(idKey, {
            id: q.id || q._id,
            studentId: q.studentId || user?.id,
            teacherName: q.teacherName || q.teacher?.name || 'Teacher',
            classroomName: q.classroomName || q.classroom?.title || 'Classroom Query',
            classroomId: q.classroomId || q.classroom?._id || q.classroom,
            status: q.status || 'pending',
            message: q.initialMessage || q.message || '',
            createdAt: q.createdAt || new Date().toISOString(),
            paymentDeadline: q.paymentDeadline,
            events: q.history || q.events || []
          });
        }
      });

      list.forEach(q => {
        const idKey = (q._id || q.id)?.toString();
        if (idKey) {
          combinedMap.set(idKey, {
            id: q._id || q.id,
            studentId: q.student?._id || q.student || user?.id,
            teacherName: q.teacher?.name || q.teacherName || 'Teacher',
            classroomName: q.classroom?.title || q.classroomName || 'Classroom Query',
            classroomId: q.classroom?._id || q.classroom || q.classroomId,
            status: q.status || 'pending',
            message: q.initialMessage || q.message || '',
            createdAt: q.createdAt,
            paymentDeadline: q.paymentDeadline,
            events: q.history || q.events || []
          });
        }
      });

      setQueries(Array.from(combinedMap.values()));
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
    openPaymentModal({
      type: 'classroom',
      details: {
        id: query.classroomId,
        name: query.classroomName,
        teacherName: query.teacherName || query.teacher,
        price: query.price || 1500
      },
      onSuccess: async () => {
        try {
          await api.enrollment.enrollInClassroom(query.id, 'wallet');
          setQueries(queries.map(q => q.id === query.id ? {
            ...q,
            status: 'enrolled',
            events: [...(q.events || []), { id: `e_${Date.now()}`, type: 'system_action', actionType: 'enrolled', timestamp: new Date().toISOString(), content: 'Payment successful. You are now enrolled.' }]
          } : q));
          setEnrollToast(true);
          setTimeout(() => setEnrollToast(false), 3000);
        } catch (err) {
          setEnrollError(err.message || 'Enrollment failed. Please try again.');
        }
      }
    });
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
          { id: 'Accepted', label: 'Accepted & Waiting Payment' },
          { id: 'Rejected', label: 'Rejected' },
          { id: 'Expired', label: 'Expired / Closed' },
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
          if (filter === 'Active') return q.status === 'open' || q.status === 'pending' || q.status === 'in_progress';
          if (filter === 'Accepted') return q.status === 'accepted' || q.status === 'approved_waiting_payment';
          if (filter === 'Rejected') return q.status === 'rejected' || q.status === 'auto_rejected';
          if (filter === 'Expired') return q.status === 'approval_expired' || q.status === 'closed_inactive' || q.status === 'expired';
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
                {query.status === 'approved_waiting_payment' && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col gap-2 mb-6">
                    <p className="text-sm text-amber-700 font-bold">Action Required: Complete Payment</p>
                    <p className="text-xs text-amber-600 font-medium">Your seat is temporarily reserved. Complete payment before the deadline to secure it.</p>
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
                     <button onClick={() => handleWithdraw(query.id)} className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-error text-xs font-bold rounded-lg hover:bg-slate-50 transition">
                       Withdraw Query
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
    </div>
  );
};

export default MyQueriesPage;
