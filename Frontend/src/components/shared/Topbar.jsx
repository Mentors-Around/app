import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Search, Bell, X, Menu } from 'lucide-react';

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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef(null);

  const [notifications, setNotifications] = useState(
    user?.role === 'teacher' 
    ? [
        { id: 1, text: 'New Query from Rahul Sharma', link: '/teacher/queries' },
        { id: 2, text: 'New Query from Priya Kapoor', link: '/teacher/queries' },
        { id: 3, text: 'New Query from Aditi Rao', link: '/teacher/queries' },
      ]
    : [
        { id: 1, text: 'Your class with Kavita Verma starts in 30 mins' },
        { id: 2, text: 'New message from Arun Singh' }
      ]
  );
  const [showNotifications, setShowNotifications] = useState(false);

  const filtered = query.trim() === '' ? [] : dummyTeachers.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase()) || 
    t.subject.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setQuery('');
        setShowMobileSearch(false);
      }
    };
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleResultClick = (subject) => {
    setQuery('');
    setShowMobileSearch(false);
    navigate(`/student/discover?subject=${encodeURIComponent(subject)}`);
  };

  const SearchDropdown = () => {
    if (!query) return null;
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
      <div className="flex items-center gap-3 md:gap-4 relative" ref={searchRef}>
        
        {/* Desktop Search */}
        <div className="hidden md:block relative w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 peer-focus:text-navy transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search subjects, teachers..."
            value={query}
            maxLength={50}
            onChange={(e) => setQuery(sanitize(e.target.value))}
            className="peer w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-navy rounded-full py-2 pl-9 pr-9 text-sm text-navy font-medium outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <SearchDropdown />
        </div>

        {/* Mobile Search Icon */}
        <button 
          className="block md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-navy hover:bg-cream transition"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          aria-label="Open search"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="relative">
          <button 
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-cream transition text-slate-500 hover:text-navy group" 
            aria-label="View notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5 group-hover:animate-shake" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-white" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-full right-[-80px] md:right-0 mt-2 w-72 bg-white rounded-brand shadow-brand-xl border border-slate-100 overflow-hidden z-50 animate-slide-up-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-navy">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full font-bold">{notifications.length}</span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition flex flex-col gap-1">
                      {n.link ? (
                        <Link to={n.link} onClick={() => setShowNotifications(false)} className="text-sm text-navy hover:text-sky transition-colors">
                          {n.text}
                        </Link>
                      ) : (
                        <p className="text-sm text-navy">{n.text}</p>
                      )}
                      <button onClick={() => setNotifications(notifications.filter(x => x.id !== n.id))} className="text-xs text-sky font-semibold self-start hover:underline">
                        Mark as read
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <Link to={`/${user?.role || 'student'}/profile`} className="w-9 h-9 rounded-full bg-gradient-to-br from-navy to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all">
          {initials}
        </Link>
      </div>

      {/* Mobile Search Full Width Dropdown */}
      <div className={`absolute left-0 right-0 bg-white border-b border-slate-200 px-4 py-3 md:hidden z-50 transition-all duration-300 origin-top ${showMobileSearch ? 'top-16 opacity-100 visible' : 'top-12 opacity-0 invisible -translate-y-4 pointer-events-none'}`}>
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
            onClick={() => { setShowMobileSearch(false); setQuery(''); }}
            className="px-3 text-sm font-semibold text-slate-500 hover:text-navy"
          >
            Cancel
          </button>
          
          <div className="absolute top-full left-0 right-0 w-full mt-2">
            <SearchDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};
export default Topbar;
