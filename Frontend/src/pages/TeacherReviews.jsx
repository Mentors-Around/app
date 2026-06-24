import { useEffect } from 'react';
const TeacherReviews = () => {
  useEffect(() => { document.title = 'Reviews — TrueEd'; }, []);
  const dummyReviews = [
    { id: 1, student: 'Rahul Sharma', rating: 5, comment: 'Excellent teacher! Very clear explanations.', date: 'Oct 01' },
    { id: 2, student: 'Neha Gupta', rating: 4, comment: 'Good session, helped me understand complex topics.', date: 'Sep 28' },
  ];

  return (
    <div className="max-w-[1000px] mx-auto">
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">Student Reviews</h1>
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
        <div className="space-y-4">
          {dummyReviews.map(r => (
            <div key={r.id} className="border border-slate-100 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-navy">{r.student}</h4>
                <span className="text-xs text-muted">{r.date}</span>
              </div>
              <div className="flex gap-1 text-amber text-xs mb-2">
                {[...Array(5)].map((_, i) => <i key={i} className={i < r.rating ? "fa-solid fa-star" : "fa-regular fa-star"} />)}
              </div>
              <p className="text-sm text-slate-600">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TeacherReviews;
