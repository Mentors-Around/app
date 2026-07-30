import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, Monitor, BookOpen, Users, PlayCircle, Shield, X, AlertCircle, ArrowLeft, Send, CheckCircle2, PartyPopper, ArrowRight, Wallet, Star, Lock, Eye, EyeOff } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import { tutors } from '../data/tutors';
import ReviewModal from '../components/shared/ReviewModal';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import api from '../services/api';

const StudentClassroomDetails = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { tokens } = useWallet();
  const [classroom, setClassroom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Enrollment Flow States
  const [classroomQuery, setClassroomQuery] = useState(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryForm, setQueryForm] = useState({ message: '' });
  const [queryError, setQueryError] = useState(null);
  const [querySuccessToast, setQuerySuccessToast] = useState(false);
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);

  // Payment/Enrollment States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [enrollPassword, setEnrollPassword] = useState('');
  const [showEnrollPassword, setShowEnrollPassword] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState(null);

  const [existingReview, setExistingReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Load classroom + enrollment/query status from real API
  useEffect(() => {
    if (!classroomId) return;
    const loadClassroom = async () => {
      setIsLoading(true);
      try {
        // Fetch classroom details (backend returns gmeetLink only for enrolled users)
        const res = await api.classroom.getDetail(classroomId);
        if (res) {
          const c = res.classroom || res;
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const found = {
            id:               c._id || c.id,
            _id:              c._id || c.id,
            name:             c.title || c.name || 'Classroom Details',
            teacher:          c.teacherId?.name || c.teacherName || 'Tutor',
            teacherId:        c.teacherId?._id || c.teacherId,
            subject:          c.subject || 'General Education',
            price:            (c.feesPaise || 0) / 100,
            feesPaise:        c.feesPaise || 0,
            description:      c.description || '',
            schedule:         c.schedule || [],
            mode:             c.mode || 'online',
            scheduleDays:     Array.isArray(c.schedule)
                                ? c.schedule.map(s => days[s.day]).filter(Boolean)
                                : [],
            startTime:        c.schedule?.[0]?.startTime || '',
            endTime:          c.schedule?.[0]?.endTime || '',
            startDate:        c.startDate,
            endDate:          c.endDate,
            students:         c.stats?.enrolledStudents || 0,
            maxStudents:      c.maxStudents,
            unlimitedStudents: !c.maxStudents || c.maxStudents >= 9999,
            classLevel:       c.academicLevel || c.classroomType || 'General',
            gmeetLink:        c.gmeetLink || null,
            status:           c.status,
          };
          setClassroom(found);
          document.title = `${found.name} — TrueEd`;
          if (c.teacherId && typeof c.teacherId === 'object') {
            setTeacher(c.teacherId);
          }
          // Set enrollment status from backend response
          if (res.enrollmentStatus === 'enrolled' || res.enrollmentStatus === 'teacher_owner') {
            setIsEnrolled(true);
          }
        }
      } catch (err) {
        console.warn('API classroom fetch error:', err);
      }

      // Load existing query from API (only for logged-in students)
      if (user?._id && user?.role === 'student') {
        try {
          const queriesRes = await api.enrollment.getMyQueries();
          const list = Array.isArray(queriesRes) ? queriesRes
            : (queriesRes?.docs || queriesRes?.queries || []);
          // Find an active/pending/accepted query for this classroom
          const existing = list.find(q => {
            const qClassId = (q.classroomId?._id || q.classroomId)?.toString();
            return qClassId === classroomId?.toString() &&
              ['pending', 'accepted'].includes(q.status);
          });
          if (existing) {
            setClassroomQuery({ ...existing, id: existing._id || existing.id });
          }
        } catch (e) {
          // Non-critical: leave classroomQuery as null
        }
      }

      setIsLoading(false);
    };
    loadClassroom();
  }, [classroomId, user?._id]);

  useEffect(() => {
    if (location.search.includes('query=true') && user?.role === 'student') {
      setShowQueryModal(true);
    }
  }, [location.search, user?.role]);

  // Send enrollment query — calls real backend API (deducts 1 query token)
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setQueryError('You must be logged in to send a query.');
      return;
    }
    if (tokens < 1) {
      setQueryError('You need at least 1 query token. Please buy tokens from your wallet.');
      return;
    }
    setIsSubmittingQuery(true);
    setQueryError(null);
    try {
      const newQuery = await api.enrollment.sendQuery({
        classroomId: classroom.id || classroom._id,
        // message is optional — backend defaults to 'I want to join the classroom'
        message: queryForm.message.trim() || 'I want to join the classroom',
      });
      // Backend returns the query object
      setClassroomQuery({ ...newQuery, id: newQuery._id || newQuery.id, status: 'pending' });
      setShowQueryModal(false);
      setQuerySuccessToast(true);
      setTimeout(() => setQuerySuccessToast(false), 5000);
      setQueryForm({ message: '' });
    } catch (err) {
      setQueryError(err.message || 'Failed to send query. Please try again.');
    } finally {
      setIsSubmittingQuery(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    setExistingReview(reviewData);
    setShowReviewModal(false);
  };

  // Proceed to enrollment — opens password confirmation modal
  const handleEnrollClick = () => {
    setEnrollError(null);
    setEnrollPassword('');
    setShowPasswordModal(true);
  };

  // Execute wallet enrollment after password confirmed
  const handleConfirmEnrollment = async () => {
    if (!enrollPassword.trim()) {
      setEnrollError('Please enter your password to confirm the payment.');
      return;
    }
    if (!classroomQuery?.id) {
      setEnrollError('No accepted query found. Please contact support.');
      return;
    }
    setIsEnrolling(true);
    setEnrollError(null);
    try {
      await api.enrollment.enrollInClassroom(classroomQuery.id, 'wallet', enrollPassword);
      setIsEnrolled(true);
      setShowPasswordModal(false);
      setClassroomQuery(prev => prev ? { ...prev, status: 'enrolled' } : null);
      setQuerySuccessToast(true);
      setTimeout(() => setQuerySuccessToast(false), 5000);
      // Navigate to the lobby after successful enrollment
      setTimeout(() => navigate(`/student/lobby/${classroom.id || classroom._id}`), 1500);
    } catch (err) {
      setEnrollError(err.message || 'Enrollment failed. Please check your password and wallet balance.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const formatTime12hr = (time24) => {
    if (!time24 || typeof time24 !== 'string') return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    const [h, m] = parts;
    let hours = parseInt(h, 10);
    if (isNaN(hours)) return time24;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const [h, m] = parts;
    return parseInt(h, 10) + parseInt(m, 10) / 60;
  };

  const getSessionDuration = (start, end) => {
    if (!start || !end) return { hours: 0, text: 'Not Available' };
    let diff = parseTime(end) - parseTime(start);
    if (diff < 0) diff += 24; 
    const h = Math.floor(diff);
    const m = Math.round((diff - h) * 60);
    let text = '';
    if (h > 0) text += `${h} Hour${h > 1 ? 's' : ''} `;
    if (m > 0) text += `${m} Minute${m > 1 ? 's' : ''}`;
    if (!text) return { hours: 0, text: 'Not Available' };
    return { hours: diff, text: text.trim() };
  };

  const getExpectedLectures = (startDate, endDate, scheduleDays) => {
    if (!startDate || !endDate || !scheduleDays || !Array.isArray(scheduleDays) || scheduleDays.length === 0) return 'Not Available';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start > end) return 'Not Available';

    let count = 0;
    const current = new Date(start);
    const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const validDays = scheduleDays.map(d => dayMap[d]).filter(d => d !== undefined);

    while (current <= end) {
      if (validDays.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-3xl mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="font-sora font-extrabold text-2xl text-navy mb-3">Classroom Not Found</h1>
          <p className="text-slate-500 font-medium mb-8">This classroom does not exist or has been removed.</p>
          <Link to="/student/discover" className="inline-block px-8 py-3.5 bg-navy text-white font-bold rounded-xl shadow-sm hover:shadow-md transition">
            Browse Classes
          </Link>
        </div>
      </div>
    );
  }

  const getShortDayName = (dayNum) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNum] || 'Mon';
  };

  const schedules = [];
  const scheduleSlots = classroom?.schedule || [];
  
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
  let sessionDurationText = 'Not Available';

  if (classroom?.startDate && classroom?.endDate && schedules.length > 0) {
    const start = new Date(classroom.startDate);
    const end = new Date(classroom.endDate);
    if (start <= end) {
      schedules.forEach(sch => {
        if (sch.days.length > 0 && sch.startTime && sch.endTime) {
          const { hours: sessionHours } = getSessionDuration(sch.startTime, sch.endTime);
          const lectures = getExpectedLectures(classroom.startDate, classroom.endDate, sch.days);
          if (typeof lectures === 'number') {
            totalLecturesVal += lectures;
            totalTeachingHoursVal += (lectures * sessionHours);
          }
        }
      });
    }

    const durationTexts = [];
    schedules.forEach(sch => {
      if (sch.days.length > 0 && sch.startTime && sch.endTime) {
        const { text } = getSessionDuration(sch.startTime, sch.endTime);
        if (text && text !== 'Not Available') {
          const daysText = `${sch.days.length} day${sch.days.length > 1 ? 's' : ''} per week`;
          durationTexts.push(`${text} (${daysText})`);
        }
      }
    });
    
    if (durationTexts.length === 1) {
      sessionDurationText = durationTexts[0];
    } else if (durationTexts.length > 0) {
      sessionDurationText = durationTexts.join(', ');
    }
  }

  const expectedLecturesCount = schedules.length > 0 ? totalLecturesVal : 'Not Available';
  const totalTeachingHours = schedules.length > 0 && totalTeachingHoursVal > 0 ? `${totalTeachingHoursVal.toFixed(1)} Hours` : 'Not Available';

  return (
    <div className="bg-slate-50 min-h-screen pb-24 md:pb-12">
      {/* Toast */}


      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center text-sm font-semibold text-slate-500">
          <button onClick={() => navigate(-1)} className="hover:text-navy transition flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="mx-2">›</span>
          <span className="text-navy">{classroom.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Main Info */}
          <div className="flex-1 space-y-6">
            {/* Title Card */}
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wider">
                  {classroom.subject}
                </span>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-md uppercase tracking-wider">
                  {classroom.classLevel || 'General'}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md uppercase tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" /> {classroom.mode || 'Online'}
                </span>
              </div>
              <h1 className="font-sora font-extrabold text-3xl text-navy mb-4 leading-tight">{classroom.name}</h1>
              <p className="text-slate-600 font-medium leading-relaxed">{classroom.description || 'No description provided.'}</p>
            </div>

            {/* Schedule & Logistics */}
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-8">
              <h2 className="font-sora font-bold text-xl text-navy mb-6">Classroom Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Schedule Days</p>
                  <p className="font-semibold text-navy flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> {Array.isArray(classroom.scheduleDays) && classroom.scheduleDays.length > 0 ? classroom.scheduleDays.join(', ') : (classroom.scheduleDays || 'TBD')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Timing</p>
                  <p className="font-semibold text-navy flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> {formatTime12hr(classroom.startTime) || '--'} to {formatTime12hr(classroom.endTime) || '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Session Duration</p>
                  <p className="font-semibold text-navy">{sessionDurationText}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Lectures</p>
                  <p className="font-semibold text-navy">{expectedLecturesCount}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Teaching Hours</p>
                  <p className="font-semibold text-navy">{totalTeachingHours}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                  <p className="font-semibold text-navy flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" /> 
                    {classroom.unlimitedStudents ? 'Unlimited Seats' : `${classroom.students || 0} / ${classroom.maxStudents || 0} Students`}
                  </p>
                </div>
              </div>
            </div>

            {/* Teacher Info */}
            {teacher && (
              <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-8 flex items-start gap-6">
                <TeacherAvatar 
                  teacherId={teacher?.id || '1'} 
                  name={teacher?.name} 
                  initials={teacher?.initials} 
                  className="w-16 h-16 text-xl flex-shrink-0" 
                />
                <div>
                  <h3 className="font-sora font-bold text-lg text-navy">{teacher.name}</h3>
                  <p className="text-sm font-semibold text-slate-500 mb-2">{teacher.experience} Experience • ★ {teacher.rating} ({teacher.reviews} reviews)</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{teacher.bio}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full md:w-[320px] lg:w-[360px] flex-shrink-0">
            <div className="bg-white rounded-brand-xl shadow-brand border border-slate-200 p-6 md:sticky md:top-36">
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price per Student</p>
                <div className="flex items-end gap-2">
                  <span className="font-sora font-extrabold text-4xl text-navy">₹{classroom.price}</span>
                  <span className="text-sm font-semibold text-slate-500 mb-1">/ full course</span>
                </div>
              </div>

              <hr className="border-slate-100 my-6" />

              <div className="mb-6 space-y-3">
                {!isEnrolled ? (
                  <>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      <span>Verified Teacher</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      <span>Instant Enrollment</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      <span>Lifetime Classroom Access</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      <span>Learning Resources Included</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-sm font-semibold text-slate-600">Enrollment Status</span>
                      <span className="font-bold text-success">✓ Enrolled</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-sm font-semibold text-slate-600">Payment Status</span>
                      <span className="font-bold text-success">✓ Paid</span>
                    </div>
                  </>
                )}
              </div>

              {isEnrolled ? (
                <>
                  <button 
                    onClick={() => navigate(`/student/lobby/${classroom.id}`)}
                    className="w-full py-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 bg-success text-white hover:bg-green-600 hover:shadow-md transform hover:-translate-y-0.5 mb-3"
                  >
                    <BookOpen className="w-5 h-5" /> Open Classroom
                  </button>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full py-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 border border-slate-200 bg-white text-navy hover:bg-slate-50 hover:shadow-md"
                  >
                    {existingReview ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-success" /> View/Edit Review
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Rate Teacher
                      </>
                    )}
                  </button>
                </>
              ) : (!classroomQuery ? (
                <button 
                  onClick={() => setShowQueryModal(true)}
                  disabled={!classroom.unlimitedStudents && classroom.students >= classroom.maxStudents}
                  className={`w-full py-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2
                    ${(!classroom.unlimitedStudents && classroom.students >= classroom.maxStudents)
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-navy text-white hover:shadow-md hover:bg-navy-light transform hover:-translate-y-0.5'
                    }`}
                >
                  Send Classroom Query <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              ) : classroomQuery.status === 'pending' ? (
                <div className="text-center">
                  <button disabled className="w-full py-4 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed">
                    🟡 Query Sent
                  </button>
                  <p className="text-xs font-semibold text-slate-500 mt-2">Waiting for the teacher's response.</p>
                </div>
              ) : classroomQuery.status === 'accepted' ? (
                <button 
                  onClick={handleEnrollClick}
                  className="w-full py-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 bg-success text-white hover:bg-green-600 hover:shadow-md transform hover:-translate-y-0.5"
                >
                  🟢 Proceed to Payment <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <div className="text-center">
                  <button disabled className="w-full py-4 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 bg-red-50 text-error border border-red-200 cursor-not-allowed">
                    🔴 Request Declined
                  </button>
                  <p className="text-xs font-semibold text-slate-500 mt-2">The teacher declined your classroom request.</p>
                </div>
              ))}

              {(!classroom.unlimitedStudents && classroom.students >= classroom.maxStudents && !isEnrolled) && (
                <p className="text-xs text-error font-semibold text-center mt-3">
                  <AlertCircle className="w-3 h-3 inline mr-1" /> This classroom is full.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>


      {/* Classroom Inquiry Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="font-sora font-bold text-xl text-navy">Classroom Inquiry</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">Send a query to the teacher regarding this classroom. The teacher will review your request before you can enroll.</p>
              </div>
              <button onClick={() => setShowQueryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuerySubmit} className="p-6 space-y-5">
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-sky shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-navy mb-1">Uses 1 Query Token</p>
                  <p className="text-xs font-semibold text-slate-600">You currently have {tokens} tokens.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Classroom Name</label>
                  <input type="text" readOnly value={classroom.name} className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 text-sm font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Subject</label>
                  <input type="text" readOnly value={classroom.subject} className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 text-sm font-medium outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Message</label>
                <textarea 
                  rows="4"
                  placeholder="(Optional) Tell the teacher about your learning goals, current preparation level, or ask any questions before joining this classroom."
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 outline-none transition-all resize-none ${
                    queryError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-navy focus:ring-navy'
                  }`}
                  value={queryForm.message}
                  onChange={(e) => {
                    setQueryForm({...queryForm, message: e.target.value});
                    if (queryError) setQueryError(null);
                  }}
                />
                {queryError && <p className="text-xs text-red-500 mt-2 font-medium">{queryError}</p>}
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowQueryModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition shadow-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuery}
                  className="flex-1 py-3.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingQuery ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                  ) : 'Send Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Success / Enrollment Toast */}
      {querySuccessToast && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-success" />
          {isEnrolled ? '🎉 Enrolled successfully! Redirecting to classroom...' : 'Classroom Query Sent Successfully!'}
        </div>
      )}

      {/* Password Confirmation Modal for Enrollment Payment */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="font-sora font-bold text-xl text-navy">Confirm Enrollment</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">Enter your password to authorise payment</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl">
                <p className="text-sm font-bold text-navy mb-1">💳 Payment Summary</p>
                <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>{classroom?.name}</span>
                  <span>₹{classroom?.price?.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Amount will be deducted from your TrueEd wallet</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                  <Lock className="w-3.5 h-3.5 inline mr-1" /> Password
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
                  >
                    {showEnrollPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  className="flex-[2] py-3.5 bg-success text-white font-bold rounded-xl hover:bg-green-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isEnrolling ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                  ) : <><CheckCircle2 className="w-4 h-4" />Confirm & Pay ₹{classroom?.price?.toFixed(2)}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        teacherId={classroom.teacherId || 'teacher-1'}
        enrollmentId={`enroll_${classroom.id}`}
        existingReview={existingReview}
        onReviewSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default StudentClassroomDetails;
