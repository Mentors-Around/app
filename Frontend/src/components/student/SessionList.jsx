import { Link } from 'react-router-dom';

const SessionList = ({ sessions }) => (
  <div className="bg-white rounded-brand shadow-brand p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-sora font-semibold text-navy">Upcoming Sessions</h3>
      <Link to="/student/discover" className="text-xs text-sky font-medium hover:underline">View All</Link>
    </div>
    <div className="space-y-3">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-cream/60 transition">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: s.tutorColor }}
          >
            {s.tutorInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy truncate">{s.tutorName}</p>
            <p className="text-xs text-muted truncate">{s.subject} · {s.topic}</p>
            <p className="text-xs text-muted mt-0.5">
              <i className="fa-regular fa-calendar text-[10px] mr-1" />
              {s.date} · {s.time}
            </p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
            s.mode === 'Online' ? 'bg-sky/10 text-sky' : 'bg-amber/10 text-amber'
          }`}>
            {s.mode}
          </span>
        </div>
      ))}
    </div>
  </div>
);
export default SessionList;
