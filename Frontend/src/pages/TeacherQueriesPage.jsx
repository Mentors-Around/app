import { useState, useEffect } from 'react';
import { teacherQueriesData } from '../data/teacherQueries';
import { MessageSquare, Clock, XCircle, CheckCircle, LineChart, FolderOpen } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const TeacherQueriesPage = () => {
  const { user } = useAuth();

  const calculateExpiration = (dateString) => {
    if (!dateString) return { expired: false, text: 'No Date' };
    const submissionDate = new Date(dateString);
    const expirationDate = new Date(submissionDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now >= expirationDate) {
      return { expired: true, text: 'Expired' };
    }
    
    const diffMs = expirationDate - now;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return {
      expired: false,
      text: `${days} days ${hours} hours remaining`
    };
  };

  const [queries, setQueries] = useState(() => {
    let combinedData = [];
    
    // Load Classroom Queries
    const savedClassroom = localStorage.getItem('trueed_classroom_queries');
    if (savedClassroom) {
      combinedData = [...combinedData, ...JSON.parse(savedClassroom)];
    } else {
      combinedData = [...combinedData, ...teacherQueriesData];
    }
    
    // Load General Queries
    const savedGeneral = localStorage.getItem('trueed_general_queries');
    if (savedGeneral) {
      combinedData = [...combinedData, ...JSON.parse(savedGeneral)];
    }

    let hasChanges = false;
    const processedQueries = combinedData.map(q => {
      const timestamp = q.createdAt || q.date;
      
      if (q.status === 'pending') {
        const { expired } = calculateExpiration(timestamp);
        if (expired) {
          hasChanges = true;
          // Refund token to student
          const tokens = parseInt(localStorage.getItem('trueed_student_tokens') || '0', 10);
          localStorage.setItem('trueed_student_tokens', (tokens + 1).toString());
          return { ...q, status: 'auto_rejected', replyDate: new Date().toISOString(), createdAt: timestamp };
        }
      }
      return { ...q, createdAt: timestamp };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (hasChanges || (!savedClassroom && !savedGeneral)) {
      const classQ = processedQueries.filter(q => q.type !== 'general');
      const genQ = processedQueries.filter(q => q.type === 'general');
      localStorage.setItem('trueed_classroom_queries', JSON.stringify(classQ));
      localStorage.setItem('trueed_general_queries', JSON.stringify(genQ));
    }
    
    return processedQueries;
  });

  const [activeTab, setActiveTab] = useState('All');
  
  // Modal states
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeQueryId, setActiveQueryId] = useState(null);
  
  // New action modal states
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [privateModalOpen, setPrivateModalOpen] = useState(false);
  const [teacherClassrooms, setTeacherClassrooms] = useState([]);
  
  // Private classroom form state
  const [privateRoomForm, setPrivateRoomForm] = useState({
    name: '', type: '1-to-1', subject: '', duration: '60 mins', price: '', maxStudents: 1,
    startDate: '', endDate: '', scheduleDays: [], startTime: '', endTime: ''
  });
  
  // Form states
  const [responseText, setResponseText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    document.title = "Student Queries — TrueEd";
    const savedClassrooms = localStorage.getItem('trueed_teacher_classrooms');
    if (savedClassrooms) {
      setTeacherClassrooms(JSON.parse(savedClassrooms));
    }
  }, []);

  useEffect(() => {
    const classQ = queries.filter(q => q.type !== 'general');
    const genQ = queries.filter(q => q.type === 'general');
    localStorage.setItem('trueed_classroom_queries', JSON.stringify(classQ));
    localStorage.setItem('trueed_general_queries', JSON.stringify(genQ));
  }, [queries]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openAcceptModal = (id) => {
    setActiveQueryId(id);
    setResponseText('');
    setAcceptModalOpen(true);
  };

  const openRejectModal = (id) => {
    setActiveQueryId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleAccept = () => {
    setQueries(queries.map(q => q.id === activeQueryId ? { 
      ...q, 
      status: 'accepted', 
      reply: responseText || 'Query Accepted. I will contact you shortly.', 
      replyDate: new Date().toISOString()
    } : q));
    setAcceptModalOpen(false);
    showToast('Query accepted successfully');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    setQueries(queries.map(q => q.id === activeQueryId ? { 
      ...q, 
      status: 'rejected', 
      reply: rejectReason, 
      replyDate: new Date().toISOString() 
    } : q));
    
    // Refund token to student
    const tokens = parseInt(localStorage.getItem('trueed_student_tokens') || '0', 10);
    localStorage.setItem('trueed_student_tokens', (tokens + 1).toString());

    setRejectModalOpen(false);
    showToast('Query rejected and token refunded');
  };

  const handleRecommendClick = (id) => {
    setActiveQueryId(id);
    setRecommendModalOpen(true);
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

  const handleRecommendClassroom = (classroomId) => {
    setQueries(queries.map(q => q.id === activeQueryId ? {
      ...q,
      actionTaken: 'recommended',
      recommendedClassroomId: classroomId
    } : q));
    setRecommendModalOpen(false);
    showToast('Classroom recommended to student');
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':');
    return parseInt(h, 10) + parseInt(m, 10) / 60;
  };

  const formatTime12hr = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const handleCreatePrivateSubmit = (e) => {
    e.preventDefault();
    if (new Date(privateRoomForm.endDate) < new Date(privateRoomForm.startDate)) {
      showToast("End Date must be after Start Date");
      return;
    }
    if (parseTime(privateRoomForm.endTime) <= parseTime(privateRoomForm.startTime)) {
      showToast("End Time must be after Start Time");
      return;
    }
    if (privateRoomForm.scheduleDays.length === 0) {
      showToast("At least one day must be selected");
      return;
    }

    const query = queries.find(q => q.id === activeQueryId);
    const newClassroom = {
      id: Date.now(),
      teacherId: user?.id || 1,
      teacher: user?.name || 'Teacher',
      status: 'active',
      isCustomForQuery: true,
      linkedQueryId: query.id,
      linkedStudent: query.studentName || query.student,
      enrolled: 0,
      ...privateRoomForm
    };
    
    const updatedClassrooms = [...teacherClassrooms, newClassroom];
    setTeacherClassrooms(updatedClassrooms);
    localStorage.setItem('trueed_teacher_classrooms', JSON.stringify(updatedClassrooms));

    setQueries(queries.map(q => q.id === activeQueryId ? {
      ...q,
      actionTaken: 'private_created',
      customClassroomId: newClassroom.id
    } : q));
    
    setPrivateModalOpen(false);
    showToast('Private classroom created and linked');
  };

  const getDisplayStatus = (status) => {
    if (status === 'auto_rejected' || status === 'rejected') return 'rejected';
    return status;
  };

  const filteredQueries = activeTab === 'All' 
    ? queries 
    : queries.filter(q => getDisplayStatus(q.status) === activeTab.toLowerCase());

  // Analytics
  const queriesThisMonth = queries.length; 
  const acceptedCount = queries.filter(q => q.status === 'accepted').length;
  const totalActioned = queries.filter(q => q.status === 'accepted' || q.status === 'rejected').length;
  const responseRate = totalActioned > 0 ? Math.round((acceptedCount / totalActioned) * 100) : 0;

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getExpectedLectures = (startDate, endDate, scheduleDays) => {
    if (!startDate || !endDate || !scheduleDays || scheduleDays.length === 0) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start > end) return 0;
    let count = 0;
    const current = new Date(start);
    const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const validDays = scheduleDays.map(d => dayMap[d]).filter(d => d !== undefined);
    while (current <= end) {
      if (validDays.includes(current.getDay())) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const getSessionDurationHours = (start, end) => {
    if (!start || !end) return 0;
    let diff = parseTime(end) - parseTime(start);
    if (diff < 0) diff += 24;
    return diff;
  };

  const expectedLecturesCount = getExpectedLectures(privateRoomForm.startDate, privateRoomForm.endDate, privateRoomForm.scheduleDays);
  const sessionHours = getSessionDurationHours(privateRoomForm.startTime, privateRoomForm.endTime);
  const totalTeachingHours = (expectedLecturesCount * sessionHours).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-50 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      <div>
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">Classroom Queries</h1>
        <p className="text-slate-500 font-medium">Manage and reply to students interested in your classrooms.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky/10 text-sky rounded-full flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Queries This Month</p>
            <p className="font-sora font-extrabold text-2xl text-navy">{queriesThisMonth}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xl shrink-0">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Acceptance Rate</p>
            <p className="font-sora font-extrabold text-2xl text-navy">{responseRate}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Response Time</p>
            <p className="font-sora font-extrabold text-2xl text-navy">4 Hours</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        {['All', 'Pending', 'Accepted', 'Rejected'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === tab ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-navy rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Query List */}
      <div className="space-y-6">
        {filteredQueries.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="font-sora font-bold text-navy text-lg mb-2">No queries found</h3>
            <p className="text-slate-500 text-sm">You don't have any {activeTab.toLowerCase()} queries at the moment.</p>
          </div>
        ) : (
          filteredQueries.map(query => {
            const exp = query.status === 'pending' ? calculateExpiration(query.createdAt) : null;
            
            return (
              <div key={query.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Left Column: Student Info & Preferences */}
                <div className="w-full lg:w-1/3 shrink-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg shrink-0">
                      {query.studentName ? query.studentName.charAt(0) : (query.student ? query.student.charAt(0) : '?')}
                    </div>
                    <div>
                      <h3 className="font-bold text-navy">{query.studentName || query.student}</h3>
                      <p className="text-xs text-slate-500 mb-1">Query Date: {formatDate(query.createdAt)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        query.type === 'general' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {query.type === 'general' ? 'General Inquiry' : 'Classroom Query'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {query.type === 'general' ? (
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span className="text-slate-500 font-medium">Subject:</span>
                        <span className="font-semibold text-navy text-right line-clamp-2">{query.subject}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-500 font-medium">Classroom:</span>
                          <span className="font-semibold text-navy text-right line-clamp-2">{query.classroomName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-500 font-medium">Goals:</span>
                          <span className="font-semibold text-navy text-right line-clamp-2">{query.goals}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-500 font-medium">Schedule:</span>
                          <span className="font-semibold text-navy text-right">{query.schedule || query.preferredDays || 'Flexible'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column: Message & Actions */}
                <div className="w-full flex-1 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6 flex flex-col h-full">
                  
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h4 className="font-bold text-navy text-sm uppercase tracking-wide">Conversation</h4>
                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      query.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      (query.status === 'rejected' || query.status === 'auto_rejected') ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {query.status === 'auto_rejected' ? 'Auto Rejected' : query.status}
                    </div>
                  </div>

                  {(query.status === 'accepted' || query.status === 'rejected') ? (
                    <div className="space-y-4 flex-1">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 mb-1">Student:</p>
                        <p className="text-sm text-slate-700">"{query.message}"</p>
                      </div>
                      <div className={`${query.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} p-4 rounded-xl border`}>
                        <p className={`text-xs font-bold mb-1 ${query.status === 'accepted' ? 'text-green-700' : 'text-red-700'}`}>Teacher (You):</p>
                        <p className="text-sm text-navy font-medium">"{query.reply}"</p>
                        <p className="text-[11px] text-slate-400 mt-2">Actioned On: {formatDate(query.replyDate)}</p>
                      </div>
                      
                      {query.status === 'accepted' && !query.actionTaken && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button 
                            onClick={() => handleRecommendClick(query.id)}
                            className="flex-1 py-2 bg-white text-navy border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                          >
                            Recommend Existing
                          </button>
                          <button 
                            onClick={() => handlePrivateClick(query.id)}
                            className="flex-1 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition-all shadow-sm"
                          >
                            Create Private Classroom
                          </button>
                        </div>
                      )}

                      {query.actionTaken === 'recommended' && (
                        <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-sky-700">Recommended existing classroom</span>
                          <CheckCircle className="w-4 h-4 text-sky-600" />
                        </div>
                      )}

                      {query.actionTaken === 'private_created' && (
                        <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-purple-700">Custom private classroom created</span>
                          <CheckCircle className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                    </div>
                  ) : query.status === 'auto_rejected' ? (
                    <div className="space-y-4 flex-1">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 mb-1">Student:</p>
                        <p className="text-sm text-slate-700">"{query.message}"</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex gap-3 items-start">
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-700 font-bold">This query expired because no response was provided within 3 days.</p>
                          <p className="text-[11px] text-red-400 mt-2">Expired On: {formatDate(query.replyDate)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex-1">
                      <p className="text-xs font-bold text-slate-500 mb-1">Student Message:</p>
                      <p className="text-sm text-slate-700">"{query.message}"</p>
                    </div>
                  )}

                  {query.status === 'pending' && (
                    <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-bold w-full sm:w-auto">
                        <Clock className="w-4 h-4" />
                        Respond within: {exp?.text}
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={() => openRejectModal(query.id)} className="flex-1 sm:flex-none px-6 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition">
                          Reject
                        </button>
                        <button onClick={() => openAcceptModal(query.id)} className="flex-1 sm:flex-none px-6 py-2 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy-light transition shadow-sm">
                          Accept
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Accept Modal */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-sora font-bold text-navy mb-4">Accept Query</h3>
            <p className="text-sm text-slate-500 mb-4">Are you sure you want to accept this student's query?</p>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Add a response for the student (optional)"
              rows={4}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none resize-none mb-6"
            ></textarea>
            <div className="flex gap-3">
              <button onClick={() => setAcceptModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Cancel</button>
              <button onClick={handleAccept} className="flex-1 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-lg transition">Accept Query</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-sora font-bold text-navy mb-4">Reject Query</h3>
            <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejecting this query.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              rows={4}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none resize-none mb-6"
            ></textarea>
            <div className="flex gap-3">
              <button onClick={() => setRejectModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50">Reject Query</button>
            </div>
          </div>
        </div>
      )}

      {/* Recommend Classroom Modal */}
      {recommendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-sora font-bold text-navy mb-2">Recommend Classroom</h3>
            <p className="text-sm text-slate-500 mb-6">Select one of your active classrooms to recommend to this student.</p>
            
            <div className="space-y-3 mb-6">
              {teacherClassrooms.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">You have no active classrooms to recommend.</p>
              ) : (
                teacherClassrooms.filter(c => c.status === 'active').map(classroom => (
                  <div key={classroom.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-navy transition-colors cursor-pointer" onClick={() => handleRecommendClassroom(classroom.id)}>
                    <div>
                      <h4 className="font-bold text-navy text-sm mb-1">{classroom.name}</h4>
                      <p className="text-xs text-slate-500">{classroom.subject} • {classroom.classLevel} • {classroom.mode}</p>
                    </div>
                    <button className="px-4 py-1.5 bg-sky-50 text-sky-700 font-bold text-xs rounded-lg hover:bg-sky-100 transition">
                      Recommend
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRecommendModalOpen(false)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Private Classroom Modal */}
      {privateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-sora font-bold text-navy mb-2">Create Private Classroom</h3>
            <p className="text-sm text-slate-500 mb-6">This classroom will be linked to the student and open for them to enroll.</p>
            
            <form onSubmit={handleCreatePrivateSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Classroom Name</label>
                <input required type="text" value={privateRoomForm.name} onChange={e => setPrivateRoomForm({...privateRoomForm, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Subject</label>
                  <input required type="text" value={privateRoomForm.subject} onChange={e => setPrivateRoomForm({...privateRoomForm, subject: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Type</label>
                  <select value={privateRoomForm.type} onChange={e => setPrivateRoomForm({...privateRoomForm, type: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none">
                    <option value="1-to-1">1-to-1 Mentorship</option>
                    <option value="Small Group">Small Group</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Price (₹)</label>
                  <input required type="number" value={privateRoomForm.price} onChange={e => setPrivateRoomForm({...privateRoomForm, price: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none" placeholder="e.g. 500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Max Students</label>
                  <input required type="number" min="1" value={privateRoomForm.maxStudents} onChange={e => setPrivateRoomForm({...privateRoomForm, maxStudents: parseInt(e.target.value) || 1})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none" />
                </div>
                <div className="col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200 mt-2">
                  <label className="block text-sm font-bold text-navy uppercase tracking-wider mb-4">Class Schedule Builder</label>
                  
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                      <input required type="date" value={privateRoomForm.startDate} onChange={e => setPrivateRoomForm({...privateRoomForm, startDate: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-navy outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                      <input required type="date" value={privateRoomForm.endDate} onChange={e => setPrivateRoomForm({...privateRoomForm, endDate: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-navy outline-none" />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <button 
                          key={day} type="button" 
                          onClick={() => {
                            const days = privateRoomForm.scheduleDays.includes(day) 
                              ? privateRoomForm.scheduleDays.filter(d => d !== day)
                              : [...privateRoomForm.scheduleDays, day];
                            setPrivateRoomForm({...privateRoomForm, scheduleDays: days});
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${privateRoomForm.scheduleDays.includes(day) ? 'bg-navy text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-600 hover:border-navy'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Time</label>
                      <input required type="time" value={privateRoomForm.startTime} onChange={e => setPrivateRoomForm({...privateRoomForm, startTime: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-navy outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Time</label>
                      <input required type="time" value={privateRoomForm.endTime} onChange={e => setPrivateRoomForm({...privateRoomForm, endTime: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-navy outline-none" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-2">
                    <p className="text-xs font-extrabold text-navy uppercase tracking-widest mb-3">Classroom Summary</p>
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div className="flex justify-between items-center"><span className="font-semibold text-slate-400 text-xs">Lectures:</span> <span className="font-bold text-navy bg-slate-50 px-2 py-0.5 rounded">{expectedLecturesCount}</span></div>
                      <div className="flex justify-between items-center"><span className="font-semibold text-slate-400 text-xs">Total Hours:</span> <span className="font-bold text-navy bg-slate-50 px-2 py-0.5 rounded">{totalTeachingHours} hrs</span></div>
                      <div className="col-span-2 pt-3 mt-1 border-t border-slate-100 text-xs leading-relaxed">
                        <span className="font-bold text-navy">{privateRoomForm.scheduleDays.join(', ') || 'No days selected'}</span> <br/>
                        <span className="text-slate-500">{privateRoomForm.startTime ? formatTime12hr(privateRoomForm.startTime) : '--:--'} to {privateRoomForm.endTime ? formatTime12hr(privateRoomForm.endTime) : '--:--'}</span> <br/>
                        <span className="text-slate-400">{privateRoomForm.startDate ? formatDate(privateRoomForm.startDate) : 'TBD'} — {privateRoomForm.endDate ? formatDate(privateRoomForm.endDate) : 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setPrivateModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-lg transition">Create Classroom</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherQueriesPage;
