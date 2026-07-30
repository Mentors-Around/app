import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { useOverlay, useOverlayRefs } from '../../contexts/OverlayContext';
import { Search, Bell, X, Menu, CheckCircle, Calendar, CreditCard, MessageSquare, Check, CheckCheck, BookOpen } from 'lucide-react';
import TeacherAvatar from './TeacherAvatar';

// ── Bug Fix: getNotificationIcon was used but never defined — caused ErrorBoundary crash ──
const getNotificationIcon = (type) => {
  switch (type) {
    case 'query_enrolled':
    case 'accepted':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'payment':
    case 'payout':
      return <CreditCard className="w-4 h-4 text-sky-500" />;
    case 'reminder':
    case 'class_starting':
      return <Calendar className="w-4 h-4 text-amber-500" />;
    case 'reply':
    case 'doubt_answered':
      return <MessageSquare className="w-4 h-4 text-purple-500" />;
    case 'announcement':
    default:
      return <Bell className="w-4 h-4 text-indigo-500" />;
  }
};

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = user?.initials || 'U';

  const sanitize = (str) => str.replace(/<[^>]*>/g, '');

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ classrooms: [], teachers: [], students: [], admins: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef(null);
  
  const { activeOverlayId, toggleOverlay, closeOverlay } = useOverlay();
  const notifRefs = useOverlayRefs('topbar-notif');
  const mobileSearchRefs = useOverlayRefs('topbar-mobile-search');
  const searchDropdownRefs = useOverlayRefs('topbar-search');

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.notification.getAll().catch(() => null);
        if (!res) return;
        // Bug Fix: also check res?.results (paginated key from backend)
        const list = Array.isArray(res)
          ? res
          : (res?.docs || res?.results || res?.notifications || []);
        if (list.length > 0) {
          const mapped = list.map(n => ({
            id: n._id || n.id,
            type: n.type || 'announcement',
            text: n.message || n.title || n.text || 'New notification',
            time: n.createdAt
              ? new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
              : 'Recently',
            isRead: !!n.isRead,
            link: n.data?.url || (user?.role === 'teacher' ? '/teacher/queries' : '/student/my-queries'),
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
    // Mark all as read locally — unreadCount becomes 0 so the red dot disappears
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    closeOverlay();
  };

  const clearAllNotifications = async () => {
    try {
      await api.notification.clearAll?.().catch(() => null);
    } catch (e) {}
    setNotifications([]);
    closeOverlay();
  };

  const markSingleAsRead = async (id) => {
    try {
      await api.notification.markAsRead(id).catch(() => null);
    } catch (e) {}
    setNotifications(notifications.map(x => x.id === id ? { ...x, isRead: true } : x));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ── Bug Fix: Real API search with debounce (was using static dummyTeachers array) ──
  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSearchResults({ classrooms: [], teachers: [], students: [], admins: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.classroom.search(q.trim());
      const classrooms = res?.classrooms || [];
      const teachers = res?.teachers || [];
      const students = res?.students || [];
      const admins = res?.admins || [];
      setSearchResults({ 
        classrooms: classrooms.slice(0, 5), 
        teachers: teachers.slice(0, 5), 
        students: students.slice(0, 5),
        admins: admins.slice(0, 5)
      });
    } catch (err) {
      console.warn('Search failed:', err);
      setSearchResults({ classrooms: [], teachers: [], students: [], admins: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!query.trim()) {
      setSearchResults({ classrooms: [], teachers: [], students: [], admins: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [query, doSearch]);

  const handleResultClick = (item, type = 'classroom') => {
    setQuery('');
    setSearchResults({ classrooms: [], teachers: [], students: [], admins: [] });
    closeOverlay();
    if (type === 'teacher') {
      navigate(`/teacher/${item._id || item.id}`);
    } else if (type === 'student') {
      navigate(`/student/${item._id || item.id}`);
    } else {
      if (item?._id) {
        navigate(`/classroom/${item._id}`);
      } else if (item?.subject) {
        navigate(`/student/discover?subject=${encodeURIComponent(item.subject)}`);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setQuery('');
      setSearchResults({ classrooms: [], teachers: [] });
      closeOverlay();
      navigate(`/student/discover?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const formatFee = (paise) => {
    if (!paise) return '';
    return `₹${Math.round(paise / 100).toLocaleString('en-IN')}/mo`;
  };

  const SearchDropdown = ({ isMobile }) => {
    const isActive = isMobile
      ? activeOverlayId === 'topbar-mobile-search'
      : activeOverlayId === 'topbar-search';
    if (!query || !isActive) return null;

    const totalResults = (searchResults.classrooms?.length || 0) + (searchResults.teachers?.length || 0) + (searchResults.students?.length || 0) + (searchResults.admins?.length || 0);

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-brand shadow-brand-xl border border-slate-100 overflow-hidden py-2 z-50 animate-slide-up-sm max-h-96 overflow-y-auto">
        <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {searchLoading ? 'Searching...' : totalResults > 0 ? `${totalResults} result${totalResults > 1 ? 's' : ''}` : 'No results'}
        </p>
        {searchLoading ? (
          <div className="px-4 py-4 flex items-center justify-center gap-2 text-slate-400">
            <span className="w-4 h-4 border-2 border-slate-300 border-t-navy rounded-full animate-spin" />
            <span className="text-sm font-medium">Searching...</span>
          </div>
        ) : totalResults > 0 ? (
          <>
            {/* Classrooms Section */}
            {searchResults.classrooms?.length > 0 && (
              <div className="mb-2">
                <p className="px-4 py-1 text-[10px] font-bold text-sky uppercase tracking-wider bg-slate-50/50">Classrooms</p>
                {searchResults.classrooms.map(c => (
                  <button
                    key={c._id || c.id}
                    onClick={() => handleResultClick(c, 'classroom')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4 text-sky" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-navy group-hover:text-sky transition-colors block truncate">
                        {c.title}
                      </span>
                      <span className="text-xs text-muted font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="bg-sky/10 text-sky px-1.5 py-0.5 rounded text-[10px]">{c.subject}</span>
                        {c.teacherId?.name && (
                          <>
                            <span>·</span>
                            <span>{c.teacherId.name}</span>
                          </>
                        )}
                        {c.feesPaise && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 font-bold">{formatFee(c.feesPaise)}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Teachers/Tutors Section */}
            {searchResults.teachers?.length > 0 && (
              <div className="mb-2">
                <p className="px-4 py-1 text-[10px] font-bold text-amber uppercase tracking-wider bg-slate-50/50">Tutors</p>
                {searchResults.teachers.map(t => (
                  <button
                    key={t._id || t.id}
                    onClick={() => handleResultClick(t, 'teacher')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-amber/10 flex items-center justify-center text-xs font-bold text-amber">
                          {t.name ? t.name[0] : 'T'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-navy group-hover:text-amber-hover transition-colors block truncate">
                        {t.name}
                      </span>
                      <span className="text-xs text-muted font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="bg-amber/10 text-amber-hover px-1.5 py-0.5 rounded text-[10px]">{t.profile?.subjects?.join(', ') || 'Tutor'}</span>
                        {t.city && (
                          <>
                            <span>·</span>
                            <span>{t.city}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Students Section */}
            {searchResults.students?.length > 0 && (
              <div>
                <p className="px-4 py-1 text-[10px] font-bold text-green-500 uppercase tracking-wider bg-slate-50/50">Students</p>
                {searchResults.students.map(s => (
                  <button
                    key={s._id || s.id}
                    onClick={() => handleResultClick(s, 'student')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      {s.avatarUrl ? (
                        <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold">
                          {s.name ? s.name[0] : 'S'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-navy group-hover:text-green-600 transition-colors block truncate">
                        {s.name}
                      </span>
                      {s.username && (
                        <span className="text-xs text-muted font-medium block">@{s.username}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {user?.role === 'admin' && searchResults.admins?.length > 0 && (
              <div className="mb-2">
                <p className="px-4 py-1 text-[10px] font-bold text-red-500 uppercase tracking-wider bg-slate-50/50">Admins</p>
                {searchResults.admins.map(a => (
                  <button
                    key={a._id || a.id}
                    onClick={() => handleResultClick(a, 'admin')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      {a.avatarUrl ? (
                        <img src={a.avatarUrl} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-bold">
                          {a.name ? a.name[0] : 'A'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-navy group-hover:text-red-600 transition-colors block truncate">
                        {a.name}
                      </span>
                      {a.username && (
                        <span className="text-xs text-muted font-medium block">@{a.username}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : query.length >= 2 ? (
          <div className="px-4 py-4 text-center text-sm text-muted">
            No results found for "<span className="font-semibold text-navy">{query}</span>"
            <button
              onClick={() => { navigate(`/student/discover?q=${encodeURIComponent(query)}`); setQuery(''); closeOverlay(); }}
              className="block mt-2 text-xs text-sky font-bold mx-auto hover:underline"
            >
              Browse all classrooms →
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 text-center text-sm text-muted">
            Type at least 2 characters to search
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
            placeholder="Search subjects, classrooms..."
            value={query}
            maxLength={80}
            onFocus={() => {
               if (activeOverlayId !== 'topbar-search') toggleOverlay('topbar-search');
            }}
            onChange={(e) => {
               setQuery(sanitize(e.target.value));
               if (activeOverlayId !== 'topbar-search') toggleOverlay('topbar-search');
            }}
            onKeyDown={handleSearchSubmit}
            className="peer w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-navy rounded-full py-2 pl-9 pr-9 text-sm text-navy font-medium outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy p-1">
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
            {unreadCount > 0 && (
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
                      <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
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
                <button onClick={markAllAsRead} className="text-[11px] font-bold text-slate-500 hover:text-navy transition">
                  Mark all as read
                </button>
                <div className="flex items-center gap-3">
                  {notifications.length > 0 && (
                    <button onClick={clearAllNotifications} className="text-[11px] font-bold text-red-400 hover:text-red-600 transition">
                      Clear all
                    </button>
                  )}
                  <Link to={`/${user?.role || 'student'}/notifications`} onClick={() => closeOverlay()} className="text-[11px] font-bold text-sky hover:text-navy transition">
                    View all
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <Link to={user?.role === 'admin' ? '/admin/settings' : `/${user?.role || 'student'}/profile`} className="block hover:scale-105 transition-transform">
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
              placeholder="Search classrooms, subjects..."
              value={query}
              maxLength={80}
              onChange={(e) => setQuery(sanitize(e.target.value))}
              onKeyDown={handleSearchSubmit}
              className="w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-navy rounded-full py-2 pl-9 pr-8 text-sm text-navy font-medium outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button 
            onClick={() => { closeOverlay(); setQuery(''); setSearchResults([]); }}
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
