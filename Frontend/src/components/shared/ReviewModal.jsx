import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const ReviewModal = ({ isOpen, onClose, teacherId, enrollmentId, existingReview, onReviewSubmit }) => {
  const { user } = useAuth();
  
  const defaultCategories = {
    teachingQuality: 0,
    subjectKnowledge: 0,
    communication: 0,
    punctuality: 0,
    doubtSolving: 0,
  };

  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categories, setCategories] = useState(defaultCategories);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');

  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setOverallRating(existingReview.overallRating || 0);
        setCategories(existingReview.categories || defaultCategories);
        setReviewText(existingReview.text || '');

        const createdDate = new Date(existingReview.createdAt).getTime();
        const now = Date.now();
        const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
          setIsReadOnly(true);
        } else {
          setIsReadOnly(false);
        }
      } else {
        setOverallRating(0);
        setCategories(defaultCategories);
        setReviewText('');
        setIsReadOnly(false);
      }
      setError('');
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat, value) => {
    if (isReadOnly) return;
    setCategories(prev => ({ ...prev, [cat]: value }));
  };

  const handleSubmit = () => {
    if (isReadOnly) {
      onClose();
      return;
    }

    if (overallRating === 0) {
      setError('Please provide an overall rating.');
      return;
    }

    const reviewData = {
      id: existingReview ? existingReview.id : `rev_${Date.now()}`,
      teacherId,
      studentId: user?.id || 'student-1',
      studentName: user?.name || 'Student',
      studentInitials: user?.initials || 'ST',
      enrollmentId,
      overallRating,
      categories,
      text: reviewText,
      reply: existingReview ? existingReview.reply : null,
      createdAt: existingReview ? existingReview.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: true
    };

    onReviewSubmit(reviewData);
  };

  const categoryLabels = {
    teachingQuality: 'Teaching Quality',
    subjectKnowledge: 'Subject Knowledge',
    communication: 'Communication',
    punctuality: 'Punctuality',
    doubtSolving: 'Doubt Solving'
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden my-auto relative">
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-sora font-bold text-xl text-navy">
              {isReadOnly ? 'Your Review' : 'Rate Teacher'}
            </h2>
            {isReadOnly && (
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Reviews cannot be edited after 7 days.
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-navy transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-8 text-center">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Overall Rating</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => {
                    if (isReadOnly) return;
                    setOverallRating(star);
                  }}
                  className={`transition-transform ${isReadOnly ? 'cursor-default' : 'hover:scale-110'}`}
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= (hoverRating || overallRating) 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-200'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Detailed Ratings</p>
            
            {Object.keys(categories).map(cat => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">{categoryLabels[cat]}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleCategoryChange(cat, star)}
                    >
                      <Star 
                        className={`w-5 h-5 ${
                          star <= categories[cat] 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-200'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Review (optional)</p>
            <textarea
              value={reviewText}
              onChange={(e) => {
                if (isReadOnly) return;
                setReviewText(e.target.value.slice(0, 300));
              }}
              readOnly={isReadOnly}
              placeholder={isReadOnly ? "" : "Share your learning experience..."}
              className={`w-full h-24 p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy text-sm font-medium ${isReadOnly ? 'bg-slate-50 text-slate-500' : ''}`}
            />
            <div className="text-right text-xs text-slate-400 font-medium mt-1">
              {reviewText.length}/300
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          {!isReadOnly && (
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleSubmit}
            className="flex-1 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow-sm"
          >
            {isReadOnly ? 'Close' : 'Submit Review'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReviewModal;
