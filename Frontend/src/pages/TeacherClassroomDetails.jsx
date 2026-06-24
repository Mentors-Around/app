import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, CalendarDays, Users, IndianRupee, Play, Pause, CheckCircle, Plus } from 'lucide-react';

export default function TeacherClassroomDetails() {
  const { id } = useParams();
  
  useEffect(() => {
    document.title = `Classroom Details — TrueEd`;
  }, []);

  const [classrooms, setClassrooms] = useState(() => {
    const saved = localStorage.getItem('trueed_teacher_classrooms');
    return saved ? JSON.parse(saved) : [];
  });

  const [classroom, setClassroom] = useState(() => {
    const found = classrooms.find(c => c.id.toString() === id);
    if (found) {
      if (!found.sessions) found.sessions = [];
      return found;
    }
    // Fallback if not found
    return {
      id,
      name: 'Classroom Not Found',
      subject: 'Unknown',
      mode: 'Online',
      price: 0,
      capacity: 0,
      enrolled: 0,
      description: 'Please go back and select a valid classroom.',
      scheduleDays: [],
      startTime: '',
      endTime: '',
      schedule: '',
      status: 'inactive',
      sessions: []
    };
  });

  useEffect(() => {
    if (classroom.name !== 'Classroom Not Found') {
      const updatedClassrooms = classrooms.map(c => c.id.toString() === id ? classroom : c);
      setClassrooms(updatedClassrooms);
      localStorage.setItem('trueed_teacher_classrooms', JSON.stringify(updatedClassrooms));
    }
  }, [classroom]); // Sync classroom state with local storage

  const [students] = useState([
    { id: 1, name: 'Aarav Sharma', initials: 'AS', joinedDate: 'Oct 10, 2026', attendance: '95%' },
    { id: 2, name: 'Priya Patel', initials: 'PP', joinedDate: 'Oct 12, 2026', attendance: '88%' },
    { id: 3, name: 'Rohan Gupta', initials: 'RG', joinedDate: 'Oct 15, 2026', attendance: '100%' },
  ]);

  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isLiveSettingsModalOpen, setIsLiveSettingsModalOpen] = useState(false);
  
  // Live Settings State
  const [liveSettingsForm, setLiveSettingsForm] = useState({
    meetingPlatform: classroom.liveSettings?.meetingPlatform || 'Google Meet',
    meetingLink: classroom.liveSettings?.meetingLink || '',
    accessTimeMinutes: classroom.liveSettings?.accessTimeMinutes || 15
  });
  
  // Price Edit State
  const [editPrice, setEditPrice] = useState(classroom.price);
  
  // Schedule Edit State
  const [editSchedule, setEditSchedule] = useState({
    days: [...(classroom.scheduleDays || [])],
    startTime: classroom.startTime || '',
    endTime: classroom.endTime || '',
  });

  // Session Edit State
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    topic: '', date: '', startTime: '', endTime: '', notes: ''
  });

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const estimatedMonthlyRevenue = editPrice * students.length * 12; // Assuming ~12 sessions a month for MWF

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSavePrice = () => {
    setClassroom(p => ({ ...p, price: Number(editPrice) }));
    setIsPriceModalOpen(false);
    showToast('Classroom price updated successfully');
  };

  const handleSaveSchedule = () => {
    const daysStr = editSchedule.days.join(', ') || 'TBD';
    const timeStr = (editSchedule.startTime && editSchedule.endTime) ? `(${formatTime12hr(editSchedule.startTime)} - ${formatTime12hr(editSchedule.endTime)})` : '';
    
    setClassroom(p => ({ 
      ...p, 
      scheduleDays: editSchedule.days, 
      startTime: editSchedule.startTime, 
      endTime: editSchedule.endTime,
      schedule: `${daysStr} ${timeStr}`.trim()
    }));
    setIsScheduleModalOpen(false);
    showToast('Schedule updated successfully');
  };

  const handleSaveSession = (e) => {
    e.preventDefault();
    if (editingSessionId) {
      setClassroom(p => ({
        ...p,
        sessions: p.sessions.map(s => s.id === editingSessionId ? {
          ...s,
          topic: sessionForm.topic,
          date: sessionForm.date,
          time: `${formatTime12hr(sessionForm.startTime)} - ${formatTime12hr(sessionForm.endTime)}`,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime,
          notes: sessionForm.notes
        } : s)
      }));
      showToast('Session updated successfully');
    } else {
      const newId = classroom.sessions.length > 0 ? Math.max(...classroom.sessions.map(s => s.id)) + 1 : 1;
      setClassroom(p => ({
        ...p,
        sessions: [...p.sessions, {
          id: newId,
          topic: sessionForm.topic,
          date: sessionForm.date,
          time: `${formatTime12hr(sessionForm.startTime)} - ${formatTime12hr(sessionForm.endTime)}`,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime,
          notes: sessionForm.notes
        }]
      }));
      showToast('Session added successfully');
    }
    setIsSessionModalOpen(false);
  };

  const handleSaveLiveSettings = (e) => {
    e.preventDefault();
    const updatedLiveSettings = { ...liveSettingsForm };
    setClassroom(p => ({
      ...p,
      liveSettings: updatedLiveSettings
    }));
    
    // Save to localStorage immediately
    const saved = localStorage.getItem('trueed_teacher_classrooms');
    if (saved) {
      let teacherClassrooms = JSON.parse(saved);
      teacherClassrooms = teacherClassrooms.map(c => c.id === classroom.id ? { ...c, liveSettings: updatedLiveSettings } : c);
      localStorage.setItem('trueed_teacher_classrooms', JSON.stringify(teacherClassrooms));
    }
    
    setIsLiveSettingsModalOpen(false);
    showToast('Live class settings updated successfully');
  };

  const openAddSessionModal = () => {
    setSessionForm({ topic: '', date: '', startTime: '', endTime: '', notes: '' });
    setEditingSessionId(null);
    setIsSessionModalOpen(true);
  };

  const openEditSessionModal = (session) => {
    setSessionForm({
      topic: session.topic,
      date: session.date,
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      notes: session.notes || ''
    });
    setEditingSessionId(session.id);
    setIsSessionModalOpen(true);
  };

  const toggleScheduleDay = (day) => {
    setEditSchedule(p => ({
      ...p,
      days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day]
    }));
  };

  const togglePause = () => {
    setClassroom(p => ({ ...p, status: p.status === 'active' ? 'paused' : 'active' }));
    showToast('Classroom status updated');
  };

  const formatTime12hr = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return { month: 'TBD', day: 'TBD' };
    try {
      const d = new Date(dateString);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        day: d.toLocaleDateString('en-US', { day: 'numeric' })
      };
    } catch {
      return { month: 'TBD', day: 'TBD' };
    }
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':');
    return parseInt(h, 10) + parseInt(m, 10) / 60;
  };

  const getSessionDuration = (start, end) => {
    if (!start || !end) return { hours: 0, text: '-' };
    let diff = parseTime(end) - parseTime(start);
    if (diff < 0) diff += 24; 
    const h = Math.floor(diff);
    const m = Math.round((diff - h) * 60);
    let text = '';
    if (h > 0) text += `${h} Hour${h > 1 ? 's' : ''} `;
    if (m > 0) text += `${m} Minute${m > 1 ? 's' : ''}`;
    if (!text) return { hours: 0, text: '-' };
    return { hours: diff, text: text.trim() };
  };

  const getExpectedLectures = (startDate, endDate, scheduleDays) => {
    if (!startDate || !endDate || !scheduleDays || scheduleDays.length === 0) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;

    let count = 0;
    const current = new Date(start);
    const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const validDays = scheduleDays.map(d => dayMap[d]);

    while (current <= end) {
      if (validDays.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const { hours: sessionHours, text: sessionDurationText } = getSessionDuration(classroom.startTime, classroom.endTime);
  const expectedLecturesCount = getExpectedLectures(classroom.startDate, classroom.endDate, classroom.scheduleDays);
  const totalTeachingHours = (expectedLecturesCount * sessionHours).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      <Link to="/teacher/classrooms" className="inline-flex items-center gap-2 text-slate-500 hover:text-navy font-bold transition mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Classrooms
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-sora text-3xl font-bold text-navy">{classroom.name}</h1>
            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${classroom.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {classroom.status}
            </span>
          </div>
          <p className="text-slate-500 font-medium">{classroom.subject} • {classroom.mode}</p>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky/10 text-sky rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Students</p>
            <p className="font-sora font-extrabold text-2xl text-navy">{classroom.enrolled || students.length} <span className="text-sm text-slate-400 font-medium">/ {classroom.unlimitedStudents ? 'Unlimited' : classroom.capacity}</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="font-sora font-extrabold text-2xl text-navy">₹{classroom.price * (classroom.enrolled || students.length)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0">
            <i className="fa-solid fa-chart-line text-xl" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Attendance Rate</p>
            <p className="font-sora font-extrabold text-2xl text-navy">94%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Schedule */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-sky"></i> Classroom Information
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-6">
              {classroom.description}
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Class / Level</p>
                <p className="font-sora font-bold text-navy text-lg">{classroom.classLevel || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                <p className="font-sora font-bold text-navy text-lg">{classroom.unlimitedStudents ? 'Unlimited Seats' : classroom.capacity}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Session Duration</p>
                <p className="font-sora font-bold text-navy text-lg">{sessionDurationText}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Lectures</p>
                <p className="font-sora font-bold text-navy text-lg">{expectedLecturesCount}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Teaching</p>
                <p className="font-sora font-bold text-navy text-lg">{totalTeachingHours > 0 ? `${totalTeachingHours} Hours` : '-'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Price Per Student</p>
                <div className="flex items-center gap-3">
                  <p className="font-sora font-bold text-navy text-lg">₹{classroom.price}</p>
                  <button 
                    onClick={() => { setEditPrice(classroom.price); setIsPriceModalOpen(true); }} 
                    className="text-sky hover:text-navy transition text-sm font-bold flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Schedule</p>
                <div className="flex items-center gap-3">
                  <p className="font-sora font-bold text-navy text-lg">{(classroom.scheduleDays || []).join(', ') || 'TBD'}</p>
                  <button 
                    onClick={() => {
                      setEditSchedule({
                        days: [...(classroom.scheduleDays || [])],
                        startTime: classroom.startTime || '',
                        endTime: classroom.endTime || '',
                      });
                      setIsScheduleModalOpen(true);
                    }} 
                    className="text-sky hover:text-navy transition text-sm font-bold flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <p className="text-sm text-slate-500">{formatTime12hr(classroom.startTime)} - {formatTime12hr(classroom.endTime)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky/5 rounded-bl-full -z-10"></div>
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
                <i className="fa-solid fa-video text-sky"></i> Live Class Settings
              </h2>
              <button 
                onClick={() => setIsLiveSettingsModalOpen(true)}
                className="text-sky hover:text-navy transition text-sm font-bold flex items-center gap-1 bg-sky/10 px-3 py-1.5 rounded-lg"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Settings
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Platform</p>
                <p className="font-sora font-bold text-navy">{classroom.liveSettings?.meetingPlatform || 'Not Configured'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Meeting Link</p>
                <p className="font-sora font-bold text-navy truncate">
                  {classroom.liveSettings?.meetingLink ? '••••••••••••••••' : 'Not Configured'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Access Opens</p>
                <p className="font-sora font-bold text-navy">{classroom.liveSettings?.accessTimeMinutes || 15} minutes before class</p>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3 items-start mt-2">
              <i className="fa-solid fa-shield-halved text-amber-600 mt-0.5"></i>
              <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                Students will never see the actual meeting link. TrueEd securely manages classroom access to prevent unauthorized entry.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
                <i className="fa-solid fa-calendar-day text-amber-500"></i> Upcoming Sessions
              </h2>
              <button 
                onClick={openAddSessionModal}
                className="flex items-center gap-1.5 bg-navy text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-navy-light transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Session
              </button>
            </div>
            
            <div className="space-y-4">
              {classroom.sessions.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No sessions scheduled yet.</p>
              ) : (
                classroom.sessions.map(session => {
                  const dateDisplay = formatDateDisplay(session.date);
                  return (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold uppercase">{dateDisplay.month}</span>
                          <span className="text-lg font-extrabold leading-none">{dateDisplay.day}</span>
                        </div>
                        <div>
                          <p className="font-bold text-navy mb-0.5">{session.topic}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {session.time}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => openEditSessionModal(session)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:text-navy hover:border-navy transition shadow-sm shrink-0"
                      >
                        Edit Topic
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Students */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
              <i className="fa-solid fa-users text-emerald-500"></i> Enrolled Students
            </h2>
            <div className="space-y-4">
              {students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                      {student.initials}
                    </div>
                    <div>
                      <p className="font-bold text-navy text-sm">{student.name}</p>
                      <p className="text-xs text-slate-500">Joined {student.joinedDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase">Attendance</p>
                    <p className="text-sm font-bold text-emerald-600">{student.attendance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Edit Price Modal */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-sora font-bold text-navy mb-2">Update Classroom Pricing</h3>
            <p className="text-sm text-slate-500 mb-6">Students will pay this amount per session.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Price Per Student (₹)</label>
              <input 
                type="number" 
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none text-lg font-bold text-navy" 
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Estimated Monthly Revenue</p>
              <p className="font-sora font-bold text-2xl text-emerald-600">₹{estimatedMonthlyRevenue}</p>
              <p className="text-xs text-emerald-600/70 mt-1">Based on {students.length} students & ~12 sessions/mo</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsPriceModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Cancel</button>
              <button onClick={handleSavePrice} className="flex-1 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-lg transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-sora font-bold text-navy">Update Classroom Schedule</h3>
              <button 
                onClick={togglePause}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition ${classroom.status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
              >
                {classroom.status === 'active' ? <><Pause className="w-4 h-4"/> Pause Schedule</> : <><Play className="w-4 h-4"/> Resume Schedule</>}
              </button>
            </div>
            
            <div className="space-y-6 opacity-100 transition-opacity" style={{ opacity: classroom.status === 'paused' ? 0.5 : 1, pointerEvents: classroom.status === 'paused' ? 'none' : 'auto' }}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button 
                      key={day} 
                      onClick={() => toggleScheduleDay(day)}
                      className={`px-3 py-1.5 rounded-md text-sm font-bold transition border ${editSchedule.days.includes(day) ? 'bg-sky/10 text-sky border-sky/30' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Start Time</label>
                  <input type="time" value={editSchedule.startTime} onChange={e => setEditSchedule({...editSchedule, startTime: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">End Time</label>
                  <input type="time" value={editSchedule.endTime} onChange={e => setEditSchedule({...editSchedule, endTime: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                </div>
              </div>

              {/* Weekly Preview Simulation */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Calendar Preview</p>
                <div className="space-y-2">
                  {editSchedule.days.map(day => (
                    <div key={day} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-600 w-12">{day}</span>
                      <span className="text-navy font-medium bg-white px-2 py-1 rounded border border-slate-200">{formatTime12hr(editSchedule.startTime)} - {formatTime12hr(editSchedule.endTime)}</span>
                    </div>
                  ))}
                  {editSchedule.days.length === 0 && <p className="text-sm text-slate-400 italic">No days selected</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
              <button onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Cancel</button>
              <button onClick={handleSaveSchedule} disabled={classroom.status === 'paused'} className="flex-1 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-lg transition disabled:opacity-50">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Session Edit/Add Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            
            {/* Header - Fixed */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-sora font-bold text-navy">{editingSessionId ? 'Edit Session Topic' : 'Add Session'}</h2>
              <button onClick={() => setIsSessionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            {/* Body - Scrollable */}
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSaveSession} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Topic Name</label>
                  <input required type="text" value={sessionForm.topic} onChange={e => setSessionForm({...sessionForm, topic: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" placeholder="e.g. Thermodynamics Part 1" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Session Date</label>
                  <input required type="date" value={sessionForm.date} onChange={e => setSessionForm({...sessionForm, date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Start Time</label>
                    <input required type="time" value={sessionForm.startTime} onChange={e => setSessionForm({...sessionForm, startTime: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">End Time</label>
                    <input required type="time" value={sessionForm.endTime} onChange={e => setSessionForm({...sessionForm, endTime: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Notes (Optional)</label>
                  <textarea value={sessionForm.notes} onChange={e => setSessionForm({...sessionForm, notes: e.target.value})} rows="3" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none resize-none" placeholder="Any preparation notes for students?"></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsSessionModalOpen(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-lg transition shadow-sm">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Live Settings Modal */}
      {isLiveSettingsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-sora font-bold text-navy mb-4">Live Class Settings</h3>
            <form onSubmit={handleSaveLiveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Meeting Platform</label>
                <select 
                  value={liveSettingsForm.meetingPlatform}
                  onChange={e => setLiveSettingsForm({...liveSettingsForm, meetingPlatform: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Meeting Link</label>
                <input 
                  required
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={liveSettingsForm.meetingLink}
                  onChange={e => setLiveSettingsForm({...liveSettingsForm, meetingLink: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Session Access Time</label>
                <select 
                  value={liveSettingsForm.accessTimeMinutes}
                  onChange={e => setLiveSettingsForm({...liveSettingsForm, accessTimeMinutes: parseInt(e.target.value)})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none"
                >
                  <option value={5}>5 minutes before class starts</option>
                  <option value={10}>10 minutes before class starts</option>
                  <option value={15}>15 minutes before class starts</option>
                  <option value={30}>30 minutes before class starts</option>
                </select>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsLiveSettingsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-lg transition">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
