import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';

const StudentReviewModal = ({ isOpen, onClose, onSubmit, classroom, existingReview }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating || 0);
        setReviewText(existingReview.text || '');
        setHoverRating(0);
        setIsAnonymous(existingReview.isAnonymous || false);
      } else {
        setRating(0);
        setReviewText('');
        setHoverRating(0);
        setIsAnonymous(false);
      }
    }
  }, [isOpen, existingReview]);

  if (!isOpen || !classroom) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a star rating");
      return;
    }
    onSubmit({
      rating,
      text: reviewText.trim(),
      isAnonymous
    });
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[7000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-scale-in overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-sora font-bold text-xl text-navy">
            {existingReview ? 'Edit Review' : 'Leave a Review'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-sm text-slate-500 mb-1">How was your experience with</p>
            <p className="font-bold text-navy">{classroom.teacher}</p>
            <p className="text-xs font-medium text-sky-600 bg-sky-50 inline-block px-2 py-0.5 rounded mt-1">{classroom.name}</p>
          </div>

          <div className="mb-8">
            <label className="block text-center text-sm font-bold text-slate-700 mb-3">Overall Rating</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transform transition hover:scale-110 active:scale-95"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      (hoverRating || rating) >= star 
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm' 
                        : 'fill-slate-100 text-slate-200'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 relative">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" /> Written Review
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
              placeholder="Share your learning experience with this teacher..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:border-navy focus:bg-white transition resize-none h-32"
            />
            <p className="text-xs font-medium text-slate-400 text-right mt-1">
              {reviewText.length}/500
            </p>
          </div>

          <div className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input 
                  type="checkbox" 
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-navy focus:ring-navy cursor-pointer peer"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 group-hover:text-navy transition">Hide my name publicly</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Your review will appear as "Verified Student".</p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-[1] py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-[2] py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReviewModal;
