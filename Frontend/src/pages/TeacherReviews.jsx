import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { Star, CheckCircle2, MessageSquare, Award, X } from 'lucide-react';

const TeacherReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    document.title = 'Student Reviews — TrueEd';
    loadReviews();
  }, [user]);

  const loadReviews = () => {
    const raw = localStorage.getItem('trueed_reviews');
    if (raw) {
      const allReviews = JSON.parse(raw);
      // Filter for this teacher (mock matching logic)
      const myReviews = allReviews.filter(r => r.teacherId === (user?.id || '1')).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(myReviews);
    }
  };

  const handleReplySubmit = (reviewId) => {
    if (!replyText.trim()) return;

    const raw = localStorage.getItem('trueed_reviews');
    if (raw) {
      let allReviews = JSON.parse(raw);
      const idx = allReviews.findIndex(r => r.id === reviewId);
      if (idx !== -1) {
        allReviews[idx].reply = replyText.trim();
        allReviews[idx].updatedAt = new Date().toISOString();
        localStorage.setItem('trueed_reviews', JSON.stringify(allReviews));
        setReplyingTo(null);
        setReplyText('');
        loadReviews(); // reload state
      }
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || r.overallRating || 0), 0) / reviews.length).toFixed(1) 
    : 0;

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">Student Reviews</h1>
      
      {/* Overview Card */}
      <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 flex-shrink-0">
            <span className="font-sora font-extrabold text-3xl text-amber-500">{avgRating}</span>
          </div>
          <div>
            <h2 className="font-bold text-navy text-lg mb-1">Overall Rating</h2>
            <div className="flex gap-1 text-amber-400 mb-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'}`} />
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-500">Based on {reviews.length} verified reviews</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.length > 0 ? reviews.map(r => (
          <div key={r.id} className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-lg">
                  {r.isAnonymous ? 'VS' : (r.studentInitials || r.studentName?.charAt(0) || 'S')}
                </div>
                <div>
                  <h4 className="font-bold text-navy flex items-center gap-2 text-base">
                    {r.isAnonymous ? 'Verified Student' : r.studentName}
                    {!r.isAnonymous && (r.verified !== false) && (
                      <span className="bg-sky-50 text-sky-600 border border-sky-100 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Verified Student
                      </span>
                    )}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-4 h-4 ${i <= (r.rating || r.overallRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                ))}
              </div>
            </div>

            {r.text && <p className="text-sm font-medium text-slate-700 leading-relaxed mb-6">{r.text}</p>}

            {/* Reply Section */}
            {r.reply ? (
              <div className="ml-8 bg-sky-50 p-4 rounded-xl border border-sky-100 relative">
                <div className="absolute -top-2 left-4 w-4 h-4 bg-sky-50 border-t border-l border-sky-100 rotate-45"></div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Award className="w-4 h-4" /> Your Reply
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700">{r.reply}</p>
              </div>
            ) : replyingTo === r.id ? (
              <div className="ml-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a professional reply to your student..."
                  className="w-full p-4 h-24 text-sm font-medium outline-none resize-none focus:bg-slate-50 transition"
                  autoFocus
                />
                <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-end gap-2">
                  <button 
                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleReplySubmit(r.id)}
                    disabled={!replyText.trim()}
                    className="px-6 py-2 bg-navy text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-navy-light transition shadow-sm"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button 
                  onClick={() => { setReplyingTo(r.id); setReplyText(''); }}
                  className="text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Reply to Review
                </button>
              </div>
            )}

          </div>
        )) : (
          <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="font-sora font-bold text-lg text-navy mb-2">No Reviews Yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              When students complete your classroom or 1-to-1 sessions, they will be prompted to leave a verified review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherReviews;
