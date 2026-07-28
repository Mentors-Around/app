import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  ArrowLeft, Video, Clock, ShieldCheck, AlertCircle, FileText,
  Megaphone, Calendar, Monitor, Users, CheckCircle, ListChecks,
  BookOpen, MapPin, Loader2, Pin, ChevronRight,
} from 'lucide-react';

// ── Day number → name (JS getDay: 0=Sun, 1=Mon ... 6=Sat) ─────────────────────
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Compute the next N upcoming sessions from a schedule array
const getUpcomingSessions = (schedule, n = 3) => {
  if (!schedule || schedule.length === 0) return [];
  const today = new Date();
  const todayDay = today.getDay(); // 0-6
  const sessions = [];
  for (let offset = 0; offset < 14; offset++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offset);
    const targetDay = targetDate.getDay();
    const slot = schedule.find(s => Number(s.day) === targetDay);
    if (slot) {
      sessions.push({
        date: targetDate,
        day: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : DAY_NAMES[targetDay],
        dateLabel: targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isToday: offset === 0,
      });
      if (sessions.length >= n) break;
    }
  }
  return sessions;
};

// ── Material type → display config ─────────────────────────────────────────────
const MATERIAL_CONFIG = {
  pdf:          { label: 'PDF Notes',           icon: <FileText className="w-5 h-5" />,  color: 'bg-red-50 text-red-600 border-red-100' },
  presentation: { label: 'Presentation Slides', icon: <Monitor className="w-5 h-5" />,   color: 'bg-amber-50 text-amber-600 border-amber-100' },
  assignment:   { label: 'Assignments',          icon: <ListChecks className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  reference:    { label: 'Reference Material',   icon: <BookOpen className="w-5 h-5" />,  color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  other:        { label: 'Other Files',          icon: <FileText className="w-5 h-5" />,  color: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const ClassroomLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [classroom, setClassroom] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ state: 'loading', message: '' });
  const [joinUrl, setJoinUrl] = useState('');
  const [meetingInstructions, setMeetingInstructions] = useState(null);
  const [showAddress, setShowAddress] = useState(false);

  // Resource sections from API
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [studentProgress, setStudentProgress] = useState(null);
  const [loadingResources, setLoadingResources] = useState(true);

  useEffect(() => {
    document.title = "Classroom Lobby — TrueEd";

    if (!user) {
      setError("You must be logged in to join this classroom.");
      setStatus({ state: 'unauthorized', message: 'Please log in to continue.' });
      return;
    }

    const fetchClassroom = async () => {
      try {
        const res = await api.classroom.getDetail(id);
        if (!res || !res.classroom) {
          throw new Error("Classroom not found");
        }

        const c = res.classroom;
        const enrollmentStatus = res.enrollmentStatus;

        const isAuthorized = enrollmentStatus === 'enrolled' || enrollmentStatus === 'teacher_owner';
        if (!isAuthorized) {
          setError("You are not authorized to join this classroom. Please enroll first.");
          setStatus({ state: 'unauthorized', message: 'You are not enrolled in this classroom.' });
          return;
        }

        // Save student progress from enrollment data
        if (res.studentProgress) {
          setStudentProgress(res.studentProgress);
        }

        const mappedRoom = {
          ...c,
          id: c._id || c.id,
          name: c.title || c.name,
          teacher: c.teacherId?.name || c.teacher || 'Teacher',
          liveSettings: {
            meetingLink: c.gmeetLink || '',
            accessTimeMinutes: c.accessTimeMinutes || 15,
          },
        };

        // Find today's schedule slot
        const todayDay = new Date().getDay();
        const todaySlot = c.schedule?.find(slot => Number(slot.day) === todayDay);
        if (todaySlot) {
          mappedRoom.startTime = todaySlot.startTime;
          mappedRoom.endTime = todaySlot.endTime;
          if (todaySlot.gmeetLink) {
            mappedRoom.liveSettings.meetingLink = todaySlot.gmeetLink;
          }
        } else if (c.schedule && c.schedule.length > 0) {
          // Show next scheduled slot's time
          const upcoming = getUpcomingSessions(c.schedule, 1);
          if (upcoming.length > 0) {
            mappedRoom.startTime = upcoming[0].startTime;
            mappedRoom.endTime = upcoming[0].endTime;
          }
        }

        setClassroom(mappedRoom);
        setJoinUrl(mappedRoom.liveSettings.meetingLink);

        // Time check logic
        const checkTime = () => {
          const now = new Date();
          const isOffline = c.mode === 'offline';
          const isHybrid = c.mode === 'hybrid';

          // Timezone-safe local date calculation
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const todayStr = `${year}-${month}-${day}`;

          const todaySession = (c.sessions || []).find(s => s.date === todayStr);

          if (todaySession) {
            mappedRoom.startTime = todaySession.startTime;
            mappedRoom.endTime = todaySession.endTime;
            if (todaySession.gmeetLink) {
              mappedRoom.liveSettings.meetingLink = todaySession.gmeetLink;
              setJoinUrl(todaySession.gmeetLink);
            }
            setClassroom({ ...mappedRoom });

            const parseTimeToDate = (timeStr) => {
              const d = new Date();
              const [h, m] = timeStr.split(':');
              d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
              return d;
            };

            const startDate = parseTimeToDate(todaySession.startTime);
            const endDate = parseTimeToDate(todaySession.endTime);
            const accessMinutes = c.accessTimeMinutes || 15;
            const accessTime = new Date(startDate.getTime() - accessMinutes * 60000);
            const isOfflineSession = todaySession.sessionType === 'offline';

            if (now > endDate) {
              setStatus({ state: 'ended', message: 'Session completed for today.', currentSession: todaySession });
            } else if (now < accessTime) {
              const diffMs = accessTime - now;
              const diffMins = Math.ceil(diffMs / 60000);
              const hrs = Math.floor(diffMins / 60);
              const mins = diffMins % 60;
              const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
              setStatus({ state: 'waiting', message: `Opens in ${timeStr}`, currentSession: todaySession });
            } else {
              setStatus({
                state: isOfflineSession ? 'offline_active' : 'active',
                message: isOfflineSession ? 'Offline Session Ongoing' : 'Session is Live',
                currentSession: todaySession
              });
            }
            return;
          }

          if (isOffline) {
            setStatus({ state: 'offline', message: 'Offline Classroom' });
            return;
          }

          if (isHybrid) {
            setStatus({ state: 'no_class_today', message: 'No session scheduled today.' });
            return;
          }
          
          if (!mappedRoom.startTime || !mappedRoom.endTime || !todaySlot) {
            // No class today
            setStatus({ state: 'no_class_today', message: 'No class scheduled today.' });
            return;
          }

          const parseTimeToDate = (timeStr) => {
            const d = new Date();
            if (!timeStr || typeof timeStr !== 'string') return d;
            const parts = timeStr.split(':');
            if (parts.length < 2) return d;
            const [h, m] = parts;
            d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
            return d;
          };

          const startDate = parseTimeToDate(mappedRoom.startTime);
          const endDate = parseTimeToDate(mappedRoom.endTime);
          const accessMinutes = mappedRoom.liveSettings.accessTimeMinutes || 15;
          const accessTime = new Date(startDate.getTime() - accessMinutes * 60000);

          if (now > endDate) {
            setStatus({ state: 'ended', message: 'Session completed for today.' });
          } else if (now < accessTime) {
            const diffMs = accessTime - now;
            const diffMins = Math.ceil(diffMs / 60000);
            const hrs = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min${mins > 1 ? 's' : ''}`;
            setStatus({ state: 'waiting', message: `Join opens in ${timeStr}` });
          } else {
            setStatus({ state: 'active', message: 'Session is Live' });
          }
        };

        checkTime();
        const interval = setInterval(checkTime, 30000);
        return interval;
      } catch (err) {
        console.error('Failed to load classroom details from API:', err);
        setError('Could not load classroom details. Please check your connection and try again.');
        setStatus({ state: 'unauthorized', message: 'Failed to load classroom.' });
      }
    };

    let intervalId;
    fetchClassroom().then(id_ => {
      if (id_) intervalId = id_;
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, user]);

  // Fetch materials & announcements once classroom is loaded
  useEffect(() => {
    if (!classroom) return;
    const fetchResources = async () => {
      try {
        const [mRes, aRes] = await Promise.allSettled([
          api.classroom.getMaterials(id),
          api.classroom.getAnnouncements(id),
        ]);
        if (mRes.status === 'fulfilled') {
          const mData = mRes.value;
          const mList = Array.isArray(mData)
            ? mData
            : (mData?.docs || mData?.results || mData?.materials || []);
          setMaterials(mList);
        }
        if (aRes.status === 'fulfilled') {
          const aData = aRes.value;
          const aList = Array.isArray(aData)
            ? aData
            : (aData?.docs || aData?.results || aData?.announcements || []);
          setAnnouncements(aList);
        }
      } catch (err) {
        console.warn('Failed to fetch resources:', err);
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, [id, user, classroom]);

  const [isJoining, setIsJoining] = useState(false);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  const currentSession = status.currentSession;
  const isSessionOffline = classroom?.mode === 'offline' || (classroom?.mode === 'hybrid' && currentSession?.sessionType === 'offline');

  const handleMarkAttendance = async () => {
    setMarkingAttendance(true);
    try {
      await api.classroom.joinClass(id);
      setAttendanceMarked(true);
      alert(`Attendance recorded successfully ✓\nVenue: ${classroom.offlineFacility?.address || 'Classroom Facility'}`);
    } catch (err) {
      alert(`Failed to mark attendance: ${err.message}`);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const formatJoinUrl = (url) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSecureJoin = async () => {
    if (status.state !== 'active' && status.state !== 'offline_active') return;
    setIsJoining(true);
    try {
      const joinRes = await api.classroom.joinClass(id);
      setAttendanceMarked(true);

      if (isSessionOffline) {
        setOfflineModalOpen(true);
        setIsJoining(false);
        return;
      }

      const link = joinRes?.meetingLink;
      const platform = joinRes?.meetingPlatform || 'Google Meet';
      const meetingId = joinRes?.meetingId;
      const meetingPassword = joinRes?.meetingPassword;

      if (link && (link.startsWith('http') || link.includes('.'))) {
        window.open(formatJoinUrl(link), '_blank', 'noopener,noreferrer');
      } else if (meetingId) {
        setMeetingInstructions({
          platform,
          meetingId,
          meetingPassword
        });
      } else if (joinUrl && (joinUrl.startsWith('http') || joinUrl.includes('.'))) {
        window.open(formatJoinUrl(joinUrl), '_blank', 'noopener,noreferrer');
      } else {
        setError('No meeting link or credentials configured. Please ask your teacher to add one in classroom settings.');
      }
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        setError('You are not authorized to join this class.');
        setStatus({ state: 'unauthorized', message: 'Not enrolled.' });
      } else if (!isSessionOffline && joinUrl && (joinUrl.startsWith('http') || joinUrl.includes('.'))) {
        window.open(formatJoinUrl(joinUrl), '_blank', 'noopener,noreferrer');
      } else {
        setError(`Failed to join: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const formatTime12hr = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  // Compute upcoming sessions from schedule
  const upcomingSessions = useMemo(
    () => (classroom?.schedule ? getUpcomingSessions(classroom.schedule, 4) : []),
    [classroom]
  );

  // Group materials by type
  const materialsByType = useMemo(() => {
    const groups = {};
    materials.forEach(m => {
      const type = m.type || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(m);
    });
    return groups;
  }, [materials]);

  // ── Error / unauthorized state ─────────────────────────────────────────────
  if (error || status.state === 'unauthorized') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAFBFC] p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-sora font-bold text-navy mb-2">Access Denied</h2>
          <p className="text-slate-600 font-medium mb-8">{error}</p>
          <Link to="/student/rooms" className="block w-full py-3 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition">
            Back to My Learning
          </Link>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-sky" />
          <p className="font-bold text-sm">Loading Classroom...</p>
        </div>
      </div>
    );
  }

  const isOffline = classroom.mode === 'offline';
  const todayHasClass = upcomingSessions.length > 0 && upcomingSessions[0].isToday;

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24 font-inter">
      {/* Top Hero Banner */}
      <div className="bg-navy pt-8 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/student/rooms" className="inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold transition mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Classrooms
          </Link>
          <div className="flex items-center gap-3 mb-4">
            {isOffline ? (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-100 rounded-lg text-xs font-bold uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Offline Classroom
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-500/20 text-red-100 rounded-lg text-xs font-bold uppercase tracking-widest border border-red-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                Live Classroom
              </span>
            )}
            <span className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest border border-white/10">
              {classroom.subject}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-sora font-extrabold text-white tracking-tight mb-4 leading-tight">
            {classroom.name}
          </h1>
          <p className="text-lg text-sky-100 font-medium flex items-center gap-2">
            <Users className="w-5 h-5 opacity-70" />
            Teacher: {classroom.teacher}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 -mt-20 space-y-8">
        
        {/* Session Access Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-navy/5 border border-slate-100 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky to-blue-600"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-100 pb-8 mb-8">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Today's Session</p>
              <div className="flex items-center gap-3 text-3xl font-sora font-extrabold text-navy">
                <Clock className="w-7 h-7 text-sky" />
                {todayHasClass
                  ? `${formatTime12hr(upcomingSessions[0].startTime)} – ${formatTime12hr(upcomingSessions[0].endTime)}`
                  : classroom.startTime
                    ? `${formatTime12hr(classroom.startTime)} – ${formatTime12hr(classroom.endTime)}`
                    : 'No class today'}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[300px]">
              {/* ── Offline class OR Offline Session in Hybrid ── */}
              {(isOffline || isSessionOffline) && (
                <div className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-amber-700 font-bold text-sm">
                    <MapPin className="w-5 h-5" /> Offline Session
                  </div>
                  
                  {/* Show Address button - toggles address details */}
                  <button
                    type="button"
                    onClick={() => setShowAddress(!showAddress)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition"
                  >
                    {showAddress ? 'Hide Address' : 'Show Address'}
                  </button>

                  {showAddress && (
                    <div className="p-3 bg-white border border-amber-200 rounded-xl text-xs text-amber-900 font-bold animate-fade-in text-left">
                      📍 Venue Address: {classroom.offlineFacility?.address || 'Check with your teacher for the venue address.'}
                    </div>
                  )}

                  {/* I'm in the class button - appears 15 minutes prior to class timing */}
                  {(status.state === 'offline_active' || status.state === 'active') && !attendanceMarked && (
                    <button
                      type="button"
                      onClick={handleMarkAttendance}
                      disabled={markingAttendance}
                      className="w-full py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl text-xs transition"
                    >
                      {markingAttendance ? 'Marking...' : "I'm in the class"}
                    </button>
                  )}
                  {attendanceMarked && (
                    <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Present / Attending recorded ✓
                    </div>
                  )}
                </div>
              )}

              {/* ── No class today ── */}
              {!isOffline && !isSessionOffline && status.state === 'no_class_today' && (
                <div className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-2xl flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  No class scheduled today
                </div>
              )}

              {/* ── Waiting for access time ── */}
              {!isOffline && !isSessionOffline && status.state === 'waiting' && (
                <button disabled className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <Clock className="w-5 h-5 text-slate-400" />
                  {status.message}
                </button>
              )}

              {/* ── Active — can join online ── */}
              {!isOffline && !isSessionOffline && status.state === 'active' && (
                <>
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-success mb-1">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span> Session Live Now
                  </div>
                  <button
                    onClick={handleSecureJoin}
                    disabled={isJoining}
                    className="w-full py-4 bg-navy hover:bg-navy-light text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_25px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isJoining ? (
                      <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Joining...</>
                    ) : (
                      <><Video className="w-5 h-5" />Join Live Class</>
                    )}
                  </button>
                </>
              )}

              {/* ── Offline Active / Ongoing — Join button to view address ── */}
              {isSessionOffline && (status.state === 'active' || status.state === 'offline_active') && (
                <>
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-500 mb-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span> Session Ongoing
                  </div>
                  <button
                    onClick={handleSecureJoin}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(245,158,11,0.15)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <MapPin className="w-5 h-5" /> View Venue Address
                  </button>
                </>
              )}

              {/* ── Session ended for today ── */}
              {!isOffline && !isSessionOffline && status.state === 'ended' && (
                <div className="w-full py-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" /> Session Completed
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">Today's class has ended. See you at the next session!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Secure Join info — only show for online classes */}
          {!isSessionOffline && (
            <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-sky/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-sky" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Secure Join</p>
                <p className="text-xs font-medium text-slate-500 leading-relaxed mt-0.5">
                  Meeting links are protected by TrueEd and never exposed publicly. Access is strictly authorized.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Resources */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-sora font-extrabold text-navy text-xl flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-sky" /> Today's Resources
                </h3>
              </div>
              
              {loadingResources ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Loading resources...</span>
                </div>
              ) : materials.length === 0 ? (
                /* Empty state: teacher hasn't uploaded anything yet */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="font-bold text-slate-700 mb-1">No resources uploaded yet</h4>
                  <p className="text-sm text-slate-400 font-medium max-w-xs">
                    Your tutor hasn't posted any PDF notes, presentation slides, assignments, or reference materials yet. Check back after class!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(MATERIAL_CONFIG).map(([type, cfg]) => {
                    const items = materialsByType[type] || [];
                    if (items.length === 0) return null;
                    return (
                      <div key={type}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{cfg.label} ({items.length})</p>
                        <div className="space-y-2">
                          {items.map((m) => (
                            <a
                              key={m._id || m.id}
                              href={m.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-4 rounded-2xl border ${cfg.color} flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all`}
                            >
                              <div className="bg-white p-2.5 rounded-xl shadow-sm flex-shrink-0">
                                {cfg.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-sm block truncate">{m.title || m.name || 'Untitled'}</span>
                                {m.description && (
                                  <span className="text-xs opacity-70 block truncate">{m.description}</span>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Announcements */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-full">
              <h3 className="font-sora font-extrabold text-navy text-xl flex items-center gap-3 mb-6">
                <Megaphone className="w-6 h-6 text-amber-500" /> Announcements
              </h3>
              
              {loadingResources ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
                    <Megaphone className="w-7 h-7 text-amber-300" />
                  </div>
                  <h4 className="font-bold text-slate-700 mb-1 text-sm">No announcements yet</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Your tutor hasn't posted any announcements for this class yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.slice(0, 5).map((a, i) => (
                    <div key={a._id || i} className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100/60 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                      {a.isPinned && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded tracking-widest flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-bold text-slate-800 mb-1">{a.title || 'Announcement'}</p>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{a.message || a.content || ''}</p>
                      <p className="text-xs text-slate-400 font-semibold mt-3">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Additional Sections Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Upcoming Sessions — computed from real schedule */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="font-sora font-extrabold text-navy text-xl flex items-center gap-3 mb-8">
              <Calendar className="w-6 h-6 text-indigo-500" /> Upcoming Sessions
            </h3>
            
            {upcomingSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-500">No upcoming sessions</p>
                <p className="text-xs text-slate-400 mt-1">No schedule configured for this classroom.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                {upcomingSessions.map((s, i) => (
                  <div key={i} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${s.isToday ? 'bg-sky shadow-[0_0_0_3px_rgba(14,165,233,0.2)]' : 'bg-slate-300'}`}></div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${s.isToday ? 'text-sky' : 'text-slate-400'}`}>
                      {s.day} · {s.dateLabel}
                    </p>
                    <p className="text-base font-bold text-navy mb-1">{classroom.subject}</p>
                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime12hr(s.startTime)} – {formatTime12hr(s.endTime)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Progress — from real API data */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="font-sora font-extrabold text-navy text-xl flex items-center gap-3 mb-8">
              <CheckCircle className="w-6 h-6 text-emerald-500" /> My Progress
            </h3>
            
            {studentProgress ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">Classes Attended</span>
                    <span className="text-navy">
                      {studentProgress.classesAttended ?? 0}
                      {classroom.totalHoursPlanned ? ` / ~${classroom.totalHoursPlanned} hrs` : ''}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky rounded-full transition-all duration-500"
                      style={{
                        width: classroom.totalHoursPlanned
                          ? `${Math.min(100, ((studentProgress.classesAttended || 0) / classroom.totalHoursPlanned) * 100).toFixed(0)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">Assignments Submitted</span>
                    <span className="text-navy">{studentProgress.assignmentsCompleted ?? 0}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%', opacity: studentProgress.assignmentsCompleted > 0 ? 1 : 0.2 }} />
                  </div>
                </div>

                {/* Last attended */}
                {studentProgress.lastAttendedAt && (
                  <p className="text-xs text-slate-400 font-semibold">
                    Last attended: {new Date(studentProgress.lastAttendedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-500">No progress data yet</p>
                <p className="text-xs text-slate-400 mt-1">Join your first class to start tracking progress.</p>
              </div>
            )}
          </div>
          
        </div>

        {/* Classroom Info Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Subject', value: classroom.subject },
            { label: 'Level', value: classroom.academicLevel || classroom.classLevel || 'General' },
            { label: 'Mode', value: isOffline ? 'Offline' : 'Online' },
            { label: 'Start Date', value: classroom.startDate ? new Date(classroom.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD' },
            { label: 'End Date', value: classroom.endDate ? new Date(classroom.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD' },
            { label: 'Enrolled', value: `${classroom.stats?.enrolledCount || 0} / ${classroom.maxStudents || '∞'}` },
          ].map((info, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{info.label}</p>
              <p className="text-sm font-bold text-navy truncate">{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      {meetingInstructions && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setMeetingInstructions(null)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full bg-slate-50 hover:bg-slate-100 transition"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-sky/10 text-sky rounded-full flex items-center justify-center text-3xl">
                <i className={`fa-solid ${meetingInstructions.platform.toLowerCase().includes('zoom') ? 'fa-video' : 'fa-users'}`} />
              </div>
              <div>
                <h3 className="font-sora font-extrabold text-navy text-xl">Join Live Class</h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">Please use the credentials below on {meetingInstructions.platform}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meeting ID</span>
                  <div className="flex justify-between items-center bg-white border border-slate-100 rounded-lg px-3 py-2 mt-1">
                    <span className="font-mono font-bold text-navy select-all">{meetingInstructions.meetingId}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(meetingInstructions.meetingId);
                        alert('Meeting ID copied!');
                      }}
                      className="text-xs text-sky font-bold hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                {meetingInstructions.meetingPassword && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password / Passcode</span>
                    <div className="flex justify-between items-center bg-white border border-slate-100 rounded-lg px-3 py-2 mt-1">
                      <span className="font-mono font-bold text-navy select-all">{meetingInstructions.meetingPassword}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(meetingInstructions.meetingPassword);
                          alert('Password copied!');
                        }}
                        className="text-xs text-sky font-bold hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-amber/10 border border-amber/20 rounded-xl p-3 text-xs text-amber-hover font-semibold text-left">
                ⚠️ IMPORTANT: Make sure to join {meetingInstructions.platform} with your actual name as your attendance has been marked as present.
              </div>
              <button 
                onClick={() => setMeetingInstructions(null)}
                className="w-full py-3 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Venue Modal */}
      {offlineModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setOfflineModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full bg-slate-50 hover:bg-slate-100 transition"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-sora font-extrabold text-navy mb-2">Offline Class Address</h3>
              <p className="text-sm text-slate-500 mb-6 font-semibold">Here is the exact venue location for your class scheduled today:</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Classroom Location</p>
                <p className="text-sm text-navy font-bold">{classroom.offlineFacility?.address || 'No address specified yet. Please contact teacher.'}</p>
                {classroom.offlineFacility?.description && (
                  <p className="text-xs text-slate-500 mt-2 font-medium italic">Landmark/Notes: {classroom.offlineFacility.description}</p>
                )}
              </div>

              <button
                onClick={() => setOfflineModalOpen(false)}
                className="w-full py-3 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition"
              >
                Close Venue Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomLobby;
