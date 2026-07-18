import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Mail, Globe, LifeBuoy, AlertCircle, MessageSquare, Shield,
  CheckCircle, ChevronDown, ChevronUp, CreditCard, Monitor, User,
  Bug, Phone, Laptop, Clock, Download, AlertTriangle, ChevronRight,
  Bell, Eye, MapPin, Loader2, EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import userService from '@/services/user.service';
import { formatDate } from '@/utils/date.util';
import ThemePreferences from '@/components/shared/ThemePreferences';

export default function StudentSettings() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'notifications';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [openFaq, setOpenFaq] = useState(null);

  // Forms
  const [supportForm, setSupportForm] = useState({ subject: '', category: 'Account & Profile', message: '' });
  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    parentPhone: user?.parentGuardian?.phone || '',
    parentRelation: user?.parentGuardian?.relation || 'guardian'
  });

  // Password Change
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // OTP Verification States
  const [otpModal, setOtpModal] = useState({ isOpen: false, field: '', value: '', step: 1, otp: '', cooldown: 0 });

  // Delete Account
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Support Contacts
  const [supportContacts, setSupportContacts] = useState({ email: 'support@trueed.in', website: 'www.trueed.in' });

  // Preferences (Local Simulation)
  const [notifications, setNotifications] = useState({
    queries: true, classrooms: true, payments: true, replies: true, platform: true
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: true, allowNotifications: true, promoEmails: false
  });

  useEffect(() => {
    document.title = 'Settings & Support — TrueEd';
    window.scrollTo(0, 0);

    // Fetch support contacts
    userService.getSupport()
      .then(({ data }) => {
        const info = data?.data || data;
        if (info) {
          setSupportContacts({
            email: info.email || 'support@trueed.in',
            website: info.website || 'www.trueed.in'
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (otpModal.cooldown <= 0) return;
    const t = setInterval(() => {
      setOtpModal(prev => ({ ...prev, cooldown: prev.cooldown - 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [otpModal.cooldown]);

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportForm.subject || !supportForm.message) return;
    toast.success("Support request submitted successfully. Our team will contact you via email.");
    setSupportForm({ subject: '', category: 'Account & Profile', message: '' });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error('All password fields are required.');
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters.');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match.');
    }

    setPasswordLoading(true);
    try {
      await userService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully.');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.message || 'Failed to change password. Make sure current password is correct.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // OTP Flows
  const openOtpFlow = (field) => {
    const val = field === 'email' ? profileForm.email : profileForm.phone;
    setOtpModal({ isOpen: true, field, value: val, step: 1, otp: '', cooldown: 0 });
  };

  const handleSendOtp = async () => {
    if (!otpModal.value) return toast.error('Please enter a valid value.');
    try {
      if (otpModal.field === 'email') {
        await userService.requestEmailChange({ newEmail: otpModal.value.trim().toLowerCase() });
      } else {
        await userService.requestPhoneChange({ newPhone: otpModal.value.replace(/\D/g, '') });
      }
      toast.success(`Verification code sent to ${otpModal.value}`);
      setOtpModal(prev => ({ ...prev, step: 2, cooldown: 30 }));
    } catch (err) {
      toast.error(err?.message || 'Failed to send verification code.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otpModal.otp.length !== 6) return toast.error('Please enter 6-digit code.');
    try {
      if (otpModal.field === 'email') {
        await userService.confirmEmailChange({ newEmail: otpModal.value.trim().toLowerCase(), otp: otpModal.otp });
      } else {
        await userService.confirmPhoneChange({ newPhone: otpModal.value.replace(/\D/g, ''), otp: otpModal.otp });
      }
      toast.success('Details updated successfully.');
      await refreshUser();
      setOtpModal(prev => ({ ...prev, step: 3 }));
    } catch (err) {
      toast.error(err?.message || 'Verification failed.');
    }
  };

  const handleParentPhoneUpdate = async (e) => {
    e.preventDefault();
    try {
      await userService.updateParentPhone({
        parentPhone: profileForm.parentPhone,
        relation: profileForm.parentRelation
      });
      toast.success('Parent / Guardian contact updated.');
      await refreshUser();
    } catch (err) {
      toast.error(err?.message || 'Failed to update guardian phone.');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await userService.deleteMe();
      toast.success('Account permanently deleted.');
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const supportCategories = [
    { name: 'Account & Profile', icon: <User className="w-5 h-5 text-sky-500" /> },
    { name: 'Classroom Issues', icon: <Monitor className="w-5 h-5 text-purple-500" /> },
    { name: 'Payments & Wallet', icon: <CreditCard className="w-5 h-5 text-emerald-500" /> },
    { name: 'Query Tokens', icon: <MessageSquare className="w-5 h-5 text-amber-500" /> },
    { name: 'Technical Support', icon: <LifeBuoy className="w-5 h-5 text-blue-500" /> },
    { name: 'Report a Bug', icon: <Bug className="w-5 h-5 text-rose-500" /> }
  ];

  const faqs = [
    { q: 'How do I join a classroom?', a: 'You can discover and join classrooms from the "Discover Classrooms" page. Click "View Classroom" and use the "Enroll" button to purchase the course using your Wallet Balance.' },
    { q: 'How does the wallet work?', a: 'The TrueEd Wallet is your central hub for all payments. You can add money to your wallet using various payment methods, and use that balance to purchase classrooms or query tokens.' },
    { q: 'How do Query Tokens work?', a: 'Query tokens allow you to directly message a teacher before joining their classroom. This is useful for asking pre-enrollment questions. Tokens never expire and can be purchased from the Wallet Hub.' },
    { q: 'How do I request a refund?', a: 'Refunds can be requested within 24 hours of enrolling in a classroom by contacting support. Refunded amounts are deposited back into your TrueEd Wallet.' },
    { q: 'How do I contact a teacher?', a: 'Once enrolled, you can interact with your teacher through the live classroom lobby, announcements, and doubt resolution threads.' },
    { q: 'How do I update my profile?', a: 'Navigate to the Profile page to edit your personal details. Sensitive information like Email and Phone numbers require OTP verification.' }
  ];

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'theme', label: 'Theme & Appearance', icon: <Laptop className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Eye className="w-5 h-5" /> },
    { id: 'sessions', label: 'Sessions', icon: <Monitor className="w-5 h-5" /> },
    { id: 'data', label: 'Data & Downloads', icon: <Download className="w-5 h-5" /> },
    { id: 'support', label: 'Help & Support', icon: <LifeBuoy className="w-5 h-5" /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-5 h-5" />, danger: true },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 animate-fadeIn relative px-4 md:px-0">
      <div>
        <h1 className="font-sora text-3xl font-extrabold text-navy mb-2">Settings & Support</h1>
        <p className="text-slate-500 font-medium">Manage your account preferences and get support.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sidebar Tabs */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeTab === tab.id
                  ? tab.danger
                    ? 'bg-error/10 text-error shadow-sm border border-error/20'
                    : 'bg-white shadow-sm text-sky border border-slate-200'
                  : tab.danger
                    ? 'text-error/70 hover:bg-error/5 hover:text-error'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
              }`}
            >
              <div className={`${activeTab === tab.id ? (tab.danger ? 'text-error' : 'text-sky') : (tab.danger ? 'text-error/70' : 'text-slate-400')}`}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="md:col-span-3">
          {activeTab === 'theme' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <ThemePreferences />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-amber-500" /> Notifications
              </h2>
              <div className="space-y-4">
                {Object.keys(notifications).map((key) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-bold text-navy capitalize">{key} Notifications</p>
                      <p className="text-xs text-slate-500 font-medium">Receive alerts about {key} updates</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[key] ? 'bg-success' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-emerald-500" /> Secure Your Account
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Current Password</label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password (8+ chars)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="py-3 px-6 bg-navy text-white rounded-xl font-bold shadow hover:bg-navy-light transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {passwordLoading && <Loader2 size={16} className="animate-spin" />} Update Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-sky" /> Account Verification & Info
              </h2>
              <div className="space-y-6 max-w-xl">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="font-semibold text-navy text-sm">Status</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified Student Account
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="font-semibold text-navy text-sm">Member Since</span>
                  <span className="text-sm font-bold text-slate-600">
                    {user?.createdAt ? formatDate(user.createdAt) : 'January 2026'}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</p>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="font-semibold text-slate-800">{user?.email}</p>
                    <button onClick={() => openOtpFlow('email')} className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold transition">
                      Change Email
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</p>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="font-semibold text-slate-800">{user?.phone || 'Not linked'}</p>
                    <button onClick={() => openOtpFlow('phone')} className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold transition">
                      {user?.phone ? 'Change Phone' : 'Link Phone'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleParentPhoneUpdate} className="pt-4 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Parent / Guardian Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="tel"
                      value={profileForm.parentPhone}
                      onChange={(e) => setProfileForm({ ...profileForm, parentPhone: e.target.value })}
                      placeholder="Guardian Phone Number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                    />
                    <select
                      value={profileForm.parentRelation}
                      onChange={(e) => setProfileForm({ ...profileForm, parentRelation: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                    >
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                    </select>
                  </div>
                  <button type="submit" className="py-2.5 px-6 bg-navy text-white rounded-xl text-xs font-bold shadow hover:bg-navy-light transition">
                    Save Guardian Contact
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Eye className="w-5 h-5 text-indigo-500" /> Privacy Preferences
              </h2>
              <div className="space-y-4">
                {Object.keys(privacy).map((key) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-bold text-navy capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-xs text-slate-500 font-medium">Manage visibility of this preference</p>
                    </div>
                    <button
                      onClick={() => setPrivacy({ ...privacy, [key]: !privacy[key] })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy[key] ? 'bg-success' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Monitor className="w-5 h-5 text-purple-500" /> Login Sessions
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm">Chrome browser (Current Session)</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> India</p>
                    <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> Active Now</p>
                  </div>
                </div>
                <button onClick={() => toast.success('Terminated other login sessions.')} className="px-4 py-2 bg-white text-slate-700 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                  Logout Other Devices
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Download className="w-5 h-5 text-emerald-500" /> Data & Downloads
              </h2>
              <p className="text-sm font-medium text-slate-600 mb-6">Request a zip file contains your personal dashboard, payment history, and enrollment data.</p>
              <button onClick={() => toast.success('Data export requested. Check your email shortly.')} className="px-8 py-3 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-light transition shadow-sm">
                Request Data Export
              </button>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Support Contacts Card */}
                <div className="bg-gradient-to-br from-navy to-slate-900 rounded-2xl p-6 text-white shadow border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h2 className="font-sora font-bold text-lg mb-4 flex items-center gap-2">
                      <LifeBuoy className="w-5 h-5 text-sky" /> Contact Support Team
                    </h2>
                    <div className="space-y-4">
                      <a href={`mailto:${supportContacts.email}`} className="flex items-center gap-3 text-slate-300 hover:text-white transition group">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Email Support</p>
                          <p className="font-semibold text-sm">{supportContacts.email}</p>
                        </div>
                      </a>
                      <a href={`http://${supportContacts.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition group">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Web Portal</p>
                          <p className="font-semibold text-sm">{supportContacts.website}</p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Form card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h2 className="font-sora font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" /> Report a Problem
                  </h2>
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <select
                      value={supportForm.category}
                      onChange={e => setSupportForm({ ...supportForm, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition text-sm"
                    >
                      {supportCategories.map((cat, idx) => (
                        <option key={idx} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={supportForm.subject}
                      onChange={e => setSupportForm({ ...supportForm, subject: e.target.value })}
                      placeholder="Subject"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition text-sm"
                    />
                    <textarea
                      required
                      rows="3"
                      value={supportForm.message}
                      onChange={e => setSupportForm({ ...supportForm, message: e.target.value })}
                      placeholder="Briefly describe the issue..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition resize-none text-sm"
                    />
                    <button type="submit" className="w-full py-3 bg-navy text-white font-bold text-sm rounded-xl hover:bg-navy-light transition shadow-sm">
                      Submit Request
                    </button>
                  </form>
                </div>
              </div>

              {/* Accordion FAQ */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                <h2 className="font-sora font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" /> Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-slate-100 transition"
                      >
                        <span className="font-bold text-sm text-slate-800 pr-4">{faq.q}</span>
                        {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>
                      {openFaq === idx && (
                        <div className="p-4 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                          <div className="pt-4">{faq.a}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="bg-white rounded-2xl shadow-sm border border-error/20 p-6 md:p-8">
              <h2 className="font-sora text-xl font-bold text-error flex items-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6" /> Danger Zone
              </h2>
              <p className="text-sm font-medium text-slate-600 mb-8">Once you delete your account, all your data, enrolled classrooms, and wallet balances will be permanently lost.</p>

              <div className="p-6 bg-error/5 border border-error/20 rounded-xl max-w-lg">
                {!showDeleteForm ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-700">Are you sure you want to delete your account?</p>
                    <button
                      onClick={() => setShowDeleteForm(true)}
                      className="px-6 py-2.5 bg-error text-white text-sm font-bold rounded-xl hover:bg-red-700 transition"
                    >
                      Delete Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-slide-up-sm">
                    <p className="text-sm font-semibold text-error">This action cannot be undone. Please confirm:</p>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => setShowDeleteForm(false)}
                        className="flex-1 px-4 py-3 bg-white text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="flex-1 px-4 py-3 bg-error text-white text-sm font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                        {deleting && <Loader2 size={16} className="animate-spin" />} Permanently Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OTP verification Modal */}
      {otpModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
            <button onClick={() => setOtpModal(prev => ({ ...prev, isOpen: false }))} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              {otpModal.step === 1 && (
                <div>
                  <h3 className="font-sora font-bold text-xl text-navy mb-2">Update {otpModal.field === 'email' ? 'Email Address' : 'Phone Number'}</h3>
                  <p className="text-slate-500 text-sm mb-6">Enter your new {otpModal.field}. We will send an OTP to verify it.</p>
                  <div className="mb-6">
                    <input
                      type={otpModal.field === 'email' ? 'email' : 'tel'}
                      value={otpModal.value}
                      onChange={(e) => setOtpModal(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={otpModal.field === 'email' ? 'Enter new email' : 'Enter new phone number'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                    />
                  </div>
                  <button onClick={handleSendOtp} className="w-full py-3 bg-navy text-white rounded-xl font-bold shadow hover:bg-navy-light transition flex items-center justify-center gap-2">
                    Send Verification Code
                  </button>
                </div>
              )}

              {otpModal.step === 2 && (
                <div className="text-center">
                  <div className="w-12 h-12 bg-sky/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-sky" />
                  </div>
                  <h3 className="font-sora font-bold text-xl text-navy mb-2">Verify OTP Code</h3>
                  <p className="text-slate-500 text-sm mb-6">OTP sent to: <strong>{otpModal.value}</strong></p>
                  <div className="mb-6">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpModal.otp}
                      onChange={(e) => setOtpModal(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full text-center tracking-[0.2em] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold text-lg focus:outline-none focus:border-navy focus:bg-white transition"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSendOtp}
                      disabled={otpModal.cooldown > 0}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition disabled:opacity-50 text-xs"
                    >
                      {otpModal.cooldown > 0 ? `Resend in ${otpModal.cooldown}s` : 'Resend OTP'}
                    </button>
                    <button onClick={handleVerifyOtp} className="flex-1 py-3 bg-navy text-white rounded-xl font-bold shadow hover:bg-navy-light transition">
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {otpModal.step === 3 && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="font-sora font-bold text-2xl text-navy mb-2">Verification Successful</h3>
                  <p className="text-slate-500 text-sm mb-8">Your account has been updated successfully.</p>
                  <button onClick={() => setOtpModal(prev => ({ ...prev, isOpen: false }))} className="w-full py-3 bg-navy text-white rounded-xl font-bold shadow hover:bg-navy-light transition">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal Close icon wrapper for the Modal
function X(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}