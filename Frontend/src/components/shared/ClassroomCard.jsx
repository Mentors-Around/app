import { Link } from 'react-router-dom';
import { Calendar, Monitor, Star } from 'lucide-react';

export default function ClassroomCard({ room }) {
  // Badges structure expects an array, max 2 for display
  const displayBadges = Array.isArray(room.badges) ? room.badges.slice(0, 2) : [];

  const getBadgeStyle = (badge) => {
    switch (badge.toLowerCase()) {
      case 'recommended':
        return 'bg-amber-100 text-amber-700 shadow-sm';
      case 'trending':
        return 'bg-sky-100 text-sky-700 shadow-sm';
      case 'top rated':
        return 'bg-[#FEF3C7] text-[#92400E] shadow-sm';
      case 'new':
        return 'bg-emerald-100 text-emerald-700 shadow-sm';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getBadgeIcon = (badge) => {
    switch (badge.toLowerCase()) {
      case 'recommended': return '⭐';
      case 'trending': return '🔥';
      case 'top rated': return '🏆';
      case 'new': return '✨';
      default: return '✦';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-navy/30 hover-lift shadow-brand group flex flex-col h-full relative">
      {/* Badges Overlay */}
      {displayBadges.length > 0 && (
        <div className="absolute -top-3 -right-2 flex flex-col gap-1.5 items-end z-10 pointer-events-none">
          {displayBadges.map((badge, idx) => (
            <span key={idx} className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 ${getBadgeStyle(badge)}`}>
              <span>{getBadgeIcon(badge)}</span> {badge}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider">
          {room.subject} • {room.classLevel || 'General'}
        </span>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
           room.unlimitedStudents ? 'bg-[#DCFCE7] text-[#15803D]' : 
           ((room.students || room.enrolled || 0) >= (room.capacity || room.maxStudents || 0) ? 'bg-red-100 text-red-700' : 'bg-[#DCFCE7] text-[#15803D]')
         }`}>
          {room.unlimitedStudents ? 'Active' : ((room.students || room.enrolled || 0) >= (room.capacity || room.maxStudents || 0) ? 'Full' : 'Active')}
        </span>
      </div>
      
      <h4 className="font-bold text-navy text-base mb-1 line-clamp-2 pr-8">{room.name || room.title}</h4>
      
      {/* Teacher & Rating */}
      {room.teacher && (
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-semibold text-slate-500">by {room.teacher}</p>
          {(room.rating || room.reviews) && <span className="text-slate-300 text-xs">•</span>}
          {(room.rating || room.reviews) && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber text-amber" />
              <span className="text-sm font-bold text-navy">{room.rating || '4.5'}</span>
              <span className="text-xs font-medium text-slate-500">({room.reviews || 0})</span>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-2 mb-4 flex-1">
        <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {room.schedule || (room.scheduleDays?.length ? room.scheduleDays.join(', ') : 'TBD')} {room.startTime ? `• ${room.startTime} to ${room.endTime}` : ''}
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-bold uppercase tracking-wider rounded-md">
            <Monitor className="w-3 h-3" /> {room.mode || 'Online'}
          </span>
        </div>
        {!room.unlimitedStudents ? (
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            <i className="fa-solid fa-users text-slate-400 w-3.5" /> 
            {(room.capacity || room.maxStudents || 0) - (room.students || room.enrolled || 0)} Seats Available
          </p>
        ) : (
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            <i className="fa-solid fa-users text-slate-400 w-3.5" /> 
            Unlimited Seats
          </p>
        )}
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-slate-100 gap-2 mt-auto">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Price per Student</p>
          <p className="font-sora font-extrabold text-navy">₹{room.price || room.pricePerStudent}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/classroom/${room.id}`} className="px-3 py-2 bg-slate-100 text-navy text-xs font-bold rounded-lg shadow-sm hover:bg-slate-200 transition">
            View Details
          </Link>
          <Link to={`/classroom/${room.id}?query=true`} className="px-3 py-2 bg-navy text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition">
            Send Query
          </Link>
        </div>
      </div>
    </div>
  );
}
