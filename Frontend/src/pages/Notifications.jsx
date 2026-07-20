import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Bell, CheckCircle, Calendar, CreditCard, MessageSquare, Check, Trash2, CheckCheck, AlertCircle } from 'lucide-react';

const mockNotifications = [
  { id: 1, type: 'accepted', title: 'Query Accepted', text: 'Teacher Alex Johnson accepted your classroom query.', time: '2 hours ago', group: 'Today', isRead: false },
  { id: 2, type: 'reminder', title: 'Upcoming Class', text: 'Physics Crash Course starts in 1 hour.', time: '3 hours ago', group: 'Today', isRead: false },
  { id: 3, type: 'payment', title: 'Payment Successful', text: 'Payment successful for Mastering Calculus.', time: 'Yesterday', group: 'Yesterday', isRead: true },
  { id: 4, type: 'reply', title: 'New Reply', text: 'Teacher Sarah Smith replied to your query.', time: 'Yesterday', group: 'Yesterday', isRead: true },
  { id: 5, type: 'announcement', title: 'New Announcement', text: 'Classroom announcement posted in Mathematics.', time: 'Oct 15, 2026', group: 'Earlier', isRead: true },
  { id: 6, type: 'reminder', title: 'Upcoming Class', text: 'Organic Chemistry lab starts soon.', time: 'Oct 14, 2026', group: 'Earlier', isRead: true },
];

import api from '../services/api.js';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.notification.getAll().catch(() => []);
      const list = Array.isArray(res) ? res : (res?.docs || res?.notifications || []);
      const mapped = list.map(n => ({
        id: n._id || n.id,
        type: n.type || 'announcement',
        title: n.title || 'Notification',
        text: n.message || n.text || '',
        time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recently',
        group: 'Today',
        isRead: !!n.isRead,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Notifications — TrueEd";
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    await api.notification.markAsRead(id).catch(() => null);
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    await api.notification.markAllAsRead().catch(() => null);
  };

  const clearAll = () => {
    setNotifications([]);
    setShowClearConfirm(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'accepted': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'payment': return <CreditCard className="w-5 h-5 text-sky-500" />;
      case 'reminder': return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'reply': return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'announcement': return <Bell className="w-5 h-5 text-indigo-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const grouped = notifications.reduce((acc, notif) => {
    if (!acc[notif.group]) acc[notif.group] = [];
    acc[notif.group].push(notif);
    return acc;
  }, {});

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-sora text-3xl font-bold text-navy mb-2 flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-error/10 text-error px-3 py-1 rounded-full font-bold uppercase tracking-wider">{unreadCount} New</span>
            )}
          </h1>
          <p className="text-slate-500 font-medium">Stay updated on your classes, queries, and activities.</p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={markAllAsRead}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Mark all read
            </button>
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          </div>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-8">
          {['Today', 'Yesterday', 'Earlier'].map((groupName) => {
            if (!grouped[groupName] || grouped[groupName].length === 0) return null;
            return (
              <div key={groupName} className="space-y-3">
                <h3 className="font-bold text-slate-400 uppercase tracking-wider text-xs ml-2">{groupName}</h3>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {grouped[groupName].map((notif, index) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 transition group
                        ${index !== grouped[groupName].length - 1 ? 'border-b border-slate-100' : ''}
                        ${!notif.isRead ? 'bg-sky-50/30' : 'hover:bg-slate-50'}
                      `}
                    >
                      <div className="shrink-0 flex items-start gap-4">
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center
                          ${!notif.isRead ? 'bg-white shadow-sm border border-slate-100' : 'bg-slate-50 border border-slate-100'}
                        `}>
                          {getNotificationIcon(notif.type)}
                          {!notif.isRead && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky border-2 border-white rounded-full"></span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-1">
                          <h4 className={`text-base font-bold ${!notif.isRead ? 'text-navy' : 'text-slate-700'}`}>{notif.title}</h4>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{notif.time}</span>
                        </div>
                        <p className={`text-sm ${!notif.isRead ? 'font-medium text-slate-600' : 'text-slate-500'}`}>{notif.text}</p>
                      </div>

                      <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end sm:justify-start pt-2 sm:pt-0">
                        {!notif.isRead && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="p-2 text-slate-400 hover:text-sky hover:bg-sky/10 rounded-lg transition tooltip-trigger"
                            title="Mark as Read"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notif.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition tooltip-trigger"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Bell className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="font-sora text-xl font-bold text-navy mb-2">No notifications yet</h2>
          <p className="text-slate-500 font-medium mb-8">You're all caught up with your activities.</p>
          <button 
            onClick={() => navigate(`/${user?.role || 'student'}/dashboard`)}
            className="bg-[#1B2D5B] text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900 transition shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-sora text-xl font-bold text-navy mb-2">Clear all notifications?</h3>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone and will remove all your notifications permanently.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button 
                onClick={clearAll}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition shadow-sm"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
