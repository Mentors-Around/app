import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useOverlay, useOverlayRefs } from '../../contexts/OverlayContext';
import { Search, Bell, X, Menu, CheckCircle, Calendar, CreditCard, MessageSquare, Check, CheckCheck } from 'lucide-react';
import TeacherAvatar from './TeacherAvatar';

const dummyTeachers = [
  { id: 1, name: 'Kavita Verma', subject: 'Mathematics', city: 'Bangalore' },
  { id: 2, name: 'Arun Singh', subject: 'Physics', city: 'Delhi' },
  { id: 3, name: 'Sneha R', subject: 'English', city: 'Mumbai' },
  { id: 4, name: 'Rahul Sharma', subject: 'Chemistry', city: 'Pune' },
  { id: 5, name: 'Priya Patel', subject: 'Biology', city: 'Ahmedabad' },
  { id: 6, name: 'Amit Kumar', subject: 'Computer Science', city: 'Hyderabad' },
  { id: 7, name: 'Neha Gupta', subject: 'Hindi', city: 'Lucknow' },
  { id: 8, name: 'Vikram Joshi', subject: 'Mathematics', city: 'Jaipur' },
  { id: 9, name: 'Anjali Desai', subject: 'Physics', city: 'Surat' },
  { id: 10, name: 'Sanjay Reddy', subject: 'English', city: 'Chennai' }
];

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = user?.initials || 'U';

  const sanitize = (str) => str.replace(/<[^>]*>/g, '');

  const [query, setQuery] = useState('');
  
  const { activeOverlayId, toggleOverlay, closeOverlay } = useOverlay();
  const notifRefs = useOverlayRefs('topbar-notif');
  const mobileSearchRefs = useOverlayRefs('topbar-mobile-search');
  const searchDropdownRefs = useOverlayRefs('topbar-search');

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.notification.getAll().catch(() => []);
        const list = Array.isArray(res) ? res : (res?.docs || res?.notifications || []);
        if (list.length > 0) {
          const mapped = list.map(n => ({
            id: n._id || n.id,
            type: n.type || 'announcement',
            text: n.message || n.title || n.text || 'New notification',
            time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            isRead: !!n.isRead,
            link: n.link || (user?.role === 'teacher' ? '/teacher/queries' : '/student/my-queries'),
          }));
          setNotifications(mapped);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.warn('Failed to load notifications:', err);
      }
    };
    if (user) fetchNotifs();
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await api.notification.markAllAsRead().catch(() => null);
    } catch (e) {}
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markSingleAsRead = async (id) => {
    try {
      await api.notification.markAsRead(id).catch(() => null);
    } catch (e) {}
    setNotifications(notifications.map(x => x.id === id ? { ...x, isRead: true } : x));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = query.trim() === '' ? [] : dummyTeachers.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase()) || 
    t.subject.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (query.trim() !== '') {
      if (activeOverlayId !== 'topbar-search' && activeOverlayId !== 'topbar-mobile-search') {
         // Optionally auto open search dropdown if they type, but toggleOverlay handles this if they focus
      }
    }
  }, [query]);

  const handleResultClick = (subject) => {
    setQuery('');
    closeOverlay();
    navigate(`/student/discover?subject=${encodeURIComponent(subject)}`);
  };

  const SearchDropdown = ({ isMobile }) => {
    if (!query || (isMobile ? activeOverlayId !== 'topbar-mobile-search' : activeOverlayId !== 'topbar-search')) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-brand shadow-brand-xl border border-slate-100 overflow-hidden py-2 z-50 animate-slide-up-sm">
        <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Results</p>
        {filtered.length > 0 ? (
          filtered.map(t => (
            <button
              key={t.id}
              onClick={() => handleResultClick(t.subject)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition flex flex-col group"
            >
              <span className="font-semibold text-sm text-navy group-hover:text-sky transition-colors">{t.name}</span>
              <span className="text-xs text-muted font-medium flex items-center gap-1.5 mt-0.5">
                <span className="bg-sky/10 text-sky px-1.5 py-0.5 rounded text-[10px]">{t.subject}</span>
                <span>·</span>
                <i className="fa-solid fa-location-dot text-[10px]" /> {t.city}
              </span>
            </button>
          ))
        ) : (
          <div className="px-4 py-4 text-center text-sm text-muted">
            No results found for "<span className="font-semibold text-navy">{query}</span>"
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 relative">
      {/* Left section: Hamburger (Always visible on mobile, hidden on desktop) */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick} 
          className="block md:hidden bg-[#1B2D5B] text-white p-2 rounded-md hover:bg-blue-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Right section: Search, Bell, Avatar */}
      <div className="flex items-center gap-3 md:gap-4 relative">
        
        {/* Desktop Search */}
        <div className="hidden md:block relative w-64 lg:w-80" ref={searchDropdownRefs.triggerRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 peer-focus:text-navy transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search subjects, teachers..."
            value={query}
            maxLength={50}
            onFocus={() => {
               if (activeOverlayId !== 'topbar-search') toggleOverlay('topbar-search');
            }}
            onChange={(e) => {
               setQuery(sanitize(e.target.value));
               if (activeOverlayId !== 'topbar-search') toggleOverlay('topbar-search');
            }}
            className="peer w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-navy rounded-full py-2 pl-9 pr-9 text-sm text-navy font-medium outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <div ref={searchDropdownRefs.overlayRef}>
            <SearchDropdown isMobile={false} />
          </div>
        </div>

        {/* Mobile Search Icon */}
        <button 
          ref={mobileSearchRefs.triggerRef}
          className="block md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-navy hover:bg-cream transition"
          onClick={() => toggleOverlay('topbar-mobile-search')}
          aria-label="Open search"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="relative">
          <button 
            ref={notifRefs.triggerRef}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-cream transition text-slate-500 hover:text-navy group" 
            aria-label="View notifications"
            onClick={() => toggleOverlay('topbar-notif')}
          >
            <Bell className="w-5 h-5 group-hover:animate-shake" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-white" />
            )}
          </button>
          
          {activeOverlayId === 'topbar-notif' && (
            <div ref={notifRefs.overlayRef} className="absolute top-full right-[-80px] md:right-0 mt-2 w-80 bg-white rounded-brand shadow-brand-xl border border-slate-100 overflow-hidden z-50 animate-slide-up-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-navy">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{unreadCount} New</span>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition flex gap-3 ${!n.isRead ? 'bg-sky-50/30' : ''}`}>
                      <div className="mt-0.5 shrink-0">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        {n.link ? (
                          <Link to={n.link} onClick={() => closeOverlay()} className="text-sm font-semibold text-slate-700 hover:text-navy transition-colors">
                            {n.text}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-slate-700">{n.text}</p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{n.time || 'Recently'}</span>
                          {!n.isRead && (
                            <button onClick={() => markSingleAsRead(n.id)} className="text-[10px] text-sky font-bold hover:underline" title="Mark as read">
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                    <CheckCheck className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">You're all caught up!</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button onClick={() => { markAllAsRead(); closeOverlay(); }} className="text-[11px] font-bold text-slate-500 hover:text-navy transition">
                  Mark all as read
                </button>
                <Link to={`/${user?.role || 'student'}/notifications`} onClick={() => closeOverlay()} className="text-[11px] font-bold text-sky hover:text-navy transition">
                  View all
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <Link to={`/${user?.role || 'student'}/profile`} className="block hover:scale-105 transition-transform">
          <TeacherAvatar 
            teacherId={user?.id || '1'} 
            name={user?.name} 
            initials={initials} 
            className="w-9 h-9 text-sm" 
          />
        </Link>
      </div>

      {/* Mobile Search Full Width Dropdown */}
      <div 
        ref={mobileSearchRefs.overlayRef}
        className={`absolute left-0 right-0 bg-white border-b border-slate-200 px-4 py-3 md:hidden z-50 transition-all duration-300 origin-top ${activeOverlayId === 'topbar-mobile-search' ? 'top-16 opacity-100 visible' : 'top-12 opacity-0 invisible -translate-y-4 pointer-events-none'}`}>
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              maxLength={50}
              onChange={(e) => setQuery(sanitize(e.target.value))}
              className="w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-navy rounded-full py-2 pl-9 pr-8 text-sm text-navy font-medium outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button 
            onClick={() => { closeOverlay(); setQuery(''); }}
            className="px-3 text-sm font-semibold text-slate-500 hover:text-navy"
          >
            Cancel
          </button>
          
          <div className="absolute top-full left-0 right-0 w-full mt-2">
            <SearchDropdown isMobile={true} />
          </div>
        </div>
      </div>
    </header>
  );
};
export default Topbar;
