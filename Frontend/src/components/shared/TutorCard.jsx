import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const getSubjectColor = (subject) => {
  const s = subject.toLowerCase();
  if (s.includes('math')) return { bg: 'bg-blue-50', text: 'text-blue-700' };
  if (s.includes('phys')) return { bg: 'bg-purple-50', text: 'text-purple-700' };
  if (s.includes('bio')) return { bg: 'bg-green-50', text: 'text-green-700' };
  if (s.includes('chem')) return { bg: 'bg-orange-50', text: 'text-orange-700' };
  if (s.includes('computer')) return { bg: 'bg-teal-50', text: 'text-teal-700' };
  if (s.includes('hindi')) return { bg: 'bg-pink-50', text: 'text-pink-700' };
  if (s.includes('english')) return { bg: 'bg-amber-50', text: 'text-amber-700' };
  return { bg: 'bg-sky-50', text: 'text-sky-700' };
};

const badgeConfig = {
  'Top Rated': { icon: '🏆', bg: 'bg-gradient-to-r from-navy to-navy-light text-white border border-transparent' },
  'Expert': { icon: '✦', bg: 'bg-amber-50 text-amber-700 border border-amber-300' },
  'Rising Star': { icon: '⭐', bg: 'bg-gradient-to-r from-sky to-blue-500 text-white border border-transparent' },
};

const TutorCard = ({ tutor }) => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const colors = getSubjectColor(tutor.subject);
  const badge = tutor.badge ? badgeConfig[tutor.badge] : null;

  return (
    <div 
      onClick={() => navigate(`/tutor/${tutor.id}`)}
      className={`bg-white rounded-brand border border-gray-200 overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col h-full group relative cursor-pointer ${tutor.badge === 'Expert' ? 'border-t-4 border-t-amber-400' : ''}`}
    >
      {/* Save Heart */}
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }}
        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
      >
        <i className={`${saved ? 'fa-solid text-error' : 'fa-regular text-slate-400'} fa-heart text-lg transition-colors`} />
      </button>

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5 pr-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-sora font-bold text-xl flex-shrink-0 bg-gradient-to-br from-navy to-blue-600 shadow-sm">
            {tutor.initials}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-sora font-extrabold text-navy text-lg leading-none">{tutor.name}</span>
              {tutor.verified && <i className="fa-solid fa-circle-check text-sky text-sm" title="Verified" />}
              {tutor.quickResponse && <span className="flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-600 rounded-full text-xs shadow-sm border border-amber-200" title="Quick Responder">⚡</span>}
            </div>
            
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colors.bg} ${colors.text} uppercase tracking-wider`}>
                {(tutor.dynamicSubjects && tutor.dynamicSubjects.length > 0) ? tutor.dynamicSubjects.join(', ') : tutor.subject}
                {(tutor.dynamicLevels && tutor.dynamicLevels.length > 0) ? ` • ${tutor.dynamicLevels.join(', ')}` : ''}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
              <i className="fa-solid fa-location-dot text-slate-400" /> {tutor.location}
            </div>
          </div>
        </div>

        {/* Badge Row */}
        <div className="min-h-[28px] mb-2">
          {badge && (
            <span className={`inline-flex text-xs px-2.5 py-1 rounded-md font-bold shadow-sm items-center gap-1.5 ${badge.bg}`}>
              <span>{badge.icon}</span> {tutor.badge}
            </span>
          )}
        </div>

        {/* Rating Row */}
        <div className="flex items-center gap-1 text-amber mb-4 flex-wrap hover:opacity-80 transition-opacity cursor-pointer">
          <span className="text-[15px] pb-0.5">★</span>
          <span className="text-sm font-bold text-navy ml-0.5">{tutor.rating}</span>
          <span className="text-slate-300 mx-1.5">•</span>
          <span className="text-sm text-slate-500 font-medium">{tutor.reviews} Reviews</span>
        </div>

        {/* Detail pills */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
            <i className="fa-regular fa-calendar text-slate-400" /> {tutor.experience}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
            <i className={`fa-solid ${tutor.mode.includes('Online') ? 'fa-laptop' : 'fa-house'} text-slate-400`} /> {tutor.mode}
          </span>
          {tutor.promo && !tutor.promo.toLowerCase().includes('free trial') && !tutor.promo.toLowerCase().includes('first class') && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-amber/10 border border-amber/20 text-amber-hover font-bold px-2.5 py-1 rounded-full">
              <i className="fa-solid fa-gift" /> {tutor.promo}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {tutor.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 pt-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-sora font-extrabold text-navy text-2xl tracking-tight">₹{tutor.price}</span>
            <span className="text-xs font-semibold text-muted ml-1">/ hr</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Link
            to={`/tutor/${tutor.id}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full py-3 bg-gradient-to-r from-navy to-blue-600 text-white rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-regular fa-user" /> View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};
export default TutorCard;
