import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, XCircle, CheckCircle, LineChart, FolderOpen, Search, ArrowRight, Archive, Check, AlertCircle, Loader2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { handleComingSoon } from '../utils/navigationFixes';
import { calculatePaymentDeadline, getPaymentTimer } from '../utils/paymentExpiry';
import QueryTimeline from '../components/shared/QueryTimeline';
import api from '../services/api.js';

const TeacherQueriesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeacherQueries = async () => {
    try {
      setLoading(true);
      const res = await api.teacher.getMyQueries();
      const list = Array.isArray(res) ? res : (res?.queries || []);
      const mapped = list.map(q => ({
        id: q._id || q.id,
        student: q.student?.name || 'Student',
        studentId: q.student?._id || q.student,
        initials: q.student?.name ? q.student.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'S',
        subject: q.classroom?.subject || q.subject || 'General',
        classroomName: q.classroom?.title || q.classroomName || 'Classroom Query',
        classroomId: q.classroom?._id || q.classroom,
        status: q.status || 'pending',
        message: q.initialMessage || q.message || '',
        createdAt: q.createdAt,
        paymentDeadline: q.paymentDeadline,
        events: q.history || q.events || []
      }));
      setQueries(mapped);
    } catch (err) {
      console.warn('Failed to load teacher queries:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Student Queries — TrueEd";
    fetchTeacherQueries();
  }, []);

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [privateModalOpen, setPrivateModalOpen] = useState(false);
  const [activeQueryId, setActiveQueryId] = useState(null);
  
  const [teacherClassrooms, setTeacherClassrooms] = useState([]);
  const [privateRoomForm, setPrivateRoomForm] = useState({
    name: '', type: '1-to-1', subject: '', duration: '60 mins', price: '', maxStudents: 1,
    startDate: '', endDate: '', scheduleDays: [], startTime: '', endTime: ''
  });
  
  const [responseText, setResponseText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openAcceptModal = (id) => {
    setActiveQueryId(id);
    setResponseText('');
    setActionError(null);
    setAcceptModalOpen(true);
  };

  const openRejectModal = (id) => {
    setActiveQueryId(id);
    setRejectReason('');
    setActionError(null);
    setRejectModalOpen(true);
  };

  const handleAccept = async () => {
    try {
      await api.enrollment.acceptQuery(activeQueryId, responseText);
      setAcceptModalOpen(false);
      showToast('Student Approved Successfully.');
      fetchTeacherQueries();
    } catch (err) {
      setActionError(err.message || 'Failed to accept query');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await api.enrollment.rejectQuery(activeQueryId, rejectReason);
      setRejectModalOpen(false);
      showToast('Student Request Rejected');
      fetchTeacherQueries();
    } catch (err) {
      setActionError(err.message || 'Failed to reject query');
    }
  };

  const openReplyModal = (id) => { setActiveQueryId(id); setResponseText(''); setActionError(null); setReplyModalOpen(true); };

  const handleReplyOnly = () => {
    if (!responseText.trim()) return;

    setQueries(queries.map(q => q.id === activeQueryId ? { 
      ...q, 
      status: 'waiting_for_student',
      events: [...(q.events || []), {
        id: `e_${Date.now()}`, type: 'teacher_reply', timestamp: new Date().toISOString(), content: responseText
      }]
    } : q));
    setReplyModalOpen(false);
    showToast('Reply Sent');
  };

  const handlePrivateClick = (id) => {
    setActiveQueryId(id);
    const query = queries.find(q => q.id === id);
    setPrivateRoomForm({
      name: `${query.studentName || query.student}'s Private Class`,
      type: '1-to-1', subject: query.subject || query.classroomName || '', duration: '60 mins', price: '', maxStudents: 1,
      startDate: '', endDate: '', scheduleDays: [], startTime: '', endTime: ''
    });
    setPrivateModalOpen(true);
  };

  const handleCreatePrivate = () => {
    const newRoom = { ...privateRoomForm, id: Date.now(), enrolled: 1, status: 'active' };
    const updatedClassrooms = [...teacherClassrooms, newRoom];
    setTeacherClassrooms(updatedClassrooms);
    localStorage.setItem('trueed_teacher_classrooms', JSON.stringify(updatedClassrooms));

    setQueries(queries.map(q => q.id === activeQueryId ? {
      ...q,
      status: 'waiting_for_student',
      actionTaken: 'private_created',
      customClassroomId: newRoom.id,
      events: [...(q.events || []), {
        id: `e_${Date.now()}`, type: 'private_classroom', timestamp: new Date().toISOString(), content: `Created Private Classroom: ${newRoom.name}`
      }]
    } : q));
    setPrivateModalOpen(false);
    showToast('Private Classroom Created');
  };
  
  const handleResolve = (id) => {
    setQueries(queries.map(q => q.id === id ? {
      ...q,
      status: 'resolved',
      events: [...(q.events || []), { id: `e_${Date.now()}`, type: 'system_action', actionType: 'enrolled', timestamp: new Date().toISOString(), content: 'Query marked as Resolved.' }]
    } : q));
    showToast('Query Resolved');
  };

  const handleArchive = (id) => {
    setQueries(queries.map(q => q.id === id ? { ...q, archived: true } : q));
    showToast('Query Archived');
  };

  const handleRestore = (id) => {
    setQueries(queries.map(q => q.id === id ? { ...q, archived: false } : q));
    showToast('Query Restored');
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredQueries = queries.filter(q => {
    if (!q) return false;
    const studentName = q.student || q.studentName || 'Unknown Student';
    const subject = q.subject || q.classroomName || '';
    
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Default filters out archived unless in Archived tab
    if (activeTab === 'Archived') return q.archived && matchesSearch;
    if (q.archived) return false;

    if (activeTab === 'Pending') return (q.status === 'pending' || q.status === 'pending_review') && matchesSearch;
    if (activeTab === 'Accepted') return (q.status === 'accepted' || q.status === 'enrolled') && matchesSearch;
    if (activeTab === 'Waiting for Payment') return q.status === 'approved_waiting_payment' && matchesSearch;
    if (activeTab === 'Rejected') return (q.status === 'rejected' || q.status === 'auto_rejected' || q.status === 'approval_expired') && matchesSearch;
    if (activeTab === 'Resolved') return q.status === 'resolved' && matchesSearch;
    
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-3xl font-bold text-navy">Student Queries</h1>
          <p className="text-slate-500 font-medium mt-1">Manage incoming requests, messages, and classroom enrollments.</p>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle className="w-5 h-5 text-success" />
          {toastMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Total Queries</p>
            <p className="text-2xl font-black font-sora text-navy">{queries.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Pending</p>
            <p className="text-2xl font-black font-sora text-navy">{queries.filter(q => q.status === 'pending_review' || q.status === 'pending').length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Enrolled</p>
            <p className="text-2xl font-black font-sora text-navy">{queries.filter(q => q.status === 'accepted' || q.status === 'enrolled').length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Archived</p>
            <p className="text-2xl font-black font-sora text-navy">{queries.filter(q => q.archived).length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200">
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
            {['All', 'Pending', 'Accepted', 'Waiting for Payment', 'Rejected', 'Resolved', 'Archived'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-navy rounded-t-full"></div>}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search student or subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[800px] overflow-y-auto">
          {filteredQueries.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-medium">No queries found.</div>
          ) : (
            filteredQueries.map(query => (
              <div key={query.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="flex flex-col lg:flex-row">
                  {/* Left Column: Student Info */}
                  <div className="w-full lg:w-1/3 p-6 bg-slate-50/50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center font-sora font-bold text-lg shrink-0">
                        {query?.initials || (query?.student || query?.studentName || 'U').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-navy text-lg">{query?.student || query?.studentName || 'Unknown Student'}</h3>
                        <p className="text-sm font-medium text-slate-500">{formatDate(query?.createdAt || query?.date)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-600 uppercase tracking-wider">
                          Classroom Query
                        </span>
                      </div>
                      {query.classLevel && (
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-500 font-medium">Class:</span>
                          <span className="font-semibold text-navy text-right">{query.classLevel}</span>
                        </div>
                      )}
                      {query?.subject && (
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-500 font-medium">Subject:</span>
                          <span className="font-semibold text-navy text-right line-clamp-2">{query.subject}</span>
                        </div>
                      )}
                      {query?.classroomName && (
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-500 font-medium">Classroom:</span>
                          <span className="font-semibold text-navy text-right line-clamp-2">{query.classroomName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Timeline & Actions */}
                  <div className="w-full flex-1 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6 p-6 flex flex-col h-full">
                    
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h4 className="font-bold text-navy text-sm uppercase tracking-wide">Conversation</h4>
                      <div className="flex items-center gap-2">
                        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          (query?.status === 'accepted' || query?.status === 'enrolled' || query?.status === 'resolved') ? 'bg-green-100 text-green-700' :
                          query?.status === 'approved_waiting_payment' ? 'bg-blue-100 text-blue-700' :
                          query?.status === 'auto_rejected' ? 'bg-slate-100 text-slate-700' :
                          (query?.status === 'approval_expired' || query?.status === 'rejected') ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {(query?.status || 'pending').replace(/_/g, ' ')}
                        </div>
                        {query?.archived ? (
                          <button onClick={() => handleRestore(query.id)} className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 flex items-center gap-1">
                            <Archive className="w-3 h-3" /> Restore
                          </button>
                        ) : (
                          <button onClick={() => handleArchive(query.id)} className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 flex items-center gap-1">
                            <Archive className="w-3 h-3" /> Archive
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      {query.status === 'approved_waiting_payment' && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col gap-2 mb-4">
                          <p className="text-sm text-amber-700 font-bold">Waiting for Payment</p>
                          <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-2 w-max ${
                            getPaymentTimer(query.paymentDeadline)?.isUrgent ? 'text-red-600 bg-red-100 border-red-200' : 'text-amber-600 bg-white border-amber-200'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {getPaymentTimer(query.paymentDeadline)?.text} remaining
                          </div>
                        </div>
                      )}
                      
                      {query.status === 'approval_expired' && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex gap-3 items-start mb-4">
                          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-red-700 font-bold">Approval Expired</p>
                            <p className="text-xs text-red-500 mt-1">Payment deadline was missed. Seat released.</p>
                          </div>
                        </div>
                      )}

                      {/* Display Timeline of Events */}
                      <div className="mb-4">
                        <QueryTimeline 
                          events={[
                            query?.message ? { id: 's1', type: 'submitted', timestamp: query?.createdAt, content: query.message } : null,
                            ...(query?.events || (query?.reply ? [{ id: 's2', type: 'teacher_reply', timestamp: query?.replyDate || query?.createdAt, content: query.reply }] : []))
                          ].filter(Boolean)} 
                          userType="teacher" 
                        />
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-slate-100 mt-auto">
                        {(query.status === 'pending' || query.status === 'pending_review') && (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                              onClick={() => openAcceptModal(query.id)}
                              className="flex-1 py-2 bg-success text-white text-xs font-bold rounded-lg hover:bg-green-600 transition shadow-sm flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" /> Accept Student
                            </button>
                            <button 
                              onClick={() => openRejectModal(query.id)}
                              className="flex-1 py-2 bg-white text-error border border-red-200 text-xs font-bold rounded-lg hover:bg-red-50 transition shadow-sm flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        )}
                        
                        {/* Can message if not resolved/expired */}
                        {(query.status === 'pending' || query.status === 'pending_review' || query.status === 'waiting_for_student') && (
                          <div className="flex flex-col sm:flex-row gap-3 mt-3">
                             <button 
                              onClick={() => openReplyModal(query.id)}
                              className="flex-1 py-2 bg-white text-navy border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition shadow-sm"
                            >
                              Send Message
                            </button>
                          </div>
                        )}
                        
                        {/* Links to classes */}
                        {(query.status === 'accepted' || query.status === 'enrolled' || query.status === 'resolved') && query.classroomId && (
                           <div className="mt-3">
                             <Link to={`/teacher/classrooms/${query.classroomId}`} className="inline-flex items-center gap-2 px-6 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition shadow-sm">
                               Go to Classroom <ArrowRight className="w-3 h-3" />
                             </Link>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Accept Modal */}
      {acceptModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="font-sora font-bold text-xl text-navy">Accept Student</h2>
              <button onClick={() => setAcceptModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {actionError && <div className="mb-4 text-xs font-bold text-error bg-error/10 p-3 rounded-lg border border-error/20 flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {actionError}</div>}
              <p className="text-sm font-medium text-slate-500 mb-4">Add an optional message to send to the student upon acceptance.</p>
              <textarea 
                value={responseText} onChange={(e) => setResponseText(e.target.value)}
                placeholder="E.g., Welcome to the class! Please complete your payment..."
                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy resize-none"
              ></textarea>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setAcceptModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
                <button onClick={handleAccept} className="px-6 py-2.5 bg-success text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition">Confirm Acceptance</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="font-sora font-bold text-xl text-navy">Reject Request</h2>
              <button onClick={() => setRejectModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {actionError && <div className="mb-4 text-xs font-bold text-error bg-error/10 p-3 rounded-lg border border-error/20 flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {actionError}</div>}
              <p className="text-sm font-medium text-slate-500 mb-4">Please provide a reason for rejecting this request (Required).</p>
              <textarea 
                value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Sorry, this batch is currently full."
                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-error focus:ring-1 focus:ring-error resize-none"
              ></textarea>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setRejectModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
                <button onClick={handleReject} disabled={!rejectReason.trim()} className="px-6 py-2.5 bg-error text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">Reject Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="font-sora font-bold text-xl text-navy">Send Message</h2>
              <button onClick={() => setReplyModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {actionError && <div className="mb-4 text-xs font-bold text-error bg-error/10 p-3 rounded-lg border border-error/20 flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {actionError}</div>}
              <textarea 
                value={responseText} onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your message here..."
                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy resize-none"
              ></textarea>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setReplyModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
                <button onClick={handleReplyOnly} disabled={!responseText.trim()} className="px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition disabled:opacity-50">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Private classroom modal */}
      {privateModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 relative">
              <button onClick={() => setPrivateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
              <h2 className="font-sora font-bold text-xl text-navy mb-4">Create Private Classroom</h2>
              <p className="text-sm text-slate-600 mb-4">Mock: Create a custom 1-on-1 classroom.</p>
              <input type="text" value={privateRoomForm.name} onChange={e => setPrivateRoomForm({...privateRoomForm, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg mb-4 text-sm focus:border-navy focus:outline-none" placeholder="Classroom Name" />
              <div className="flex gap-3 mt-2">
                 <button onClick={() => setPrivateModalOpen(false)} className="flex-1 py-2.5 text-center text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                 <button onClick={handleCreatePrivate} className="flex-1 py-2.5 bg-navy text-white rounded-lg font-bold shadow-sm hover:bg-navy-light transition text-sm">Create & Invite</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default TeacherQueriesPage;
