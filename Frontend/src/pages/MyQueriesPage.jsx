import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare, CheckCircle, Clock, XCircle, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import TokenPurchaseModal from '../components/shared/TokenPurchaseModal';

const MyQueriesPage = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [tokens, setTokens] = useState(0);
  const [enrollToast, setEnrollToast] = useState(false);
  const [enrollError, setEnrollError] = useState(null);

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenSuccessToast, setTokenSuccessToast] = useState(false);
  const [filter, setFilter] = useState('All');

  const handleTokenPurchaseSuccess = (newTokens) => {
    setTokens(newTokens);
    setIsTokenModalOpen(false);
    setTokenSuccessToast(true);
    setTimeout(() => setTokenSuccessToast(false), 3000);
  };

  useEffect(() => {
    document.title = 'My Queries — TrueEd';
    window.scrollTo(0, 0);

    const loadData = () => {
      let combinedQueries = [];
      const savedClassroom = localStorage.getItem('trueed_classroom_queries');
      if (savedClassroom) {
        try {
          combinedQueries = [...combinedQueries, ...JSON.parse(savedClassroom)];
        } catch (e) { console.error(e) }
      }
      const savedGeneral = localStorage.getItem('trueed_general_queries');
      if (savedGeneral) {
        try {
          combinedQueries = [...combinedQueries, ...JSON.parse(savedGeneral)];
        } catch (e) { console.error(e) }
      }
      
      const myQueries = combinedQueries
        .filter(q => q.studentId === (user?.id || 'student-1'))
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setQueries(myQueries);

      const t = parseInt(localStorage.getItem('trueed_student_tokens') || '0', 10);
      setTokens(t);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleEnroll = (query) => {
    // Check if class is full
    const classroomsRaw = localStorage.getItem('trueed_teacher_classrooms');
    let classrooms = classroomsRaw ? JSON.parse(classroomsRaw) : [];
    const classroomIndex = classrooms.findIndex(c => c.id === query.classroomId);
    
    if (classroomIndex === -1) {
      setEnrollError('Classroom no longer exists.');
      return;
    }

    const classroom = classrooms[classroomIndex];
    if (!classroom.unlimitedStudents && classroom.students >= classroom.maxStudents) {
      setEnrollError('This classroom is now full.');
      return;
    }

    // Add student to classroom
    classrooms[classroomIndex].students = (classrooms[classroomIndex].students || 0) + 1;
    localStorage.setItem('trueed_teacher_classrooms', JSON.stringify(classrooms));

    // Update query status to enrolled (optional, or just leave it)
    const queriesRaw = localStorage.getItem('trueed_classroom_queries');
    let allQueries = queriesRaw ? JSON.parse(queriesRaw) : [];
    allQueries = allQueries.map(q => q.id === query.id ? { ...q, status: 'enrolled' } : q);
    localStorage.setItem('trueed_classroom_queries', JSON.stringify(allQueries));

    // Add classroom to student's joined rooms
    const joinedRaw = localStorage.getItem('trueed_student_joined_rooms');
    let joined = joinedRaw ? JSON.parse(joinedRaw) : [];
    if (!joined.some(j => j.id === classroom.id)) {
      joined.push({ ...classroom, joinedAt: new Date().toISOString() });
      localStorage.setItem('trueed_student_joined_rooms', JSON.stringify(joined));
    }

    setQueries(queries.map(q => q.id === query.id ? { ...q, status: 'enrolled' } : q));
    setEnrollToast(true);
    setTimeout(() => setEnrollToast(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6 relative">
      <h1 className="font-sora text-3xl font-bold text-navy">My Queries</h1>
      <p className="text-slate-500 font-medium">Track your classroom and general inquiries here.</p>

      {/* Enroll Toast */}
      {enrollToast && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle className="w-5 h-5 text-success" />
          Successfully Enrolled in Classroom!
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

      {/* Token Success Toast */}
      {tokenSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-success text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          Tokens added successfully
        </div>
      )}

      {/* Tokens Status Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-slate-700">
          <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-navy shrink-0">
            <span className="font-sora font-extrabold">{tokens}</span>
          </div>
          <div>
            <span className="font-bold text-sm block">Query Tokens Available</span>
            <span className="text-xs font-medium text-slate-500">You need 1 token to send a new classroom query.</span>
          </div>
        </div>
        <button 
          onClick={() => setIsTokenModalOpen(true)}
          className="px-5 py-2.5 bg-navy text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md hover:bg-navy-light transition flex gap-2 items-center"
        >
          <i className="fa-solid fa-cart-shopping"></i> Buy Tokens
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {['All', 'Classroom Queries', 'General Inquiries'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              filter === f 
                ? 'bg-navy text-white shadow-sm' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Query List */}
      <div className="space-y-4">
        {queries.filter(q => {
          if (filter === 'Classroom Queries') return q.type !== 'general';
          if (filter === 'General Inquiries') return q.type === 'general';
          return true;
        }).length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              <MessagesSquare className="w-8 h-8" />
            </div>
            <h3 className="font-sora font-bold text-navy text-lg mb-2">No queries sent yet</h3>
            <p className="text-muted text-sm mb-6 max-w-sm mx-auto">Find a classroom and send your first query to discuss your needs with the teacher.</p>
            <Link to="/student/discover" className="px-6 py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:shadow-md transition">
              Find a Classroom
            </Link>
          </div>
        ) : (
          queries.filter(q => {
            if (filter === 'Classroom Queries') return q.type !== 'general';
            if (filter === 'General Inquiries') return q.type === 'general';
            return true;
          }).map(query => (
            <div key={query.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6">
              
              {/* Left Info */}
              <div className="w-full md:w-1/3 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      query.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      (query.status === 'rejected' || query.status === 'auto_rejected') ? 'bg-red-100 text-red-700' :
                      query.status === 'enrolled' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {query.status === 'auto_rejected' ? 'Auto-Rejected' : query.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{formatDate(query.createdAt)}</span>
                </div>
                
                <div className="mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    query.type === 'general' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {query.type === 'general' ? 'General Inquiry' : 'Classroom Query'}
                  </span>
                </div>

                <h4 className="font-bold text-navy text-lg leading-tight mb-1">
                  {query.type === 'general' ? query.subject : query.classroomName}
                </h4>
                <p className="text-sm font-semibold text-slate-500 mb-3">
                  by {query.type === 'general' ? query.teacherName : query.teacher}
                </p>
                
                {query.type !== 'general' && (
                  <Link to={`/classroom/${query.classroomId}`} className="text-xs font-bold text-sky hover:text-sky-600 flex items-center gap-1 transition">
                    View Classroom <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Right Details */}
              <div className="flex-1 space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 relative">
                  <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Query</span>
                  <p className="text-sm font-medium text-slate-600 mt-1">"{query.message}"</p>
                  {query.type !== 'general' && (
                    <div className="mt-3 flex gap-4 text-xs font-semibold text-slate-500">
                      <span><span className="text-slate-400 font-bold uppercase tracking-wider mr-1">Goals:</span> {query.goals}</span>
                      {query.schedule && <span><span className="text-slate-400 font-bold uppercase tracking-wider mr-1">Schedule:</span> {query.schedule}</span>}
                    </div>
                  )}
                </div>

                {/* Status Logic */}
                {query.status === 'pending' && (
                  <div className="text-xs text-amber-600 flex items-center gap-2 font-bold bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    Waiting for teacher approval. Tokens are refunded if rejected or after 3 days.
                  </div>
                )}

                {(query.status === 'rejected' || query.status === 'auto_rejected') && (
                  <div className="bg-red-50/50 border border-red-100 p-4 rounded-lg relative">
                    <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-bold text-error uppercase tracking-wider">Declined</span>
                    <p className="text-sm font-medium text-slate-600 mt-1">
                      {query.status === 'auto_rejected' ? 'The teacher did not respond within 3 days.' : query.reply}
                    </p>
                    <p className="text-xs font-bold text-error mt-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 1 Query Token has been refunded to your account.</p>
                  </div>
                )}

                {query.status === 'accepted' && (
                  <div className="bg-green-50/50 border border-green-100 p-4 rounded-lg relative flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
                      <div className="flex-1 w-full">
                        <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-bold text-success uppercase tracking-wider">Teacher Reply</span>
                        <p className="text-sm font-medium text-slate-600 mt-1">"{query.reply}"</p>
                      </div>
                      {query.type !== 'general' && !query.actionTaken && (
                        <button 
                          onClick={() => handleEnroll(query)}
                          className="w-full sm:w-auto px-6 py-2.5 bg-success text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition shrink-0 whitespace-nowrap"
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                    
                    {query.actionTaken === 'recommended' && (
                      <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span className="text-sm font-bold text-sky-700">Teacher has recommended an existing classroom for you.</span>
                        <Link to={`/classroom/${query.recommendedClassroomId}`} className="w-full sm:w-auto text-center px-4 py-2 bg-white text-sky-700 font-bold text-xs rounded-lg shadow-sm hover:bg-sky-50 transition border border-sky-200">
                          View Classroom Details
                        </Link>
                      </div>
                    )}
                    
                    {query.actionTaken === 'private_created' && (
                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span className="text-sm font-bold text-purple-700">A custom private classroom has been created for you!</span>
                        <Link to={`/classroom/${query.customClassroomId}`} className="w-full sm:w-auto text-center px-4 py-2 bg-white text-purple-700 font-bold text-xs rounded-lg shadow-sm hover:bg-purple-50 transition border border-purple-200">
                          View Details & Enroll
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                
                {query.status === 'enrolled' && (
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg relative flex items-center justify-between">
                    <div>
                      <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider">Status</span>
                      <p className="text-sm font-bold text-navy mt-1 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> Enrolled Successfully</p>
                    </div>
                    <Link to="/student/rooms" className="px-5 py-2 bg-white text-navy border border-slate-200 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition">
                      Go to My Learning
                    </Link>
                  </div>
                )}

              </div>
            </div>
          ))
        )}
      </div>

      <TokenPurchaseModal 
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSuccess={handleTokenPurchaseSuccess}
        currentBalance={tokens}
      />
    </div>
  );
};

export default MyQueriesPage;
