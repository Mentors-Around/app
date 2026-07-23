import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Eye, Download, Award, Calendar, BookOpen, Monitor, Sparkles, CheckCircle, Star, Loader2, AlertCircle } from 'lucide-react';
import StudentReviewModal from '../components/shared/StudentReviewModal';
import api from '../services/api';

const getBadgeStyle = (badge) => {
  switch (badge?.toLowerCase()) {
    case 'live today':       return 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm';
    case 'upcoming':        return 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm';
    case 'new material':    return 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm';
    case 'certificate available': return 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-sm';
    default:                return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

const getBadgeIcon = (badge) => {
  switch (badge?.toLowerCase()) {
    case 'live today': return <span className="animate-pulse w-2 h-2 bg-white rounded-full mr-1 inline-block"></span>;
    case 'upcoming':  return '📅 ';
    case 'new material': return '✨ ';
    case 'certificate available': return '🏆 ';
    default: return '';
  }
};

/** Map an enrollment doc + populated classroomId into a flat UI object.
 *  Returns null if classroomId population failed (we skip those). */
const mapEnrollment = (enr) => {
  const classroom = enr.classroomId || {};
  const teacher   = classroom.teacherId || {};
  // Guard: if classroom._id is missing, population failed — skip this record
  const classroomMongoId = classroom._id?.toString();
  if (!classroomMongoId) return null;
  return {
    enrollmentId: enr._id,
    id:           classroomMongoId,  // Always classroom._id for correct lobby navigation
    name:         classroom.title || 'Untitled Classroom',
    teacher:      teacher.name || 'Tutor',
    teacherAvatar: teacher.avatarUrl || null,
    subject:      classroom.subject || '',
    progress:     enr.classesAttended && classroom.totalHoursPlanned
                    ? Math.min(100, Math.round((enr.classesAttended / classroom.totalHoursPlanned) * 100))
                    : 0,
    attendance:   enr.classesAttended || 0,
    nextLiveClass: classroom.schedule?.[0]
                    ? `${classroom.schedule[0].day} • ${classroom.schedule[0].startTime}`
                    : 'TBD',
    badges: [],
    completionDate: enr.updatedAt
                    ? new Date(enr.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '',
    certificateAvailable: false, // TODO: add real certificate logic when backend supports it
    hasReview: !!enr.reviewId,
    enrolledOn: enr.createdAt,
    status: enr.status,
    mode: classroom.mode || 'online',
  };
};

export default function StudentRooms() {
  const [activeTab, setActiveTab] = useState('active');
  const [activeRooms, setActiveRooms]    = useState([]);
  const [completedRooms, setCompletedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewContext, setReviewContext]      = useState(null);
  const [toastMsg, setToastMsg]               = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [activeRes, completedRes] = await Promise.all([
        api.enrollment.getStudentEnrollments('active').catch(() => null),
        api.enrollment.getStudentEnrollments('completed').catch(() => null),
      ]);

      const toList = (res) => {
        const raw = res?.docs || res?.data?.docs || res?.data || res || [];
        return Array.isArray(raw) ? raw : [];
      };

      // Filter out null entries where classroom population failed
      const safeMap = (list) => toList(list).map(mapEnrollment).filter(Boolean);

      setActiveRooms(safeMap(activeRes));
      setCompletedRooms(safeMap(completedRes));
    } catch (err) {
      console.error('Failed to load enrollments:', err);
      setError('Failed to load your classrooms. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Learning — TrueEd';
    window.scrollTo(0, 0);
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleOpenReview = (room) => {
    setReviewContext(room);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (reviewData) => {
    if (!reviewContext) return;
    try {
      await api.enrollment.submitReview(
        reviewContext.enrollmentId,
        reviewData.rating,
        reviewData.text || reviewData.comment || ''
      );
      setReviewModalOpen(false);
      setReviewContext(null);
      showToast('✅ Review submitted successfully!');
      // Mark as reviewed locally
      setCompletedRooms(prev =>
        prev.map(r => r.enrollmentId === reviewContext.enrollmentId ? { ...r, hasReview: true } : r)
      );
    } catch (err) {
      showToast(err.message || 'Failed to submit review.');
    }
  };

  const renderLoading = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map(i => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      ))}
    </div>
  );

  const renderEmpty = (icon, title, subtitle, linkTo, linkLabel) => (
    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
      <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
        {icon}
      </div>
      <h3 className="font-sora font-bold text-navy text-xl mb-3">{title}</h3>
      <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">{subtitle}</p>
      {linkTo && (
        <Link to={linkTo} className="inline-block px-8 py-3.5 bg-navy text-white rounded-xl font-bold shadow-sm hover:bg-navy-light transition">
          {linkLabel}
        </Link>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 animate-fadeIn">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 z-[100] animate-slide-up-sm">
          {toastMsg}
        </div>
      )}

      {/* Header & Tabs */}
      <div>
        <h1 className="font-sora text-3xl md:text-4xl font-extrabold text-navy mb-8">My Learning</h1>

        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar">
          {[
            { id: 'active', label: `Active Classrooms${activeRooms.length > 0 ? ` (${activeRooms.length})` : ''}` },
            { id: 'completed', label: `Completed Classrooms${completedRooms.length > 0 ? ` (${completedRooms.length})` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-8 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab.id ? 'text-navy' : 'text-slate-500 hover:text-navy'}`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-navy rounded-t-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-slide-up-sm">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-700 font-semibold text-sm">{error}</p>
            <button onClick={fetchEnrollments} className="ml-auto text-xs font-bold text-red-600 hover:underline">Retry</button>
          </div>
        )}

        {/* Active Classrooms Tab */}
        {activeTab === 'active' && (
          loading ? renderLoading() :
          activeRooms.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeRooms.map(room => (
                <div key={room.enrollmentId} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-navy/20 transition-all shadow-sm flex flex-col h-full relative group">

                  {room.badges && room.badges.length > 0 && (
                    <div className="absolute -top-3 -right-2 flex flex-col gap-1.5 items-end z-10">
                      {room.badges.map((badge, idx) => (
                        <span key={idx} className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider flex items-center ${getBadgeStyle(badge)}`}>
                          {getBadgeIcon(badge)} {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mb-4">
                    <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 inline-block">
                      {room.subject}
                    </span>
                    <h3 className="font-sora font-bold text-xl text-navy mb-1 line-clamp-2 pr-8">{room.name}</h3>
                    <p className="text-sm font-medium text-slate-500">by {room.teacher}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 space-y-4 flex-1">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Progress</span>
                        <span className="font-sora font-bold text-navy text-sm">{room.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-navy h-2 rounded-full transition-all" style={{ width: `${room.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Schedule</p>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-500" /> {room.nextLiveClass}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Classes Attended</p>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {room.attendance}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <Link to={`/student/lobby/${room.id}`} className="flex-1 py-3 bg-navy text-white font-bold text-sm text-center rounded-xl hover:bg-navy-light transition shadow-sm flex items-center justify-center gap-2">
                      <PlayCircle className="w-4 h-4" /> Continue Learning
                    </Link>
                    <Link to={`/classroom/${room.id}`} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm text-center rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" /> View Classroom
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : renderEmpty(
            <Monitor className="w-10 h-10" />,
            'You are not enrolled in any active classrooms yet',
            'Discover top teachers and enroll in classrooms to start your learning journey.',
            '/student/discover',
            'Discover Classrooms'
          )
        )}

        {/* Completed Classrooms Tab */}
        {activeTab === 'completed' && (
          loading ? renderLoading() :
          completedRooms.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedRooms.map(room => (
                <div key={room.enrollmentId} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-navy/20 transition-all shadow-sm flex flex-col h-full relative group">

                  {room.certificateAvailable && (
                    <div className="absolute -top-3 -right-2 z-10">
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider flex items-center ${getBadgeStyle('certificate available')}`}>
                        {getBadgeIcon('certificate available')} Certificate Available
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">
                        {room.subject}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Completed
                      </span>
                    </div>
                    <h3 className="font-sora font-bold text-xl text-slate-700 mb-1 line-clamp-2 pr-8">{room.name}</h3>
                    <p className="text-sm font-medium text-slate-500">by {room.teacher}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 space-y-4 flex-1">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Final Progress</span>
                        <span className="font-sora font-bold text-emerald-600 text-sm">100%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Completion Date</p>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" /> {room.completionDate || 'Completed'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to={`/classroom/${room.id}`} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm text-center rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" /> View Classroom
                      </Link>
                      <Link to={`/classroom/${room.id}?tab=resources`} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm text-center rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2">
                        <BookOpen className="w-4 h-4" /> View Resources
                      </Link>
                    </div>
                    {room.certificateAvailable && (
                      <button onClick={() => alert('Downloading Certificate...')} className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm text-center rounded-xl hover:bg-emerald-100 transition shadow-sm flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Download Certificate
                      </button>
                    )}

                    {/* Review Section */}
                    <div className="pt-4 mt-2 border-t border-slate-100">
                      {room.hasReview ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <div className="flex gap-0.5 mb-1 text-amber-400">
                              {[1,2,3,4,5].map(star => (
                                <Star key={star} className="w-3.5 h-3.5 fill-amber-400" />
                              ))}
                            </div>
                            <p className="text-xs font-bold text-slate-700">Review Submitted</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenReview(room)}
                          className="w-full py-3 bg-white border border-slate-200 text-navy font-bold text-sm text-center rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2"
                        >
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : renderEmpty(
            <Sparkles className="w-10 h-10" />,
            "You haven't completed any classrooms yet",
            "Keep learning! Your successfully completed courses and certificates will appear here.",
            null,
            null
          )
        )}
      </div>

      {/* Student Review Modal */}
      <StudentReviewModal
        isOpen={reviewModalOpen}
        onClose={() => { setReviewModalOpen(false); setReviewContext(null); }}
        onSubmit={handleSubmitReview}
        classroom={reviewContext}
        existingReview={null}
      />
    </div>
  );
}
