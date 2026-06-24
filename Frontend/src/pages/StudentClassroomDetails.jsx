import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Monitor, BookOpen, Users, PlayCircle, Shield, X, AlertCircle, ArrowLeft, Send, CheckCircle2, PartyPopper, ArrowRight } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { tutors } from '../data/tutors';

const StudentClassroomDetails = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('confirm'); // confirm, processing, success
  const [enrollSuccessToast, setEnrollSuccessToast] = useState(false);

  useEffect(() => {
    const classroomsRaw = localStorage.getItem('trueed_teacher_classrooms');
    if (classroomsRaw) {
      try {
        const classrooms = JSON.parse(classroomsRaw);
        const found = classrooms.find(c => c?.id?.toString() === classroomId?.toString());
        if (found) {
          setClassroom(found);
          document.title = `${found.name} — TrueEd`;
          const tutor = tutors.find(t => t?.name === found.teacher);
          if (tutor) setTeacher(tutor);
        }
      } catch (err) {
        console.error("Error parsing classrooms:", err);
      }
    }

    // Check enrollment status
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
    
    setIsLoading(false);
  }, [classroomId]);

  const handleEnrollClick = () => {
    setShowPaymentModal(true);
    setPaymentStep('confirm');
  };

  const processPayment = () => {
    setPaymentStep('processing');
    
    setTimeout(() => {
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

      setPaymentStep('success');
      setIsEnrolled(true);
    }, 2000); // Simulate payment delay
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
      {enrollSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[60] animate-fade-in">
          <Shield className="w-5 h-5 text-success" />
          Successfully enrolled in classroom!
        </div>
      )}

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
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-sora font-extrabold text-xl flex-shrink-0">
                  {teacher.initials}
                </div>
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
                <button 
                  onClick={() => navigate(`/student/lobby/${classroom.id}`)}
                  className="w-full py-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 bg-success text-white hover:bg-green-600 hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <BookOpen className="w-5 h-5" /> Open Classroom
                </button>
              ) : (
                <button 
                  onClick={handleEnrollClick}
                  disabled={!classroom.unlimitedStudents && classroom.students >= classroom.maxStudents}
                  className={`w-full py-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2
                    ${(!classroom.unlimitedStudents && classroom.students >= classroom.maxStudents)
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-navy text-white hover:shadow-md hover:bg-navy-light transform hover:-translate-y-0.5'
                    }`}
                >
                  Enroll Now <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}

              {(!classroom.unlimitedStudents && classroom.students >= classroom.maxStudents && !isEnrolled) && (
                <p className="text-xs text-error font-semibold text-center mt-3">
                  <AlertCircle className="w-3 h-3 inline mr-1" /> This classroom is full.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in animate-zoom-in">
            {paymentStep === 'confirm' && (
              <>
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                  <h3 className="font-sora font-bold text-lg text-navy">Enroll in Classroom</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                    <p className="text-sm font-semibold text-slate-500 mb-1">{classroom.name}</p>
                    <div className="flex justify-between items-end">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course Fee</p>
                      <p className="font-sora font-extrabold text-2xl text-navy">₹{classroom.price}</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-navy mb-4">What you'll get:</h4>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-sky flex-shrink-0" /> Access to all sessions
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-sky flex-shrink-0" /> Learning resources
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-sky flex-shrink-0" /> Classroom announcements
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-sky flex-shrink-0" /> Doubt discussions
                    </div>
                  </div>
                  <button 
                    onClick={processPayment}
                    className="w-full py-4 rounded-xl text-sm font-bold shadow-sm transition-all bg-navy text-white hover:shadow-md hover:bg-navy-light transform hover:-translate-y-0.5"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </>
            )}

            {paymentStep === 'processing' && (
              <div className="p-10 text-center flex flex-col items-center justify-center min-h-[360px]">
                <div className="w-16 h-16 border-4 border-navy border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="font-sora font-bold text-xl text-navy mb-2">Processing Payment</h3>
                <p className="text-slate-500 font-medium">Please do not close this window...</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="p-10 text-center flex flex-col items-center justify-center min-h-[360px]">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-success mb-6">
                  <PartyPopper className="w-10 h-10" />
                </div>
                <h3 className="font-sora font-bold text-2xl text-navy mb-2">Enrollment Successful</h3>
                <p className="text-slate-500 font-medium mb-8">You are now enrolled in <br/><span className="text-navy font-bold">{classroom.name}</span></p>
                <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    navigate('/student/rooms');
                  }}
                  className="w-full py-4 rounded-xl text-sm font-bold shadow-sm transition-all bg-navy text-white hover:shadow-md hover:bg-navy-light"
                >
                  Go to My Learning
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClassroomDetails;
