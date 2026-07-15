import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Star, MessageSquare, Award, ThumbsUp, Send, ChevronRight,
} from 'lucide-react';
import teacherService from '@/services/teacher.service';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import { formatDate } from '@/utils/date.util';

const StarRow = ({ count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 w-8">{pct}%</span>
    </div>
  );
};

const StarDisplay = ({ rating, size = 14 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={i <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
      />
    ))}
  </div>
);

const TeacherReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // Summary stats computed from first page load
  const [ratingBreakdown, setRatingBreakdown] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [avgRating, setAvgRating] = useState(0);

  // Reply modal
  const [replyModal, setReplyModal] = useState(null); // { review }
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await teacherService.getReviews({ page, limit: 10 });
      const payload = data?.data ?? data;
      const items = payload?.items ?? payload?.docs ?? [];
      setReviews(items);
      setTotalPages(payload?.totalPages ?? 1);
      setTotalDocs(payload?.totalDocs ?? items.length);

      // Build rating breakdown from full result set (first page gives a sample)
      if (page === 1) {
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let sum = 0;
        items.forEach((r) => {
          const star = Math.round(r.rating ?? r.overallRating ?? 0);
          if (star >= 1 && star <= 5) breakdown[star]++;
          sum += r.rating ?? r.overallRating ?? 0;
        });
        setRatingBreakdown(breakdown);
        setAvgRating(items.length > 0 ? (sum / items.length).toFixed(1) : 0);
      }
    } catch (err) {
      toast.error(err?.message || 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    document.title = 'Student Reviews — TrueEd';
    loadReviews();
  }, [loadReviews]);

  const handleOpenReply = (review) => {
    setReplyModal(review);
    setReplyText(review.replyText || '');
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) { toast.error('Reply cannot be empty.'); return; }
    setSubmittingReply(true);
    try {
      await teacherService.replyToReview(replyModal._id, { replyText: replyText.trim() });
      toast.success('Reply posted!');
      setReplyModal(null);
      loadReviews();
    } catch (err) {
      toast.error(err?.message || 'Could not post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const totalBreakdownCount = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="font-inter max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="font-sora text-2xl font-extrabold text-navy">Student Reviews</h1>
        <p className="text-sm text-muted mt-1">
          See what your students say and respond professionally to their feedback.
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-6 mb-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex items-center gap-5 shrink-0">
          <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center">
            <span className="font-sora font-extrabold text-3xl text-amber-500">{avgRating}</span>
          </div>
          <div>
            <StarDisplay rating={Math.round(Number(avgRating))} size={18} />
            <p className="text-sm font-semibold text-slate-500 mt-1.5">
              {totalDocs} verified review{totalDocs !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 w-4">{star}</span>
              <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: totalBreakdownCount > 0 ? `${((ratingBreakdown[star] || 0) / totalBreakdownCount) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 w-4">{ratingBreakdown[star] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-brand-sm">
          <Star className="mx-auto text-slate-200 mb-3" size={44} />
          <p className="text-sm font-bold text-navy">No reviews yet</p>
          <p className="text-xs text-muted mt-1">
            When students complete your classrooms, they are prompted to leave verified reviews.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const studentName = r.studentId?.name || 'Verified Student';
            const initials = studentName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            const rating = r.rating ?? r.overallRating ?? 0;

            return (
              <div key={r._id} className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    {r.studentId?.avatarUrl ? (
                      <img src={r.studentId.avatarUrl} alt={studentName} className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-navy text-white rounded-full flex items-center justify-center font-sora font-bold text-sm shrink-0">
                        {initials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-sora font-bold text-navy text-sm">{studentName}</p>
                        <span className="text-[9px] font-bold text-sky bg-sky/10 px-2 py-0.5 rounded uppercase tracking-wider">
                          Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        {r.classroomId?.title} &middot; {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StarDisplay rating={rating} />
                </div>

                {/* Review text */}
                {r.text && (
                  <p className="text-sm text-slate-700 font-medium leading-relaxed mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    &ldquo;{r.text}&rdquo;
                  </p>
                )}

                {/* Sub-ratings if available */}
                {(r.teachingQuality || r.punctuality || r.communication) && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      { label: 'Teaching', val: r.teachingQuality },
                      { label: 'Punctuality', val: r.punctuality },
                      { label: 'Communication', val: r.communication },
                    ].filter((x) => x.val).map((x) => (
                      <div key={x.label} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{x.label}</span>
                        <StarDisplay rating={x.val} size={10} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply section */}
                {r.replyText ? (
                  <div className="ml-4 bg-navy/5 border border-navy/10 rounded-lg p-4 mt-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Award size={13} className="text-navy" />
                      <span className="text-[10px] font-bold text-navy uppercase tracking-wider">Your Reply</span>
                      {r.repliedAt && (
                        <span className="text-[9px] text-slate-400 font-semibold ml-1">&middot; {formatDate(r.repliedAt)}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{r.replyText}</p>
                    <button
                      onClick={() => handleOpenReply(r)}
                      className="mt-2 text-[10px] font-bold text-sky hover:text-navy transition"
                    >
                      Edit Reply
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleOpenReply(r)}
                      className="flex items-center gap-1.5 text-xs font-bold text-sky hover:text-navy bg-sky/5 hover:bg-sky/10 px-3 py-2 rounded-lg transition"
                    >
                      <MessageSquare size={13} /> Reply to Review
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <Modal
          isOpen={!!replyModal}
          onClose={() => setReplyModal(null)}
          title="Reply to Review"
          footer={
            <>
              <button
                onClick={() => setReplyModal(null)}
                className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                disabled={submittingReply}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                className="px-4 py-2.5 bg-navy hover:bg-navy-hover text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
                disabled={submittingReply}
              >
                {submittingReply ? <Spinner size="sm" /> : <><Send size={12} /> Post Reply</>}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 italic">
              &ldquo;{replyModal.text}&rdquo;
              <div className="mt-2 not-italic">
                <StarDisplay rating={replyModal.rating ?? replyModal.overallRating ?? 0} size={12} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                Your Professional Reply
              </label>
              <textarea
                placeholder="Thank the student, address their feedback professionally, and show you care about their growth..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full h-32 p-4 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy resize-none transition-all"
                maxLength={1000}
                autoFocus
              />
              <p className="text-[10px] text-slate-400 text-right mt-1">{replyText.length}/1000</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeacherReviews;
