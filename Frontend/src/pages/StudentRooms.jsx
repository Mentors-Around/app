import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Calendar, Bell, FileText, X, CheckCircle, ChevronDown, ChevronUp, Monitor, ArrowRight, BookOpen } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const StudentRooms = () => {
  const { user } = useAuth();
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [expandedRoomId, setExpandedRoomId] = useState(null);
  const [activeTab, setActiveTab] = useState('Schedules');

  // Doubts state
  const [doubts, setDoubts] = useState([]);
  const [showRaiseDoubt, setShowRaiseDoubt] = useState(false);
  const [doubtForm, setDoubtForm] = useState({ title: '', description: '', visibility: 'Public', image: null });
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    document.title = 'My Learning — TrueEd';
    window.scrollTo(0, 0);
    const savedRooms = localStorage.getItem('trueed_student_joined_rooms');
    if (savedRooms) setJoinedRooms(JSON.parse(savedRooms));

    const savedDoubts = localStorage.getItem('trueed_classroom_doubts');
    if (savedDoubts) setDoubts(JSON.parse(savedDoubts));
  }, []);

  useEffect(() => {
    localStorage.setItem('trueed_classroom_doubts', JSON.stringify(doubts));
  }, [doubts]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRaiseDoubtClick = (e) => {
    e.stopPropagation();
    setDoubtForm({ title: '', description: '', visibility: 'Public', image: null });
    setShowRaiseDoubt(true);
  };

  const handleSubmitDoubt = (e) => {
    e.preventDefault();
    if (!doubtForm.title || !doubtForm.description) return;

    const room = joinedRooms.find(r => r.id === expandedRoomId);
    
    const newDoubt = {
      id: 'DBT-' + Math.floor(Math.random() * 10000),
      studentName: user?.name || 'Guest Student',
      studentId: user?.id || 'student-1',
      classroomName: room.name,
      classroomId: room.id,
      subject: room.subject,
      classLevel: room.classLevel,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      visibility: doubtForm.visibility,
      title: doubtForm.title,
      description: doubtForm.description,
      image: doubtForm.image ? 'attached-image.jpg' : null,
      status: 'Pending',
      response: null
    };

    setDoubts([newDoubt, ...doubts]);
    setShowRaiseDoubt(false);
    showToast("Doubt submitted successfully");
  };

  const visibleDoubts = doubts.filter(d => 
    d.classroomId === expandedRoomId && 
    (d.visibility === 'Public' || d.studentId === (user?.id || 'student-1'))
  );

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6 relative">
      
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[100] animate-fade-in">
          <CheckCircle className="w-5 h-5 text-success" />
          {toastMessage}
        </div>
      )}

      <div>
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">My Learning</h1>
        <p className="text-slate-500 font-medium">Access your enrolled classrooms, schedules, and resources.</p>
      </div>

      {joinedRooms.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            <Monitor className="w-10 h-10" />
          </div>
          <h3 className="font-sora font-bold text-navy text-xl mb-3">You haven't enrolled in any classrooms yet</h3>
          <p className="text-muted text-sm mb-8 max-w-sm mx-auto">Discover top teachers and enroll in classrooms to start your learning journey.</p>
          <Link to="/student/discover" className="inline-block px-8 py-3.5 bg-navy text-white rounded-xl font-bold shadow-sm hover:shadow-md transition">
            Browse Classrooms
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {joinedRooms.map(room => (
            <div key={room.id} className="bg-white rounded-brand-xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* Classroom Header Card */}
              <div 
                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}
              >
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="text-[10px] font-bold text-sky bg-sky/10 px-2 py-0.5 rounded uppercase tracking-wider">{room.subject}</span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-wider">{room.classLevel || 'General'}</span>
                  </div>
                  <h3 className="font-sora font-bold text-xl text-navy mb-1">{room.name}</h3>
                  <p className="text-sm font-medium text-slate-500">by {room.teacher}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Class</p>
                    <p className="text-sm font-semibold text-navy">{room.scheduleDays?.[0] || 'TBD'} • {room.startTime || '--'}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    {expandedRoomId === room.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedRoomId === room.id && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                  {/* Tabs */}
                  <div className="flex border-b border-slate-200 px-6 overflow-x-auto hide-scrollbar">
                    {['Schedules', 'Doubts', 'Announcements', 'Resources'].map(tab => (
                      <button 
                        key={tab}
                        onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                        className={`py-4 px-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-navy' : 'text-slate-500 hover:text-navy'}`}
                      >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-navy rounded-t-full" />}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === 'Schedules' && (
                      <div>
                        <h4 className="font-bold text-navy mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400"/> Classroom Schedule</h4>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weekly Days</p>
                            <p className="font-semibold text-navy">{room.scheduleDays?.join(', ') || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Timing</p>
                            <p className="font-semibold text-navy">{room.startTime || '--'} to {room.endTime || '--'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mode</p>
                            <p className="font-semibold text-navy">{room.mode || 'Online'}</p>
                          </div>
                          <Link to={`/student/lobby/${room.id}`} className="px-5 py-2.5 bg-navy text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md hover:bg-navy-light transition flex items-center gap-2 shrink-0">
                            <BookOpen className="w-4 h-4" /> Enter Classroom
                          </Link>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Doubts' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-navy flex items-center gap-2"><MessageSquare className="w-4 h-4 text-slate-400"/> Classroom Doubts</h4>
                          <button onClick={handleRaiseDoubtClick} className="text-xs font-bold bg-sky text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sky-600 transition">
                            + Raise Doubt
                          </button>
                        </div>
                        
                        {visibleDoubts.length === 0 ? (
                          <div className="text-center py-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 font-medium text-sm">No doubts raised yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {visibleDoubts.map(doubt => (
                              <div key={doubt.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-navy text-sm">{doubt.studentName}</span>
                                    <span className="text-xs text-slate-400">• {doubt.date}</span>
                                    {doubt.visibility === 'Private' && <span className="text-[10px] font-bold bg-amber/10 text-amber px-2 py-0.5 rounded uppercase">Private</span>}
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${doubt.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {doubt.status}
                                  </span>
                                </div>
                                <h5 className="font-bold text-navy mb-1">{doubt.title}</h5>
                                <p className="text-sm text-slate-600 font-medium mb-3">{doubt.description}</p>
                                
                                {doubt.response && (
                                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg relative mt-4">
                                    <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider">Teacher Reply</span>
                                    <p className="text-sm font-medium text-navy mt-1">{doubt.response}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'Announcements' && (
                      <div>
                        <h4 className="font-bold text-navy mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-slate-400"/> Announcements</h4>
                        <div className="text-center py-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-slate-500 font-medium text-sm">No new announcements from the teacher.</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Resources' && (
                      <div>
                        <h4 className="font-bold text-navy mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400"/> Study Resources</h4>
                        <div className="text-center py-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-slate-500 font-medium text-sm">No resources uploaded yet.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Raise Doubt Modal */}
      {showRaiseDoubt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10 shrink-0">
              <div>
                <h2 className="text-xl font-sora font-bold text-navy flex items-center gap-2 mb-1">
                  Raise a Doubt
                </h2>
                <p className="text-xs font-bold text-slate-500">{joinedRooms.find(r=>r.id===expandedRoomId)?.name}</p>
              </div>
              <button onClick={() => setShowRaiseDoubt(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form id="doubtForm" onSubmit={handleSubmitDoubt} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title *</label>
                <input 
                  type="text" required
                  value={doubtForm.title} onChange={e => setDoubtForm({...doubtForm, title: e.target.value})}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-navy" 
                  placeholder="Short summary of doubt" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description *</label>
                <textarea 
                  required rows="4"
                  value={doubtForm.description} onChange={e => setDoubtForm({...doubtForm, description: e.target.value})}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-navy resize-none" 
                  placeholder="Explain your doubt in detail..." 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visibility</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setDoubtForm({...doubtForm, visibility: 'Public'})}
                    className={`border ${doubtForm.visibility === 'Public' ? 'border-navy bg-navy/5' : 'border-slate-200 hover:border-slate-300'} rounded-lg p-3 cursor-pointer transition`}
                  >
                    <p className="font-bold text-sm text-navy mb-1">Public Doubt</p>
                    <p className="text-xs text-slate-500">Visible to all students</p>
                  </div>
                  <div 
                    onClick={() => setDoubtForm({...doubtForm, visibility: 'Private'})}
                    className={`border ${doubtForm.visibility === 'Private' ? 'border-navy bg-navy/5' : 'border-slate-200 hover:border-slate-300'} rounded-lg p-3 cursor-pointer transition`}
                  >
                    <p className="font-bold text-sm text-navy mb-1">Private Doubt</p>
                    <p className="text-xs text-slate-500">Visible only to teacher</p>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setShowRaiseDoubt(false)} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-navy transition">
                Cancel
              </button>
              <button type="submit" form="doubtForm" className="px-6 py-2 bg-navy text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition">
                Submit Doubt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRooms;
