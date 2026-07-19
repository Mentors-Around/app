import { useState, useEffect } from 'react';
import { Search, Eye, EyeOff, Star, Loader2 } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import api from '../services/api.js';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllReviews({ search });
      const list = Array.isArray(data) ? data : (data?.docs || []);
      const mapped = list.map(item => ({
        id: item._id || item.id,
        studentId: item.studentId?._id || item.studentId || 's1',
        studentName: item.studentId?.name || item.studentName || 'Student',
        studentInitials: (item.studentId?.name || 'S')[0].toUpperCase(),
        teacherName: item.teacherId?.name || 'Teacher',
        classroomTitle: item.classroomId?.title || 'Classroom',
        overallRating: item.ratings?.overall || item.overallRating || item.rating || 5,
        text: item.comment || item.text || item.reviewText || 'No comment text provided.',
        isVisible: item.isVisible !== false,
        createdAt: item.createdAt || new Date().toISOString()
      }));
      setReviews(mapped);
    } catch (err) {
      console.warn('Failed to fetch reviews from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Reviews — Admin Dashboard";
    fetchReviews();
  }, [search]);

  const handleToggleHide = async (id, isVisible) => {
    try {
      if (isVisible) {
        await api.admin.hideReview(id, 'Moderated by Admin');
      }
      setReviews(reviews.map(r => r.id === id ? { ...r, isVisible: !isVisible } : r));
    } catch (err) {
      alert(err.message || 'Failed to update review visibility');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Platform Reviews & Moderation</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Monitor and moderate all student reviews across the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reviews..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading reviews...
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Teacher & Classroom</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Review Comment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition ${!review.isVisible ? 'opacity-50 bg-slate-50' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <TeacherAvatar teacherId={review.studentId} name={review.studentName} initials={review.studentInitials} className="w-8 h-8 text-xs" />
                        <span className="font-bold text-navy text-sm">{review.studentName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 text-sm">
                      {review.teacherName}
                      <span className="block text-xs text-slate-400">{review.classroomTitle}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star className="w-4 h-4 fill-amber-400" /> {review.overallRating}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-600 truncate max-w-[280px]" title={review.text}>{review.text}</p>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedReview(review)}
                          className="p-2 bg-slate-50 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-lg transition"
                          title="View Full Review"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleHide(review.id, review.isVisible)}
                          className={`p-2 rounded-lg transition ${review.isVisible ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          title={review.isVisible ? "Hide Review" : "Unhide Review"}
                        >
                          {review.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && reviews.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No reviews found on the platform.
            </div>
          )}
        </div>
      </div>

      {/* Review Inspection Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-slide-up-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-sora text-lg font-bold text-navy">Review Moderation Details</h3>
              <button 
                onClick={() => setSelectedReview(null)}
                className="text-slate-400 hover:text-navy text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TeacherAvatar teacherId={selectedReview.studentId} name={selectedReview.studentName} initials={selectedReview.studentInitials} className="w-10 h-10 text-sm" />
                  <div>
                    <h4 className="font-bold text-navy text-sm">{selectedReview.studentName}</h4>
                    <p className="text-xs text-slate-400">Classroom: {selectedReview.classroomTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full text-amber-600 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400" /> {selectedReview.overallRating} / 5
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Feedback</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedReview.text}</p>
              </div>
              <div className="text-xs font-semibold text-slate-400 flex justify-between">
                <span>Teacher: {selectedReview.teacherName}</span>
                <span>Date: {new Date(selectedReview.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className={`text-xs font-bold uppercase ${selectedReview.isVisible ? 'text-emerald-600' : 'text-amber-600'}`}>
                Status: {selectedReview.isVisible ? 'Visible' : 'Hidden'}
              </span>
              <button 
                onClick={() => setSelectedReview(null)}
                className="px-5 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy-light transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
