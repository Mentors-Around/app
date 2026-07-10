import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, EyeOff, Star } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';

export default function AdminReviews() {
  useEffect(() => { document.title = "Reviews — Admin Dashboard"; }, []);

  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('trueed_reviews');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [search, setSearch] = useState('');

  const filteredReviews = reviews.filter(r => 
    r.studentName.toLowerCase().includes(search.toLowerCase()) || 
    r.text.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      const updated = reviews.filter(r => r.id !== id);
      setReviews(updated);
      localStorage.setItem('trueed_reviews', JSON.stringify(updated));
    }
  };

  const handleToggleHide = (id) => {
    const updated = reviews.map(r => r.id === id ? { ...r, hidden: !r.hidden } : r);
    setReviews(updated);
    localStorage.setItem('trueed_reviews', JSON.stringify(updated));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Reviews</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Manage all student reviews and feedback.</p>
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
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Student</th>
                <th className="p-4">Teacher ID</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map(review => (
                <tr key={review.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition \${review.hidden ? 'opacity-60' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <TeacherAvatar teacherId={review.studentId} name={review.studentName} initials={review.studentInitials} className="w-8 h-8 text-xs" />
                      <span className="font-bold text-navy text-sm">{review.studentName}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-600 text-sm">Teacher {review.teacherId}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                      <Star className="w-4 h-4 fill-amber-400" /> {review.overallRating}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-slate-600 truncate max-w-[250px]" title={review.text}>{review.text}</p>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-600">{new Date(review.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="p-2 bg-slate-50 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleHide(review.id)}
                        className="p-2 bg-slate-50 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title={review.hidden ? "Unhide Review" : "Hide Review"}
                      >
                        {review.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(review.id)}
                        className="p-2 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredReviews.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No reviews found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
