import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, Monitor, BookOpen, Users, PlayCircle, Shield, X, AlertCircle, ArrowLeft, Send, CheckCircle2, PartyPopper, ArrowRight, Wallet, Star } from 'lucide-react';
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
  const { openPaymentModal, requireTokens, tokens } = useWallet();
  const [classroom, setClassroom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  
  const [isEnrolled, setIsEnrolled] = useState(false);

  
  // New Enrollment Flow States
  const [classroomQuery, setClassroomQuery] = useState(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryForm, setQueryForm] = useState({ message: '' });
  const [queryError, setQueryError] = useState(null);
  const [querySuccessToast, setQuerySuccessToast] = useState(false);

  const [existingReview, setExistingReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    const loadClassroom = async () => {
      setIsLoading(true);
      let found = null;
      
      // Try backend first
      try {
        const res = await api.classroom.getDetail(classroomId);
        if (res) {
          const c = res.classroom || res;
          found = {
            id: c._id || c.id,
            name: c.title || c.name || 'Classroom Details',
            teacher: c.teacherId?.name || c.teacherName || 'Tutor',
            subject: c.subject || 'General Education',
            price: (c.feesPaise || 150000) / 100,
            description: c.description || '',
            schedule: c.schedule || [],
            mode: c.mode || 'online',
            scheduleDays: c.schedule ? c.schedule.map(s => {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return days[s.day];
            }).filter(Boolean) : [],
            startTime: c.schedule?.[0]?.startTime || '',
            endTime: c.schedule?.[0]?.endTime || '',
            startDate: c.startDate,
            endDate: c.endDate,
            students: c.stats?.enrolledStudents || 0,
            maxStudents: c.maxStudents,
            unlimitedStudents: false
          };
          if (c.teacherId) setTeacher(c.teacherId);
          
          if (res.enrollmentStatus === 'enrolled' || res.enrollmentStatus === 'teacher_owner') {
            setIsEnrolled(true);
          }
        }
      } catch (err) {
        console.warn("API classroom fetch error:", err);
      }

      // Fallback to local storage if not found on backend
      if (!found) {
        const classroomsRaw = localStorage.getItem('trueed_teacher_classrooms');
        if (classroomsRaw) {
          try {
            const classrooms = JSON.parse(classroomsRaw);
            found = classrooms.find(c => (c?._id || c?.id)?.toString() === classroomId?.toString());
          } catch (err) {
            console.error("Error parsing classrooms:", err);
          }
        }
      }

      if (found) {
        setClassroom(found);
        document.title = `${found.name} — TrueEd`;
        if (!teacher) {
          const tutor = tutors.find(t => t?.name === found.teacher);
          if (tutor) setTeacher(tutor);
        }
      }
    };

    loadClassroom();

    // Check enrollment status local storage fallback
    const studentProfileStr = localStorage.getItem('trueed_student_profile');
    if (studentProfileStr) {
      try {
        const profile = JSON.parse(studentProfileStr);
        const enrolled = profile.enrolledClassrooms || [];
        if (enrolled.some(c => c?.id?.toString() === classroomId?.toString())) {
          setIsEnrolled(true);
        }
      } catch (err) {
        console.error("Error parsing student profile:", err);
      }
    }
    
    // Check classroom query status
    const queriesRaw = localStorage.getItem('trueed_classroom_queries');
    if (queriesRaw) {
      try {
        const queries = JSON.parse(queriesRaw);
        const myQuery = queries.find(q => 
          q.classroomId?.toString() === classroomId?.toString() && 
          q.studentId === (user?.id || 'student-1')
        );
        if (myQuery) {
          setClassroomQuery(myQuery);
        }
      } catch (err) {}
    }
    
    // Check existing review
    const reviewsRaw = localStorage.getItem('trueed_reviews');
    if (reviewsRaw) {
      try {
        const reviews = JSON.parse(reviewsRaw);
        const myReview = reviews.find(r => 
          r.enrollmentId === `enroll_${classroomId}` && 
          r.studentId === (user?.id || 'student-1')
        );
        if (myReview) {
          setExistingReview(myReview);
        }
      } catch (err) {}
    }

    setIsLoading(false);
  }, [classroomId]);

  useEffect(() => {
    if (location.search.includes('query=true')) {
      setShowQueryModal(true);
    }
  }, [location.search]);

  const handleQuerySubmit = (e) => {
    e.preventDefault();
    if (!queryForm.message) return;

    requireTokens(1, () => {
      const newQuery = {
        id: Date.now(),
        type: 'classroom',
        classroomId: classroom.id.toString(),
        classroomName: classroom.name,
        subject: classroom.subject,
        teacherId: classroom.teacherId || 'teacher-1',
        teacherName: classroom.teacher || teacher?.name || 'Teacher User',
        teacherInitials: teacher?.initials || 'T',
        studentId: user?.id || 'student-1',
        studentName: user?.name || 'Student User',
        studentInitials: user?.initials || 'ST',
        message: queryForm.message,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const queriesRaw = localStorage.getItem('trueed_classroom_queries');
      const existing = queriesRaw ? JSON.parse(queriesRaw) : [];
      existing.push(newQuery);
      localStorage.setItem('trueed_classroom_queries', JSON.stringify(existing));

      setClassroomQuery(newQuery);
      setShowQueryModal(false);
      setQuerySuccessToast(true);
      setTimeout(() => setQuerySuccessToast(false), 5000);
      setQueryForm({ message: '' });
    });
  };

  const handleReviewSubmit = (reviewData) => {
    const reviewsRaw = localStorage.getItem('trueed_reviews');
    let reviews = reviewsRaw ? JSON.parse(reviewsRaw) : [];
    
    // Check if updating
    const existingIndex = reviews.findIndex(r => r.id === reviewData.id);
    if (existingIndex >= 0) {
      reviews[existingIndex] = reviewData;
    } else {
      reviews.push(reviewData);
    }
    
    localStorage.setItem('trueed_reviews', JSON.stringify(reviews));
    setExistingReview(reviewData);
    setShowReviewModal(false);
  };

  const handleEnrollClick = () => {
    openPaymentModal({
      type: 'classroom',
      details: classroom,
      onSuccess: () => {
        // Add to student profile enrolled
        const profileStr = localStorage.getItem('trueed_student_profile');
        let profile = profileStr ? JSON.parse(profileStr) : { enrolledClassrooms: [] };
        profile.enrolledClassrooms = profile.enrolledClassrooms || [];
        if (!profile.enrolledClassrooms.some(c => c.id === classroom.id)) {
          profile.enrolledClassrooms.push(classroom);
        }
        localStorage.setItem('trueed_student_profile', JSON.stringify(profile));

        // Add to joined rooms
        const joinedStr = localStorage.getItem('trueed_student_joined_rooms');
        let joinedRooms = joinedStr ? JSON.parse(joinedStr) : [];
        if (!joinedRooms.some(r => r.id === classroom.id)) {
          joinedRooms.push(classroom);
        }
        localStorage.setItem('trueed_student_joined_rooms', JSON.stringify(joinedRooms));

        setIsEnrolled(true);
      }
    });
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

  const { hours: sessionHours, text: sessionDurationText } = getSessionDuration(classroom.startTime, classroom.endTime);
  const expectedLecturesCount = getExpectedLectures(classroom.startDate, classroom.endDate, classroom.scheduleDays);
  const totalTeachingHours = expectedLecturesCount === 'Not Available' || sessionDurationText === 'Not Available' 
    ? 'Not Available' 
    : `${(expectedLecturesCount * sessionHours).toFixed(1)} Hours`;

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
                  required
                  rows="4"
                  placeholder="Tell the teacher about your learning goals, current preparation level, or ask any questions before joining this classroom."
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
                <button type="submit" className="flex-1 py-3.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow-sm">
                  Send Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Success Toast */}
      {querySuccessToast && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-success" />
          Classroom Query Sent Successfully!
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
