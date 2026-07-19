import { useState } from 'react';

const BookingsList = ({ bookings, onAccept, onReject }) => {
  const statusStyle = {
    confirmed: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
  };

  return (
    <div className="bg-white rounded-brand shadow-brand">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <h3 className="font-sora font-semibold text-navy">Today's Bookings</h3>
        <span className="text-xs text-muted bg-cream px-2.5 py-1 rounded-full">{bookings.length} bookings</span>
      </div>
      <div>
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-cream/40 transition">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: b.studentColor }}
            >
              {b.studentInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy truncate">{b.studentName}</p>
              <p className="text-xs text-muted">{b.subject} · {b.topic}</p>
              <p className="text-xs text-muted mt-0.5">
                <i className="fa-regular fa-clock text-[10px] mr-1" />
                {b.date} · {b.time} · {b.duration}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[b.status] || 'bg-slate-100 text-muted'}`}>
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </span>
              {b.status === 'pending' && (
                <div className="flex gap-1">
                  <button onClick={() => onAccept(b.id)} className="text-xs px-2.5 py-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 font-semibold transition">Accept</button>
                  <button onClick={() => onReject(b.id)} className="text-xs px-2.5 py-1.5 bg-error/10 text-error rounded-lg hover:bg-error/20 font-semibold transition">Decline</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default BookingsList;
