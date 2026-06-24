import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ArrowLeft, Video, Clock, ShieldCheck, AlertCircle, FileText, Megaphone, Calendar, Monitor, Users, CheckCircle, ListChecks, PlayCircle, BookOpen } from 'lucide-react';

const ClassroomLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [classroom, setClassroom] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ state: 'loading', message: '' }); // states: loading, waiting, active, ended, unauthorized, unconfigured
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    document.title = "Classroom Lobby — TrueEd";
    const saved = localStorage.getItem('trueed_teacher_classrooms');
    if (!saved) {
      setError("Classroom not found.");
      setStatus({ state: 'unauthorized', message: 'Classroom not found.' });
      return;
    }

    let allClassrooms = [];
    try {
      allClassrooms = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse classrooms in lobby", e);
    }
    const room = allClassrooms.find(c => c?.id?.toString() === id?.toString());

    if (!room) {
      setError("Classroom not found.");
      setStatus({ state: 'unauthorized', message: 'Classroom not found.' });
      return;
    }

    // Security Check: User is logged in
    if (!user) {
      setError("You must be logged in to join this classroom.");
      setStatus({ state: 'unauthorized', message: 'Please log in to continue.' });
      return;
    }

    // Security Check: Enrolled
    const studentProfileStr = localStorage.getItem('trueed_student_profile');
    const joinedRoomsStr = localStorage.getItem('trueed_student_joined_rooms');
    
    let isEnrolled = false;
    
    if (studentProfileStr) {
      try {
        const profile = JSON.parse(studentProfileStr);
        const enrolled = profile.enrolledClassrooms || [];
        if (enrolled.some(c => c?.id?.toString() === id?.toString())) {
          isEnrolled = true;
        }
      } catch (e) {
        console.error("Failed to parse student profile in lobby", e);
      }
    }
    
    if (joinedRoomsStr) {
      try {
        const joinedRooms = JSON.parse(joinedRoomsStr);
        if (joinedRooms.some(c => c?.id?.toString() === id?.toString())) {
          isEnrolled = true;
        }
      } catch (e) {
        console.error("Failed to parse joined rooms in lobby", e);
      }
    }
    
    if (!isEnrolled) {
      setError("You are not authorized to join this classroom. Please enroll first.");
      setStatus({ state: 'unauthorized', message: 'You are not enrolled in this classroom.' });
      return;
    }

    setClassroom(room);

    // Calculate Status
    if (!room.liveSettings || !room.liveSettings.meetingLink) {
      setStatus({ state: 'unconfigured', message: 'The teacher has not configured the live class link yet.' });
      return;
    }

    setJoinUrl(room.liveSettings.meetingLink);

    const checkTime = () => {
      const now = new Date();
      
      if (!room.startTime || !room.endTime) {
        setStatus({ state: 'active', message: 'Session is Live' });
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

      const startDate = parseTimeToDate(room.startTime);
      const endDate = parseTimeToDate(room.endTime);
      const accessMinutes = room.liveSettings.accessTimeMinutes || 15;
      
      const accessTime = new Date(startDate.getTime() - accessMinutes * 60000);

      if (now > endDate) {
        setStatus({ state: 'ended', message: 'Session has ended for today.' });
      } else if (now < accessTime) {
        const diffMs = accessTime - now;
        const diffMins = Math.ceil(diffMs / 60000);
        setStatus({ state: 'waiting', message: `Join Available In ${diffMins} Minute${diffMins > 1 ? 's' : ''}` });
      } else {
        setStatus({ state: 'active', message: 'Session Starts In a few minutes / is live' });
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);

  }, [id, user]);

  const handleSecureJoin = () => {
    // Simulated backend validation flow
    if (status.state === 'active' && joinUrl) {
      // In a real app: POST /api/classrooms/:id/join -> returns meetingLink or 302 redirect
      window.open(joinUrl, '_blank');
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

  if (!classroom) return <div className="p-8 text-center text-slate-500 font-bold">Loading Lobby...</div>;

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24 font-inter">
      {/* Top Hero Banner */}
      <div className="bg-navy pt-8 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/student/rooms" className="inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold transition mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Classrooms
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-red-500/20 text-red-100 rounded-lg text-xs font-bold uppercase tracking-widest border border-red-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
              Live Classroom
            </span>
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
                {classroom.startTime ? `${formatTime12hr(classroom.startTime)} – ${formatTime12hr(classroom.endTime)}` : 'Schedule TBD'}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[300px]">
              {status.state === 'waiting' && (
                <button disabled className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <Clock className="w-5 h-5 text-slate-400" />
                  {status.message}
                </button>
              )}
              {status.state === 'active' && (
                <>
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-success mb-1">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span> Session Live Now
                  </div>
                  <button onClick={handleSecureJoin} className="w-full py-4 bg-navy hover:bg-navy-light text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_25px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 transition-all duration-300">
                    <Video className="w-5 h-5" />
                    Join Live Class
                  </button>
                </>
              )}
              {status.state === 'ended' && (
                <>
                  <div className="text-center text-sm font-bold text-slate-500 mb-1">Session Completed</div>
                  <button className="w-full py-4 bg-sky/10 text-sky-700 hover:bg-sky/20 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all">
                    <PlayCircle className="w-5 h-5" />
                    View Recording
                  </button>
                </>
              )}
              {status.state === 'unconfigured' && (
                <button disabled className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border border-red-100">
                  Link Not Configured
                </button>
              )}
            </div>
          </div>
          
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
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Resources */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-sora font-extrabold text-navy text-xl flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-sky" /> Today's Resources
                </h3>
                <button className="text-sm font-bold text-sky hover:text-sky-700 transition">View All</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'PDF Notes', icon: <FileText className="w-5 h-5" />, color: 'bg-red-50 text-red-600 border-red-100' },
                  { title: 'Presentation Slides', icon: <Monitor className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
                  { title: 'Assignments', icon: <ListChecks className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
                  { title: 'Reference Material', icon: <BookOpen className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
                ].map((res, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${res.color} flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                    <div className="bg-white p-2.5 rounded-xl shadow-sm">
                      {res.icon}
                    </div>
                    <span className="font-bold text-sm">{res.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Announcements */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-full">
              <h3 className="font-sora font-extrabold text-navy text-xl flex items-center gap-3 mb-8">
                <Megaphone className="w-6 h-6 text-amber-500" /> Announcements
              </h3>
              
              <div className="space-y-4">
                <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100/60 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded tracking-widest">Pinned</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-2">Welcome to the class.</p>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Please join 5 minutes early. Bring your notebook and calculator for today's numericals.
                  </p>
                  <p className="text-xs text-slate-400 font-semibold mt-3">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Additional Sections Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="font-sora font-extrabold text-navy text-xl flex items-center gap-3 mb-8">
              <Calendar className="w-6 h-6 text-indigo-500" /> Upcoming Sessions
            </h3>
            
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
              {[
                { day: 'Today', topic: `${classroom.subject} Basics`, time: formatTime12hr(classroom.startTime) || '1 PM', active: true },
                { day: 'Tomorrow', topic: 'Advanced Theory', time: formatTime12hr(classroom.startTime) || '1 PM', active: false },
                { day: 'Friday', topic: 'Numericals Practice', time: formatTime12hr(classroom.startTime) || '1 PM', active: false },
              ].map((s, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${s.active ? 'bg-sky shadow-[0_0_0_3px_rgba(14,165,233,0.2)]' : 'bg-slate-300'}`}></div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${s.active ? 'text-sky' : 'text-slate-400'}`}>{s.day}</p>
                  <p className="text-base font-bold text-navy mb-1">{s.topic}</p>
                  <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {s.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student Progress */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="font-sora font-extrabold text-navy text-xl flex items-center gap-3 mb-8">
              <CheckCircle className="w-6 h-6 text-emerald-500" /> My Progress
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600">Attendance</span>
                  <span className="text-navy">95%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[95%] h-full bg-emerald-500 rounded-full"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600">Completed Sessions</span>
                  <span className="text-navy">8 / 10</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[80%] h-full bg-sky rounded-full"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600">Assignments Submitted</span>
                  <span className="text-navy">6 / 8</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[75%] h-full bg-indigo-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Classroom Info Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Subject', value: classroom.subject },
            { label: 'Level', value: classroom.classLevel || 'General' },
            { label: 'Mode', value: classroom.mode || 'Online' },
            { label: 'Start Date', value: classroom.startDate || 'TBD' },
            { label: 'End Date', value: classroom.endDate || 'TBD' },
            { label: 'Enrolled', value: `${classroom.students || 0} / ${classroom.maxStudents || '∞'}` }
          ].map((info, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{info.label}</p>
              <p className="text-sm font-bold text-navy truncate">{info.value}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ClassroomLobby;
