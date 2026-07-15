import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Compass, Users, Wallet, User, ShieldCheck,
  LogOut, ChevronLeft, Menu as MenuIcon, X, ClipboardCheck,
  FileWarning, LineChart, Settings, HeadphonesIcon, MessageSquare,
  Heart, ClipboardList, HelpCircle, Star, GraduationCap,
  CreditCard, BarChart3, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/enums';
import Logo from './Logo';

const navConfig = {
  [ROLES.STUDENT]: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/student/dashboard' },
    { label: 'Discover Classrooms', icon: Compass, to: '/student/discover' },
    { label: 'My Bookings', icon: ClipboardCheck, to: '/student/bookings' },
    { label: 'My Queries', icon: MessageSquare, to: '/student/my-queries' },
    { label: 'Saved Tutors', icon: Heart, to: '/student/favourites' },
    { label: 'Monthly Tests', icon: ClipboardList, to: '/student/tests' },
    { label: 'Wallet & Payments', icon: Wallet, to: '/student/wallet' },
    { label: 'Profile', icon: User, to: '/student/profile' },
    { label: 'Settings', icon: Settings, to: '/student/settings' },
  ],
  [ROLES.TEACHER]: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/teacher/dashboard' },
    { label: 'My Classrooms', icon: Users, to: '/teacher/classrooms' },
    { label: 'My Students', icon: GraduationCap, to: '/teacher/students' },
    { label: 'Enrollment Queries', icon: MessageSquare, to: '/teacher/queries' },
    { label: 'Classroom Doubts', icon: HelpCircle, to: '/teacher/doubts' },
    { label: 'Student Reports', icon: FileWarning, to: '/teacher/reports' },
    { label: 'Student Reviews', icon: Star, to: '/teacher/reviews' },
    { label: 'Wallet & Payments', icon: Wallet, to: '/teacher/wallet' },
    { label: 'KYC Verification', icon: ShieldCheck, to: '/teacher/kyc' },
    { label: 'Settings', icon: Settings, to: '/teacher/settings' },
  ],
  [ROLES.ADMIN]: [
    { label: 'Overview Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Analytics', icon: BarChart3, to: '/admin/analytics' },
    { label: 'Review Moderation', icon: EyeOff, to: '/admin/reviews' },
    { label: 'Payout Management', icon: CreditCard, to: '/admin/payouts' },
    { label: 'Notifications', icon: HeadphonesIcon, to: '/admin/notifications' },
  ],
};

const Sidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const items = navConfig[role] || [];
  const initials = user?.initials || user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setShowLogoutModal(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full w-[75%] max-w-[320px] bg-white border-r border-slate-200 z-50 flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-[72px]' : 'md:w-[240px]'}`}
      >
        <div className={`h-16 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
          {!isCollapsed && (
            <Link to="/" onClick={onClose}>
              <Logo variant="light" className="h-10 w-auto" />
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg bg-navy text-white hover:bg-navy-hover shadow-sm transition-all"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <MenuIcon size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-navy transition">
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-slate-100 bg-slate-50/30 ${isCollapsed ? 'px-2 flex justify-center' : 'px-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                {initials}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 font-medium truncate capitalize">{role}</p>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 py-4 hide-scrollbar overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <div className={`space-y-1.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {items.map((item) => {
              const isActive = pathname === item.to || (item.to !== '/admin/dashboard' && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <div key={item.label} className="relative group/navitem w-full flex justify-center">
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center rounded-xl text-sm font-semibold transition-all duration-200
                      ${isCollapsed ? 'justify-center w-10 h-10' : 'gap-3 px-3 py-2.5 w-full justify-start'}
                      ${isActive ? 'bg-navy text-white' : 'text-slate-500 hover:bg-blue-50 hover:text-navy'}`}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </Link>
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-navy-dark text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-all z-[9999]">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {role !== ROLES.ADMIN && (
            <Link
              to="/support"
              onClick={onClose}
              className={`mt-6 flex items-center rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-50 hover:text-navy transition w-full
                ${isCollapsed ? 'justify-center w-10 h-10' : 'gap-3 px-3 py-2.5 justify-start'}`}
            >
              <HeadphonesIcon size={20} className="shrink-0" />
              {!isCollapsed && <span>Help & Support</span>}
            </Link>
          )}
        </nav>

        <div className={`p-4 border-t border-slate-100 bg-white ${isCollapsed ? 'px-2 flex justify-center' : 'px-4'}`}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`flex items-center text-sm font-bold text-slate-500 hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20
              ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full gap-3 px-4 py-2.5 justify-start'}`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <LogOut className="text-error" size={26} />
            </div>
            <h3 className="font-sora text-xl font-bold text-navy mb-2">Log out of TrueEd?</h3>
            <p className="text-slate-500 text-sm mb-8">You'll need to sign in again to access your dashboard.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 py-3 px-4 bg-error text-white rounded-xl text-sm font-bold hover:bg-red-600 transition shadow-lg">
                Yes, logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
