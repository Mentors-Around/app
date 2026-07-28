import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, CalendarDays, Users, IndianRupee, Play, Pause, CheckCircle, Plus } from 'lucide-react';
import api from '../services/api.js';

export default function TeacherClassroomDetails() {
  const { id } = useParams();

  const fallbackClassroom = {
    id,
    name: 'Loading...',
    subject: '',
    mode: 'Online',
    price: 0,
    capacity: 0,
    enrolled: 0,
    description: '',
    scheduleDays: [],
    startTime: '',
    endTime: '',
    schedule: '',
    rawSchedule: [],
    status: 'inactive',
    sessions: [],
    liveSettings: { meetingPlatform: 'Google Meet', meetingLink: '', accessTimeMinutes: 15 },
  };

  const [classroom, setClassroom] = useState(fallbackClassroom);
  const [isLoadingClassroom, setIsLoadingClassroom] = useState(true);

  // Load classroom from real API on mount
  useEffect(() => {
    document.title = `Classroom Details — TrueEd`;
    const fetchClassroom = async () => {
      setIsLoadingClassroom(true);
      try {
        const res = await api.classroom.getDetail(id);
        if (res) {
          const c = res.classroom || res;
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          // Deduplicate schedule days across slots
          const scheduleDays = Array.isArray(c.schedule)
            ? [...new Set(c.schedule.map(s => dayNames[s.day]).filter(Boolean))]
            : [];
          const firstSlot = c.schedule?.[0];
          setClassroom(prev => ({
            ...prev,
            id:          c._id || c.id || id,
            _id:         c._id || c.id || id,
            name:        c.title || c.name || 'Classroom',
            subject:     c.subject || '',
            mode:        c.mode ? (c.mode.charAt(0).toUpperCase() + c.mode.slice(1)) : 'Online',
            price:       c.feesPaise ? c.feesPaise / 100 : 0,
            capacity:    c.maxStudents || 0,
            enrolled:    c.stats?.enrolledStudents || 0,
            description: c.description || '',
            scheduleDays,
            startTime:   firstSlot?.startTime || '',
            endTime:     firstSlot?.endTime || '',
            schedule:    scheduleDays.length ? `${scheduleDays.join(', ')} (${firstSlot?.startTime || ''} - ${firstSlot?.endTime || ''})` : 'Flexible',
            rawSchedule: c.schedule || [],
            startDate:   c.startDate ? c.startDate.split('T')[0] : '',
            endDate:     c.endDate   ? c.endDate.split('T')[0]   : '',
            status:      c.status || 'active',
            classLevel:  c.academicLevel || '',
            stats:       c.stats || {},
            liveSettings: {
              meetingPlatform:    c.meetingPlatform || 'Google Meet',
              meetingLink:        c.gmeetLink || '',
              accessTimeMinutes:  c.accessTimeMinutes || 15,
              meetingId:          c.meetingId || '',
              meetingPassword:    c.meetingPassword || '',
            },
            sessions: c.sessions || prev.sessions || [],
          }));
          setLiveSettingsForm({
            meetingPlatform:   c.meetingPlatform || 'Google Meet',
            meetingLink:       c.gmeetLink || '',
            accessTimeMinutes: c.accessTimeMinutes || 15,
            meetingId:          c.meetingId || '',
            meetingPassword:    c.meetingPassword || '',
          });
        }
      } catch (err) {
        console.warn('Could not load classroom from API:', err.message);
        // Fallback: try localStorage
        const saved = localStorage.getItem('trueed_teacher_classrooms');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            const found = list.find(c => c.id?.toString() === id);
            if (found) {
              if (!found.sessions) found.sessions = [];
              if (!found.rawSchedule) found.rawSchedule = found.schedule || [];
              setClassroom(found);
              setLiveSettingsForm({
                meetingPlatform:   found.liveSettings?.meetingPlatform || 'Google Meet',
                meetingLink:       found.liveSettings?.meetingLink || '',
                accessTimeMinutes: found.liveSettings?.accessTimeMinutes || 15,
              });
            }
          } catch (e) {}
        }
      } finally {
        setIsLoadingClassroom(false);
      }
    };
    fetchClassroom();
  }, [id]);
  const [students, setStudents] = useState([]);

  const [toastMessage, setToastMessage] = useState(null);


  // Modals
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isLiveSettingsModalOpen, setIsLiveSettingsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Report State
  const [studentToReport, setStudentToReport] = useState(null);
  const [reportForm, setReportForm] = useState({ reason: '', description: '' });
  const [reportedStudentIds, setReportedStudentIds] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // Live Settings State
  const [liveSettingsForm, setLiveSettingsForm] = useState({
    meetingPlatform: classroom.liveSettings?.meetingPlatform || 'Google Meet',
    meetingLink: classroom.liveSettings?.meetingLink || '',
    accessTimeMinutes: classroom.liveSettings?.accessTimeMinutes || 15,
    meetingId: classroom.liveSettings?.meetingId || '',
    meetingPassword: classroom.liveSettings?.meetingPassword || ''
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
    topic: '', date: '', startTime: '', endTime: '', notes: '', sessionType: 'online'
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
    showToast('Classroom schedule updated successfully');
  };

  const handleSaveSession = (e) => {
    e.preventDefault();
    let updatedSessions = [];
    if (editingSessionId) {
      updatedSessions = classroom.sessions.map(s => s.id === editingSessionId ? {
        ...s,
        topic: sessionForm.topic,
        date: sessionForm.date,
        time: `${formatTime12hr(sessionForm.startTime)} - ${formatTime12hr(sessionForm.endTime)}`,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        notes: sessionForm.notes,
        sessionType: sessionForm.sessionType || 'online'
      } : s);
      setClassroom(p => ({
        ...p,
        sessions: updatedSessions
      }));
      showToast('Session updated successfully');
    } else {
      const newId = classroom.sessions.length > 0 ? Math.max(...classroom.sessions.map(s => s.id)) + 1 : 1;
      updatedSessions = [...classroom.sessions, {
        id: newId,
        topic: sessionForm.topic,
        date: sessionForm.date,
        time: `${formatTime12hr(sessionForm.startTime)} - ${formatTime12hr(sessionForm.endTime)}`,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        notes: sessionForm.notes,
        sessionType: sessionForm.sessionType || 'online'
      }];
      setClassroom(p => ({
        ...p,
        sessions: updatedSessions
      }));
      showToast('Session added successfully');
    }
    setIsSessionModalOpen(false);

    // Save to local storage for persistence
    const saved = localStorage.getItem('trueed_teacher_classrooms');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        const idx = list.findIndex(item => item.id?.toString() === classroom.id?.toString());
        if (idx !== -1) {
          list[idx].sessions = updatedSessions;
          localStorage.setItem('trueed_teacher_classrooms', JSON.stringify(list));
        }
      } catch (err) {}
    }

    // Save to backend database via API
    api.classroom.update(classroom.id || classroom._id, { sessions: updatedSessions })
      .then(() => showToast('Sessions synced to server ✓'))
      .catch(err => showToast(`Failed to sync to server: ${err.message}`));
  };

  const handleSaveLiveSettings = async (e) => {
    e.preventDefault();
    const updatedLiveSettings = { ...liveSettingsForm };
    try {
      // Persist gmeetLink to MongoDB via API — enrolled students will see this
      await api.classroom.update(classroom.id || classroom._id, {
        gmeetLink:         liveSettingsForm.meetingLink,
        meetingPlatform:   liveSettingsForm.meetingPlatform,
        accessTimeMinutes: liveSettingsForm.accessTimeMinutes,
        meetingId:         liveSettingsForm.meetingId,
        meetingPassword:   liveSettingsForm.meetingPassword,
      });
      setClassroom(p => ({ ...p, liveSettings: updatedLiveSettings }));
      setIsLiveSettingsModalOpen(false);
      showToast('Live class settings saved to database successfully ✓');
    } catch (err) {
      showToast(`Failed to save settings: ${err.message || 'Please try again'}`);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setReportedStudentIds([...reportedStudentIds, studentToReport.id]);
    showToast('Student report submitted successfully. Our team will review it.');
    setIsReportModalOpen(false);
    setReportForm({ reason: '', description: '' });
  };

  const openAddSessionModal = () => {
    setSessionForm({ topic: '', date: '', startTime: '', endTime: '', notes: '', sessionType: classroom.mode?.toLowerCase() === 'offline' ? 'offline' : 'online' });
    setEditingSessionId(null);
    setIsSessionModalOpen(true);
  };

  const openEditSessionModal = (session) => {
    setSessionForm({
      topic: session.topic,
      date: session.date,
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      notes: session.notes || '',
      sessionType: session.sessionType || (classroom.mode?.toLowerCase() === 'offline' ? 'offline' : 'online')
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

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || 'Monday';
  };
  const getShortDayName = (dayNum) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNum] || 'Mon';
  };

  const schedules = [];
  const scheduleSlots = classroom?.rawSchedule || [];
  
  const groups = {};
  scheduleSlots.forEach(slot => {
    const key = `${slot.startTime}-${slot.endTime}`;
    if (!groups[key]) {
      groups[key] = {
        startTime: slot.startTime,
        endTime: slot.endTime,
        days: [],
        dayNums: []
      };
    }
    groups[key].days.push(getShortDayName(slot.day));
    groups[key].dayNums.push(slot.day);
  });

  Object.values(groups).forEach((g, idx) => {
    schedules.push({
      id: idx,
      days: g.days,
      dayNums: g.dayNums,
      startTime: g.startTime,
      endTime: g.endTime
    });
  });

  let totalTeachingHoursVal = 0;
  let totalLecturesVal = 0;
  let sessionDurationContent = '-';

  if (classroom.startDate && classroom.endDate && schedules.length > 0) {
    const start = new Date(classroom.startDate);
    const end = new Date(classroom.endDate);
    if (start <= end) {
      schedules.forEach(sch => {
        if (sch.days.length > 0 && sch.startTime && sch.endTime) {
          const { hours: sessionHours } = getSessionDuration(sch.startTime, sch.endTime);
          const lectures = getExpectedLectures(classroom.startDate, classroom.endDate, sch.days);
          totalLecturesVal += lectures;
          totalTeachingHoursVal += (lectures * sessionHours);
        }
      });
    }

    const durationTexts = [];
    schedules.forEach(sch => {
      if (sch.days.length > 0 && sch.startTime && sch.endTime) {
        const { text } = getSessionDuration(sch.startTime, sch.endTime);
        if (text && text !== '-') {
          const daysText = `${sch.days.length} day${sch.days.length > 1 ? 's' : ''} per week`;
          durationTexts.push(`${text} (${daysText})`);
        }
      }
    });
    
    if (durationTexts.length === 1) {
      sessionDurationContent = durationTexts[0];
    } else if (durationTexts.length > 0) {
      sessionDurationContent = (
        <div className="flex flex-col gap-1">
          {durationTexts.map((text, idx) => <span key={idx} className="text-sm font-medium whitespace-nowrap">{text}</span>)}
        </div>
      );
    }
  }

  const expectedLecturesCount = schedules.length > 0 ? totalLecturesVal : '-';
  const totalTeachingHours = schedules.length > 0 && totalTeachingHoursVal > 0 ? `${totalTeachingHoursVal.toFixed(1)} Hours` : '-';

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
        <Link to={`/teacher/classrooms/${id}/students`} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-sky/30 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky/10 text-sky rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Class Capacity</p>
              <p className="font-sora font-extrabold text-2xl text-navy">{classroom.enrolled || students.length} <span className="text-sm text-slate-400 font-medium">/ {classroom.unlimitedStudents ? 'Unlimited' : classroom.capacity} Filled</span></p>
            </div>
          </div>
          <div className="text-sky font-bold text-sm group-hover:translate-x-1 transition-transform">
            View <i className="fa-solid fa-arrow-right ml-1"></i>
          </div>
        </Link>
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
            <p className="font-sora font-extrabold text-2xl text-navy">
              {classroom.stats?.attendanceRate !== undefined ? `${classroom.stats.attendanceRate}%` : '100%'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Main Column: Details & Schedule */}
        <div className="max-w-4xl space-y-8">
          
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
                <div className="font-sora font-bold text-navy text-lg">{sessionDurationContent}</div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Lectures</p>
                <p className="font-sora font-bold text-navy text-lg">{expectedLecturesCount}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Teaching</p>
                <p className="font-sora font-bold text-navy text-lg">{totalTeachingHours}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Price Per Student</p>
                <p className="font-sora font-bold text-navy text-lg">₹{classroom.price}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Schedule</p>
                {schedules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {schedules.map(sch => (
                      <div key={sch.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                        <p className="font-sora font-bold text-navy mb-1">{sch.days.join(', ')}</p>
                        <p className="text-sm text-slate-500 font-medium">
                          {formatTime12hr(sch.startTime)} – {formatTime12hr(sch.endTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-sora font-bold text-navy text-lg">TBD</p>
                )}
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
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-navy">{session.topic}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              (session.sessionType || (classroom.mode?.toLowerCase() === 'offline' ? 'offline' : 'online')) === 'online' 
                                ? 'bg-sky-50 text-sky-700' 
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {session.sessionType || (classroom.mode?.toLowerCase() === 'offline' ? 'offline' : 'online')}
                            </span>
                          </div>
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
                  <input required type="text" value={sessionForm.topic} onChange={e => setSessionForm({...sessionForm, topic: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" placeholder="e.g. Introduction & Basics, Algebra Part 1, or Chapter 1" />
                </div>
                
                {classroom.mode === 'Hybrid' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Session Mode</label>
                    <select 
                      value={sessionForm.sessionType} 
                      onChange={e => setSessionForm({...sessionForm, sessionType: e.target.value})} 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none bg-white"
                    >
                      <option value="online">Online Session</option>
                      <option value="offline">Offline Session</option>
                    </select>
                  </div>
                )}
                
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
                  required={liveSettingsForm.meetingPlatform === 'Google Meet'}
                  type="url"
                  placeholder={liveSettingsForm.meetingPlatform === 'Google Meet' ? "https://meet.google.com/..." : "https://..."}
                  value={liveSettingsForm.meetingLink}
                  onChange={e => setLiveSettingsForm({...liveSettingsForm, meetingLink: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none"
                />
              </div>
              {(liveSettingsForm.meetingPlatform === 'Zoom' || liveSettingsForm.meetingPlatform === 'Microsoft Teams') && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Meeting ID</label>
                    <input 
                      required={!liveSettingsForm.meetingLink}
                      type="text"
                      placeholder="Enter meeting ID"
                      value={liveSettingsForm.meetingId}
                      onChange={e => setLiveSettingsForm({...liveSettingsForm, meetingId: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Meeting Password / Passcode</label>
                    <input 
                      type="text"
                      placeholder="Enter meeting password (optional)"
                      value={liveSettingsForm.meetingPassword}
                      onChange={e => setLiveSettingsForm({...liveSettingsForm, meetingPassword: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none"
                    />
                  </div>
                </>
              )}
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

      {/* Report Student Modal */}
      {isReportModalOpen && studentToReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-sora font-bold text-navy">Report Student</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">Report inappropriate behaviour or issues related to this classroom.</p>
            
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Student</p>
                <p className="font-bold text-navy text-sm">{studentToReport.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Classroom</p>
                <p className="font-bold text-navy text-sm truncate max-w-[120px]" title={classroom.name}>{classroom.name}</p>
              </div>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Reason <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={reportForm.reason}
                  onChange={e => setReportForm({...reportForm, reason: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none font-medium text-slate-700 bg-white"
                >
                  <option value="" disabled>Select a reason...</option>
                  <option value="Misconduct">Misconduct</option>
                  <option value="Disruptive Behaviour">Disruptive Behaviour</option>
                  <option value="Inappropriate Language">Inappropriate Language</option>
                  <option value="Academic Dishonesty">Academic Dishonesty</option>
                  <option value="Spam / Misuse">Spam / Misuse</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Description <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Describe what happened and provide any relevant details."
                  value={reportForm.description}
                  onChange={e => setReportForm({...reportForm, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-navy outline-none resize-none font-medium text-slate-700"
                ></textarea>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition shadow-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition shadow-sm">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
