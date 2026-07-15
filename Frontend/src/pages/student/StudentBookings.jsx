import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Award, Star, BookOpen, Compass } from 'lucide-react';
import enrollmentService from '@/services/enrollment.service';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import StarRating from '@/components/shared/StarRating';
import { formatCurrency } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const StudentBookings = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('active'); // active, completed, all
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);
  const [selectedClassroomTitle, setSelectedClassroomTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleOpenReview = (enrollmentId, classroomTitle) => {
    setSelectedEnrollmentId(enrollmentId);
    setSelectedClassroomTitle(classroomTitle);
    setRating(5);
    setComment('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }
    setSubmittingReview(true);
    try {
      await enrollmentService.submitReview(selectedEnrollmentId, { rating, comment });
      toast.success('Thank you for your review!');
      setShowReviewModal(false);
      loadBookings();
    } catch (err) {
      toast.error(err?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await enrollmentService.getStudentEnrollments({
        page,
        limit: 10,
        tab,
      });
      const payload = data?.data ?? data;
      setItems(payload?.items ?? payload?.docs ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      toast.error(err?.message || 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(1);
  };

  return (
    <div className="font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">My Learning &amp; Bookings</h1>
          <p className="text-sm text-muted mt-1">Manage and access your enrolled classrooms.</p>
        </div>
        <Link
          to="/student/discover"
          className="bg-navy text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-navy-hover transition text-center"
        >
          Find Tutors
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-100 pb-3 overflow-x-auto hide-scrollbar">
        {[
          { id: 'active', label: 'Active Classrooms' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All Enrollments' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              tab === t.id
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-brand-sm">
          <Compass className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-sora font-bold text-navy text-lg mb-2">No classrooms found</h3>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            You don't have any {tab === 'active' ? 'active' : tab === 'completed' ? 'completed' : ''} classrooms yet.
          </p>
          <Link
            to="/student/discover"
            className="px-6 py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:shadow-md transition inline-block"
          >
            Discover Classrooms
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((enrollment) => {
            const classroom = enrollment.classroomId;
            if (!classroom) return null;

            return (
              <div
                key={enrollment._id}
                className="bg-white rounded-xl border border-slate-100 p-5 shadow-brand-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-brand transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                    {classroom.thumbnailUrl ? (
                      <img src={classroom.thumbnailUrl} alt={classroom.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-sora font-extrabold text-navy text-xl">
                        {classroom.subject?.[0] || 'C'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky/10 text-sky uppercase tracking-wide">
                        {classroom.subject}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                        enrollment.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-navy/10 text-navy'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                    <h3 className="font-sora font-bold text-navy text-base leading-snug mb-1">
                      {classroom.title}
                    </h3>
                    <p className="text-xs text-muted mb-2">
                      by <strong className="text-slate-700 font-semibold">{classroom.teacherId?.name || 'Verified Teacher'}</strong>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {classroom.totalHoursPlanned}h total
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {classroom.mode === 'online' ? 'Online' : 'Offline'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> Joined {formatDate(enrollment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex-wrap shrink-0">
                  <div className="text-left md:text-right mr-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fees Paid</p>
                    <p className="font-sora font-extrabold text-navy">
                      {formatCurrency((enrollment.feesPaidPaise || classroom.feesPaise || 0) / 100)}
                    </p>
                  </div>
                  {enrollment.status === 'completed' && !enrollment.reviewId && (
                    <button
                      onClick={() => handleOpenReview(enrollment._id, classroom.title)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-amber hover:bg-amber-hover text-navy text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Star size={14} className="fill-current" /> Leave Review
                    </button>
                  )}
                  <Link
                    to={`/classroom/${classroom._id}`}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-hover transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <BookOpen size={14} /> Enter Classroom
                  </Link>
                </div>
              </div>
            );
          })}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-sora text-xl font-bold text-navy mb-1">Review Classroom</h3>
            <p className="text-slate-500 text-sm mb-6">Share your learning experience in <strong className="text-navy">{selectedClassroomTitle}</strong></p>
            
            <form onSubmit={handleReviewSubmit}>
              <div className="flex gap-2 justify-center mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 p-1"
                  >
                    <i className={`text-3xl ${rating >= star ? 'fa-solid fa-star text-amber' : 'far fa-star text-slate-300'}`} />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike? How was the teaching style? (Optional)"
                className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-navy focus:ring-1 focus:ring-navy text-sm placeholder-slate-400 resize-none mb-6 outline-none transition-all"
                maxLength={1000}
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-navy hover:bg-navy-hover text-white rounded-xl text-sm font-bold transition shadow-lg flex items-center justify-center gap-2"
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <>
                      <Spinner size="sm" /> Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBookings;
