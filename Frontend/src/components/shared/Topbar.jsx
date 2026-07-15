// src/components/shared/Topbar.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Menu, Wallet, Loader2, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import notificationService from '@/services/notification.service';
import { ROLES } from '@/constants/enums';
import { timeAgo } from '@/utils/date.util';
import toast from 'react-hot-toast';

const POLL_MS = 30000;

const Topbar = ({ onMenuClick }) => {
  const { user, role, logout, getDashboardRoute } = useAuth();
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const initials = user?.initials || 'U';

  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const notifRef = useRef(null);
  const avatarRef = useRef(null);

  const profileRoute = role === ROLES.STUDENT
    ? '/student/profile'
    : role === ROLES.TEACHER
      ? '/teacher/settings'
      : '/admin/dashboard';

  const settingsRoute = role === ROLES.STUDENT
    ? '/student/settings'
    : role === ROLES.TEACHER
      ? '/teacher/settings'
      : null;

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await notificationService.getUnreadCount();
      setUnreadCount(data?.data?.count ?? data?.count ?? 0);
    } catch {
      // silent — non-critical
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, POLL_MS);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // Close panels on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openNotifPanel = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setAvatarOpen(false);
    if (opening && notifications.length === 0) {
      setLoading(true);
      try {
        const { data } = await notificationService.getAll({ limit: 10 });
        setNotifications(data?.data?.items ?? data?.data ?? []);
      } finally {
        setLoading(false);
      }
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error('Could not mark notifications as read');
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setAvatarOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-navy hover:bg-slate-100 transition"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Token balance shortcut (students only) */}
        {role === ROLES.STUDENT && (
          <button
            onClick={() => navigate('/student/wallet')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber/10 text-amber-hover font-bold text-sm hover:bg-amber/20 transition"
            title="View wallet"
          >
            <Wallet size={16} />
            <span>{wallet?.tokenBalance ?? 0} tokens</span>
          </button>
        )}

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifPanel}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-navy hover:bg-slate-100 transition"
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-brand-xl border border-slate-100 overflow-hidden z-50 animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="font-bold text-sm text-navy">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-semibold text-sky hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-slate-300" size={20} />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">You&apos;re all caught up! 🎉</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id || n.id}
                      onClick={() => {
                        if (n.link) navigate(n.link);
                        setNotifOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${!n.isRead ? 'bg-sky-50/40' : ''}`}
                    >
                      {!n.isRead && (
                        <span className="inline-block w-2 h-2 rounded-full bg-sky mr-2 mb-0.5" />
                      )}
                      <p className="text-sm font-medium text-navy inline">{n.title || n.text}</p>
                      {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
                      <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <Link
                  to={`/${role}/notifications`}
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-bold text-sky hover:underline"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => { setAvatarOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-100 transition"
            aria-label="User menu"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-navy leading-tight max-w-[120px] truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-muted capitalize">{role}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden md:block" />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-brand-xl border border-slate-100 overflow-hidden z-50 animate-fadeIn py-1">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-navy truncate">{user?.name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>

              <Link
                to={profileRoute}
                onClick={() => setAvatarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-navy transition"
              >
                <User size={16} /> Profile
              </Link>

              {settingsRoute && (
                <Link
                  to={settingsRoute}
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-navy transition"
                >
                  <Settings size={16} /> Settings
                </Link>
              )}

              <div className="border-t border-slate-100 mt-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/5 transition disabled:opacity-50"
                >
                  {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
