import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Star, EyeOff, Search, Filter } from 'lucide-react';
import adminService from '@/services/admin.service';
import Spinner from '@/components/shared/Spinner';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import { formatDate } from '@/utils/date.util';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [confirmHide, setConfirmHide] = useState(null);
  const [hiding, setHiding] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Admin reviews come through the reports dashboard/platform stats
      // We use getPlatformStats to check for review data, but reviews are fetched via public profiles
      // The admin has hideReview(reviewId) action
      // For listing, we'll show a note that review moderation is action-based (via reports queue)
      const { data } = await adminService.getReportsDashboard();
      const payload = data?.data ?? data;
      // Extract review-related reports
      setReviews(payload?.reviewReports ?? []);
      setTotalPages(1);
    } catch {
      toast.error('Could not load reviews data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    document.title = 'Review Moderation — TrueEd Admin';
    loadReviews();
  }, [loadReviews]);

  const handleHide = async () => {
    setHiding(true);
    try {
      await adminService.hideReview(confirmHide._id);
      toast.success('Review hidden successfully.');
      setConfirmHide(null);
      loadReviews();
    } catch (err) {
      toast.error(err?.message || 'Could not hide review');
    } finally {
      setHiding(false);
    }
  };

  return (
    <div className="font-inter pb-10">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-sora text-2xl font-extrabold text-navy">Review Moderation</h1>
          <p className="text-sm text-muted mt-1">
            Hide inappropriate or misleading reviews reported by teachers.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-brand-sm mb-6">
        <Star className="mx-auto text-amber-400 mb-3" size={40} />
        <h3 className="font-sora font-bold text-navy text-lg mb-2">Review Moderation</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
          Reviews flagged through teacher reports appear here. When a teacher reports a review, you can hide it using the review ID after investigating.
        </p>
        <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
          Use the Reports section to find flagged reviews, then hide them here.
        </p>
      </div>

      {/* Quick action — hide by ID */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-brand-sm p-6">
        <h2 className="font-sora font-bold text-navy text-sm mb-4">Hide a Review by ID</h2>
        <HideReviewForm adminService={adminService} />
      </div>

      {/* Confirm modal */}
      <Modal
        isOpen={!!confirmHide}
        onClose={() => setConfirmHide(null)}
        title="Hide Review"
        footer={
          <>
            <button onClick={() => setConfirmHide(null)} className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
            <button onClick={handleHide} disabled={hiding} className="px-4 py-2.5 bg-error hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md">
              {hiding ? 'Hiding...' : 'Yes, Hide Review'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Are you sure you want to hide this review? It will no longer be visible to students or teachers.</p>
      </Modal>
    </div>
  );
};

const HideReviewForm = ({ adminService }) => {
  const [reviewId, setReviewId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleHide = async (e) => {
    e.preventDefault();
    if (!reviewId.trim()) { toast.error('Enter a review ID'); return; }
    if (!window.confirm(`Hide review ${reviewId.trim()}? This cannot be undone.`)) return;
    setSubmitting(true);
    try {
      await adminService.hideReview(reviewId.trim());
      toast.success('Review hidden successfully!');
      setReviewId('');
    } catch (err) {
      toast.error(err?.message || 'Could not hide review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleHide} className="flex gap-3">
      <input
        type="text"
        value={reviewId}
        onChange={(e) => setReviewId(e.target.value)}
        placeholder="Paste Review ObjectId..."
        className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy"
      />
      <button
        type="submit"
        disabled={submitting || !reviewId.trim()}
        className="px-5 py-2.5 bg-error text-white text-sm font-bold rounded-xl hover:bg-red-700 transition shadow-md disabled:opacity-50 flex items-center gap-2"
      >
        <EyeOff size={14} /> {submitting ? 'Hiding...' : 'Hide'}
      </button>
    </form>
  );
};

export default AdminReviews;
