import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { MessageSquare, MessagesSquare, FileWarning, HelpCircle } from 'lucide-react';

const navConfig = {
  student: [
    {
      section: 'Menu',
      items: [
        { label: 'Dashboard', icon: 'fa-solid fa-gauge-high', to: '/student/dashboard' },
        { label: 'Discover Classrooms', icon: 'fa-solid fa-compass', to: '/student/discover' },
        { label: 'My Queries', icon: MessagesSquare, to: '/student/my-queries', isLucide: true },
        { label: 'Learning', icon: 'fa-solid fa-users-rectangle', to: '/student/rooms' },
        { label: 'Payments', icon: 'fa-solid fa-credit-card', to: '/student/payments' },
        { label: 'Profile', icon: 'fa-solid fa-user', to: '/student/profile' },
        { label: 'Settings', icon: 'fa-solid fa-gear', to: '/student/settings' },
      ]
    }
  ],
  teacher: [
    {
      section: '',
      items: [
        { label: 'Dashboard', icon: 'fa-solid fa-gauge-high', to: '/teacher/dashboard' },
        { label: 'My Classrooms', icon: 'fa-solid fa-users-rectangle', to: '/teacher/classrooms' },
        { label: 'Classroom Doubts', icon: HelpCircle, to: '/teacher/doubts', isLucide: true },
        { label: 'My Students', icon: 'fa-solid fa-user-group', to: '/teacher/students' },
        { label: 'Earnings', icon: 'fa-solid fa-indian-rupee-sign', to: '/teacher/earnings' },
        { label: 'Queries', icon: MessagesSquare, to: '/teacher/queries', isLucide: true },
        { label: 'Student Reports', icon: FileWarning, to: '/teacher/reports', isLucide: true },
        { label: 'Reviews', icon: 'fa-solid fa-star', to: '/teacher/reviews' },
        { label: 'Profile', icon: 'fa-solid fa-user', to: '/teacher/profile' },
        { label: 'Settings', icon: 'fa-solid fa-gear', to: '/teacher/settings' },
      ]
    }
  ],
  admin: [
    {
      section: '',
      items: [
        { label: 'KYC Verification', icon: 'fa-solid fa-user-check', to: '/admin/verify' },
        { label: 'Teachers', icon: 'fa-solid fa-chalkboard-user', to: null },
        { label: 'Students', icon: 'fa-solid fa-graduation-cap', to: null },
        { label: 'Bookings', icon: 'fa-solid fa-calendar-check', to: null },
        { label: 'Payments', icon: 'fa-solid fa-credit-card', to: null },
        { label: 'Overview', icon: 'fa-solid fa-chart-pie', to: null },
        { label: 'Reports', icon: 'fa-solid fa-file-lines', to: null },
        { label: 'Settings', icon: 'fa-solid fa-gear', to: null },
      ]
    }
  ],
};

const Sidebar = ({ role, isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const sections = navConfig[role] || [];

  const initials = user?.initials || 'U';

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('trueed_cookie_consent');
    authLogout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full w-[75%] max-w-[320px] bg-white border-r border-slate-200 z-50 flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          ${isCollapsed ? 'md:w-[64px]' : 'md:w-[240px]'}`}
      >
        {/* Header & Logo */}
        <div className={`h-16 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
          {!isCollapsed && (
            <Link to="/" onClick={onClose} className="transition-opacity">
              <img src="/logo.png" alt="TrueEd logo" className="h-8 w-auto" loading="lazy" />
            </Link>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg bg-navy text-white hover:bg-navy-light shadow-sm transition-all"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <i className={`fa-solid ${isCollapsed ? 'fa-bars' : 'fa-chevron-left'} text-sm`} />
          </button>

          <button onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-navy transition">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* User Profile Section (Moved to Top) */}
        <div className={`p-4 border-b border-slate-100 bg-slate-50/30 transition-all ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy truncate">{user?.name || 'User Name'}</p>
                <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                  <i className="fa-solid fa-location-dot text-[10px]" /> {user?.location || 'City'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 hide-scrollbar ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {sections.map((sectionObj, idx) => (
            <div key={sectionObj.section} className="mb-6">
              {!isCollapsed && sectionObj.section && (
                <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  {sectionObj.section}
                  <span className="flex-1 h-px bg-slate-100 block"></span>
                </p>
              )}
              {isCollapsed && idx > 0 && sectionObj.section && <div className="h-px bg-slate-100 my-4 mx-2"></div>}
              
              <div className="space-y-1">
                {sectionObj.items.map((item) => {
                  const isActive = item.to && pathname === item.to;
                  const isDisabled = !item.to;
                  
                  if (isDisabled) {
                    return (
                      <div key={item.label} className="relative group/navitem">
                        <span
                          className={`flex items-center rounded-lg text-sm font-semibold text-slate-300 cursor-not-allowed transition-all
                            ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-2.5'}`}
                        >
                          {item.isLucide ? (
                            <item.icon className={`text-xl flex-shrink-0 ${isCollapsed ? '' : 'w-5 text-center'}`} />
                          ) : (
                            <i className={`${item.icon} text-lg flex-shrink-0 ${isCollapsed ? '' : 'w-5 text-center'}`} />
                          )}
                          {!isCollapsed && <span>{item.label}</span>}
                        </span>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={item.label} className="relative group/navitem">
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={`flex items-center rounded-lg text-sm font-semibold transition-all duration-200
                          ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-2.5'}
                          ${isActive 
                            ? 'bg-navy text-white shadow-md shadow-navy/20' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-navy'
                          }`}
                      >
                        {item.isLucide ? (
                          <item.icon className={`text-xl flex-shrink-0 transition-transform duration-200 group-hover/navitem:scale-110 ${isCollapsed ? '' : 'w-5 text-center'} ${isActive ? 'text-white' : 'text-slate-400 group-hover/navitem:text-navy'}`} />
                        ) : (
                          <i className={`${item.icon} text-lg flex-shrink-0 transition-transform duration-200 group-hover/navitem:scale-110 ${isCollapsed ? '' : 'w-5 text-center'} ${isActive ? 'text-white' : 'text-slate-400 group-hover/navitem:text-navy'}`} />
                        )}
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                      {isCollapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-navy text-white text-xs font-bold px-3 py-2 rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 group-hover/navitem:translate-x-1 transition-all z-50 shadow-lg border border-white/10">
                          {item.label}
                          <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-navy" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className={`p-4 border-t border-slate-100 bg-white transition-all ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="relative group/logout">
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`flex items-center justify-center text-sm font-bold text-slate-500 hover:text-error transition-all duration-200 w-full rounded-lg hover:bg-error/10 border border-transparent hover:border-error/20 ${isCollapsed ? 'p-3' : 'gap-2 px-4 py-2.5'}`}
            >
              <i className="fa-solid fa-arrow-right-from-bracket group-hover/logout:-translate-x-1 transition-transform duration-200" />
              {!isCollapsed && <span>Logout</span>}
            </button>
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-error text-white text-xs font-bold px-3 py-2 rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/logout:opacity-100 group-hover/logout:translate-x-1 transition-all z-50 shadow-lg border border-white/10">
                Logout
                <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-error" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-arrow-right-from-bracket text-error text-2xl" />
            </div>
            <h3 className="font-sora text-xl font-bold text-navy mb-2">Are you sure you want to logout?</h3>
            <p className="text-slate-500 text-sm mb-8">You will need to login again to access your dashboard.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 px-4 bg-error text-white rounded-xl text-sm font-bold hover:bg-red-600 transition shadow-lg"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
