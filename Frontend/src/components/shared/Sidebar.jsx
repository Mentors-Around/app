import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { MessageSquare, MessagesSquare, FileWarning, HelpCircle } from 'lucide-react';
import { handleComingSoon } from '../../utils/navigationFixes';
import TeacherAvatar from './TeacherAvatar';
import Logo from './Logo';

const navConfig = {
  student: [
    {
      section: 'Menu',
      items: [
        { label: 'Dashboard', icon: 'fa-solid fa-gauge-high', to: '/student/dashboard' },
        { label: 'Discover Classrooms', icon: 'fa-solid fa-compass', to: '/student/discover' },
        { label: 'View Tutors', icon: 'fa-solid fa-graduation-cap', to: '/student/tutors' }, // Tutors browse page
        { label: 'My Queries', icon: MessagesSquare, to: '/student/my-queries', isLucide: true },
        { label: 'Learning', icon: 'fa-solid fa-users-rectangle', to: '/student/rooms' },
        { label: 'Wallet & Payments', icon: 'fa-solid fa-wallet', to: '/student/wallet' },
        { label: 'Profile', icon: 'fa-solid fa-user', to: '/student/profile' },
        { label: 'Settings & Support', icon: 'fa-solid fa-headset', to: '/student/settings' },
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
        { label: 'Wallet & Payments', icon: 'fa-solid fa-wallet', to: '/teacher/wallet' },
        { label: 'Queries', icon: MessagesSquare, to: '/teacher/queries', isLucide: true },
        { label: 'Reviews', icon: 'fa-solid fa-star', to: '/teacher/reviews' },
        { label: 'Profile', icon: 'fa-solid fa-user', to: '/teacher/profile' },
        { label: 'Settings', icon: 'fa-solid fa-gear', to: '/teacher/settings' },
        { label: 'Help & Support', icon: 'fa-solid fa-headset', to: '/contact' },
      ]
    }
  ],
  admin: [
    {
      section: '',
      items: [
        { label: 'Dashboard', icon: 'fa-solid fa-chart-pie', to: '/admin/dashboard' },
        { label: 'Teachers', icon: 'fa-solid fa-chalkboard-user', to: '/admin/teachers' },
        { label: 'Students', icon: 'fa-solid fa-graduation-cap', to: '/admin/students' },
        { label: 'KYC Verification', icon: 'fa-solid fa-user-check', to: '/admin/kyc' },
        { label: 'Classrooms', icon: 'fa-solid fa-users-rectangle', to: '/admin/classrooms' },
        { label: 'Reports', icon: 'fa-solid fa-file-shield', to: '/admin/reports' },
        { label: 'Wallet & Payments', icon: 'fa-solid fa-wallet', to: '/admin/wallet' },
        { label: 'Reviews', icon: 'fa-solid fa-star', to: '/admin/reviews' },
        { label: 'Support', icon: 'fa-solid fa-headset', to: '/admin/support' },
        { label: 'Analytics', icon: 'fa-solid fa-chart-line', to: '/admin/analytics' },
        { label: 'Settings', icon: 'fa-solid fa-gear', to: '/admin/settings' },
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
          ${isCollapsed ? 'md:w-[72px]' : 'md:w-[240px]'}`}
      >
        {/* Header & Logo */}
        <div className={`h-16 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
          {!isCollapsed && (
            <Link to="/" onClick={onClose} className="transition-opacity">
              <Logo variant="light" className="h-12 w-auto" loading="lazy" />
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
        <div className={`p-4 border-b border-slate-100 bg-slate-50/30 transition-all duration-300 ${isCollapsed ? 'px-2 flex justify-center' : 'px-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <TeacherAvatar 
              teacherId={user?.id || '1'} 
              name={user?.name} 
              initials={initials} 
              className="w-10 h-10 text-sm flex-shrink-0" 
            />
            <div className={`flex-1 min-w-0 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'}`}>
              <p className="text-sm font-bold text-navy truncate">{user?.name || 'User Name'}</p>
              <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                <i className="fa-solid fa-location-dot text-[10px]" /> {user?.location || 'City'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 hide-scrollbar ${isCollapsed ? 'px-2 overflow-visible' : 'px-3 overflow-y-auto'}`}>
          {sections.map((sectionObj, idx) => (
            <div key={sectionObj.section} className="mb-6">
              {!isCollapsed && sectionObj.section && (
                <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  {sectionObj.section}
                  <span className="flex-1 h-px bg-slate-100 block"></span>
                </p>
              )}
              {isCollapsed && idx > 0 && sectionObj.section && <div className="h-px bg-slate-100 my-4 mx-2"></div>}
              
              <div className={`space-y-1.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                {sectionObj.items.map((item) => {
                  const isActive = item.to && pathname === item.to;
                  const isDisabled = !item.to;
                  
                  if (isDisabled) {
                    return (
                      <div key={item.label} className="relative group/navitem w-full flex justify-center">
                        <button
                          onClick={() => handleComingSoon(item.label)}
                          className={`flex items-center rounded-xl text-sm font-semibold text-slate-400 cursor-pointer hover:bg-slate-50 transition-all duration-300
                            ${isCollapsed ? 'justify-center w-10 h-10' : 'gap-4 px-3 py-2.5 w-full justify-start'}`}
                        >
                          <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {item.isLucide ? (
                              <item.icon className="text-[22px]" />
                            ) : (
                              <i className={`${item.icon} text-[22px]`} />
                            )}
                          </span>
                          <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'}`}>{item.label}</span>
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={item.label} className="relative group/navitem w-full flex justify-center">
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={`flex items-center rounded-xl text-sm font-semibold transition-all duration-300
                          ${isCollapsed ? 'justify-center w-10 h-10' : 'gap-4 px-3 py-2.5 w-full justify-start'}
                          ${isActive 
                            ? 'bg-navy text-white' 
                            : 'text-slate-500 hover:bg-blue-50 hover:text-navy'
                          }`}
                      >
                        <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {item.isLucide ? (
                            <item.icon className={`text-[22px] transition-transform duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover/navitem:text-navy'}`} />
                          ) : (
                            <i className={`${item.icon} text-[22px] transition-transform duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover/navitem:text-navy'}`} />
                          )}
                        </span>
                        <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'}`}>{item.label}</span>
                      </Link>
                      {isCollapsed && (
                        <div 
                          className="absolute left-full top-1/2 -translate-y-1/2 ml-7 bg-[#102C57] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 group-hover/navitem:translate-x-1 translate-x-0 transition-all duration-200 z-[9999] w-max"
                          style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}
                        >
                          {item.label}
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
        <div className={`p-4 border-t border-slate-100 bg-white transition-all duration-300 ${isCollapsed ? 'px-2 flex justify-center' : 'px-4'}`}>
          <div className={`relative group/logout ${isCollapsed ? 'w-full flex justify-center' : 'w-full'}`}>
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`flex items-center text-sm font-bold text-slate-500 hover:text-error transition-all duration-300 rounded-xl hover:bg-error/10 border border-transparent hover:border-error/20 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full gap-4 px-4 py-2.5 justify-start'}`}
            >
              <span className="w-6 h-6 flex items-center justify-center flex-shrink-0 group-hover/logout:-translate-x-1 transition-transform duration-300">
                <i className="fa-solid fa-arrow-right-from-bracket text-[22px]" />
              </span>
              <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'}`}>Logout</span>
            </button>
            {isCollapsed && (
              <div 
                className="absolute left-full top-1/2 -translate-y-1/2 ml-7 bg-[#102C57] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/logout:opacity-100 group-hover/logout:translate-x-1 translate-x-0 transition-all duration-200 z-[9999] w-max"
                style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}
              >
                Logout
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
