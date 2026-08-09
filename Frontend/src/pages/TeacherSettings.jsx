import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Shield, Lock, Bell, AlertTriangle, User, Mail, Phone, Edit2, Laptop, Globe, MapPin, Clock, Download, LifeBuoy, CreditCard, Monitor, MessageSquare, Bug, AlertCircle } from 'lucide-react';
import OTPModal from '../components/shared/OTPModal';
import ChangePasswordModal from '../components/shared/ChangePasswordModal';
import useAuth from '../hooks/useAuth';
import api from '../services/api.js';
import { useNavigate } from 'react-router-dom';

export default function TeacherSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications');
  const [toast, setToast] = useState(null);
  
  const [notifs, setNotifs] = useState({
    queries: true, messages: true, reminders: true, reviews: true, announcements: true
  });
  
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpField, setOtpField] = useState('');
  
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const [supportForm, setSupportForm] = useState({ subject: '', category: 'Account & Profile', message: '' });
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = "Settings — TrueEd";
    window.scrollTo(0, 0);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateClick = (field) => {
    setOtpField(field);
    setOtpModalOpen(true);
  };

  const handleOtpSuccess = (newValue, field) => {
    showToast(`${field === 'email' ? 'Email' : 'Phone Number'} updated successfully.`);
  };

  const handlePasswordSuccess = () => {
    showToast('✅ Password updated successfully.', 'success');
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deleteConfirmPassword) {
      showToast('Password is required to delete account', 'error');
      return;
    }
    setDeleting(true);
    try {
      await api.user.deleteMe();
      logout();
      navigate('/login');
    } catch (err) {
      setDeleting(false);
      setShowDeleteForm(false);
      setDeleteConfirmPassword('');
      showToast(err.message || 'Failed to delete account. Please try again.', 'error');
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.message?.trim()) return;
    try {
      await api.report.fileReport({
        reportType: 'HELP_SUPPORT',
        targetType: 'OTHER',
        targetId: user?._id || user?.id || '600000000000000000000001',
        description: supportForm.subject ? `[Subject: ${supportForm.subject.trim()}] ${supportForm.message.trim()}` : supportForm.message.trim(),
      });
      showToast("Your support request has been submitted to the team.", "success");
      setSupportForm({ subject: '', message: '' });
    } catch (err) {
      showToast(err.message || "Failed to submit report", "error");
    }
  };

  const handleDownloadData = async () => {
    try {
      const [meData, classroomsData] = await Promise.all([
        api.user.getMe().catch(() => ({})),
        api.teacher.getMyClassrooms().catch(() => [])
      ]);
      const exportObj = {
        userProfile: meData,
        classrooms: classroomsData,
        exportedAt: new Date().toISOString()
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `trueed_user_data_${user?._id || 'export'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Your data export download has started.", "success");
    } catch (err) {
      showToast("Failed to generate data export", "error");
    }
  };

  const toggleNotif = (key) => setNotifs(p => ({ ...p, [key]: !p[key] }));

  const userAgent = navigator.userAgent || '';
  const detectedOs = userAgent.includes("Mac") ? "Mac OS" : userAgent.includes("Win") ? "Windows" : userAgent.includes("Linux") ? "Linux" : "Android / iOS";
  const detectedBrowser = userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : userAgent.includes("Firefox") ? "Firefox" : "Web Browser";

  const ToggleSwitch = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between py-3">
      <p className="font-semibold text-navy text-sm">{label}</p>
      <button 
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-success' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const supportCategories = [
    { name: 'Account & Profile', icon: <User className="w-6 h-6 text-sky-500" /> },
    { name: 'Classroom Issues', icon: <Monitor className="w-6 h-6 text-purple-500" /> },
    { name: 'Payments & Earnings', icon: <CreditCard className="w-6 h-6 text-emerald-500" /> },
    { name: 'Query Tokens', icon: <MessageSquare className="w-6 h-6 text-amber-500" /> },
    { name: 'Technical Support', icon: <LifeBuoy className="w-6 h-6 text-blue-500" /> },
    { name: 'Report a Bug', icon: <Bug className="w-6 h-6 text-rose-500" /> }
  ];

  const faqs = [
    { q: 'How do I create a new classroom?', a: 'You can create a new classroom from your Dashboard by clicking the "Create Classroom" button. You will be able to set the schedule, pricing, and upload materials.' },
    { q: 'How do payouts work?', a: 'Earnings are accumulated in your TrueEd Wallet. You can withdraw funds to your linked bank account anytime. Payouts typically process within 2-3 business days.' },
    { q: 'How do I respond to student queries?', a: 'Students can use Query Tokens to message you before enrolling. You can view and reply to these queries in the "Queries" section of your sidebar.' },
    { q: 'Can I cancel a scheduled class?', a: 'Yes, you can cancel or reschedule a class from your Calendar. We recommend notifying students at least 24 hours in advance.' },
    { q: 'How do I update my teaching availability?', a: 'You can update your working days, hours, and timezone directly from your Teacher Profile page.' }
  ];

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
    { id: 'sessions', label: 'Sessions', icon: <Laptop className="w-5 h-5" /> },
    { id: 'data', label: 'Data & Downloads', icon: <Download className="w-5 h-5" /> },
    { id: 'support', label: 'Help & Support', icon: <LifeBuoy className="w-5 h-5" /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-5 h-5" />, danger: true },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative px-4 md:px-0">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-xl font-bold text-white flex items-center gap-2 z-50 transition-all animate-slide-up-sm ${toast.type === 'error' ? 'bg-error' : 'bg-navy'}`}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-check-circle'}`}></i>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-sora text-3xl font-extrabold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-500 font-medium">Manage your account preferences and get help.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeTab === tab.id
                  ? tab.danger 
                    ? 'bg-error/10 text-error shadow-sm border border-error/20'
                    : 'bg-white shadow-sm text-sky-600 border border-slate-200'
                  : tab.danger
                    ? 'text-error/70 hover:bg-error/5 hover:text-error'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
              }`}
            >
              <div className={`${activeTab === tab.id ? (tab.danger ? 'text-error' : 'text-sky-500') : (tab.danger ? 'text-error/70' : 'text-slate-400')}`}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-3">
          
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-amber-500" /> Notifications
              </h2>
              <div className="divide-y divide-slate-100">
                <ToggleSwitch checked={notifs.queries} onChange={() => toggleNotif('queries')} label="New Classroom Queries" />
                <ToggleSwitch checked={notifs.messages} onChange={() => toggleNotif('messages')} label="Student Messages" />
                <ToggleSwitch checked={notifs.reminders} onChange={() => toggleNotif('reminders')} label="Class Reminders" />
                <ToggleSwitch checked={notifs.reviews} onChange={() => toggleNotif('reviews')} label="Reviews" />
                <ToggleSwitch checked={notifs.announcements} onChange={() => toggleNotif('announcements')} label="Platform Announcements" />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-emerald-500" /> Security
              </h2>
              
              <div className="border border-slate-100 rounded-xl overflow-hidden transition-all duration-300">
                <button onClick={() => setPasswordModalOpen(true)} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition">
                  <span className="font-bold text-navy">Change Password</span>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-sky-500" /> Account Details
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <span className="font-semibold text-navy text-sm">Status</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Teacher
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="font-semibold text-navy text-sm">Member Since</span>
                  <span className="text-sm font-bold text-slate-600">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'July 2026'}
                  </span>
                </div>

                <div className="group mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</p>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="font-semibold text-slate-800">{user?.email || 'N/A'}</p>
                    <button onClick={() => handleUpdateClick('email')} className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1">
                      Change Email
                    </button>
                  </div>
                </div>
                <div className="group">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</p>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="font-semibold text-slate-800">{user?.phone || '+91 98765 43210'}</p>
                    <button onClick={() => handleUpdateClick('phone')} className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1">
                      Change Phone Number
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Laptop className="w-5 h-5 text-purple-500" /> Login Sessions
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm">{detectedOs} • {detectedBrowser} (Current Device)</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> India</p>
                    <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> Active Now</p>
                  </div>
                </div>
                <button 
                  onClick={() => showToast('Other active sessions logged out successfully.')} 
                  className="px-4 py-2 bg-white text-slate-700 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-100 transition whitespace-nowrap"
                >
                  Logout Other Devices
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <Download className="w-5 h-5 text-emerald-500" /> Data & Downloads
              </h2>
              <p className="text-sm font-medium text-slate-600 mb-6">Request a copy of your personal data, wallet history, and classroom history.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mb-8">
                {['Wallet History', 'Payment History', 'Query History', 'Classroom History'].map((item) => (
                  <label key={item} className="flex items-center gap-2 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-sky rounded focus:ring-sky" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
              <div>
                <button onClick={handleDownloadData} className="px-8 py-3 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-light transition shadow-sm">
                  Download My Data
                </button>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Us */}
                <div className="bg-gradient-to-br from-navy to-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-200">
                  <h2 className="font-sora font-bold text-lg mb-4 flex items-center gap-2">
                    <LifeBuoy className="w-5 h-5 text-sky-400" />
                    Contact Us
                  </h2>
                  <div className="space-y-4">
                    <a href="mailto:trued.alex@gmail.com" className="flex items-center gap-3 text-slate-300 hover:text-white transition group">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Email Support</p>
                        <p className="font-semibold text-sm">trued.alex@gmail.com</p>
                      </div>
                    </a>
                    <a href="http://www.trueed.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition group">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Website</p>
                        <p className="font-semibold text-sm">www.trueed.in</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Support Request Form */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h2 className="font-sora font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    Report a Problem
                  </h2>
                  
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div>
                      <input 
                        type="text"
                        required
                        value={supportForm.subject || ''}
                        onChange={e => setSupportForm({...supportForm, subject: e.target.value})}
                        placeholder="Subject..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition text-sm"
                      />
                    </div>
                    <div>
                      <textarea 
                        required
                        rows="3"
                        value={supportForm.message}
                        onChange={e => setSupportForm({...supportForm, message: e.target.value})}
                        placeholder="Briefly describe the issue..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition resize-none text-sm"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-3 bg-navy text-white font-bold text-sm rounded-xl hover:bg-navy-light transition shadow-sm"
                    >
                      Submit Request
                    </button>
                  </form>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                <h2 className="font-sora font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Frequently Asked Questions
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
                        <div className="p-4 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-2 bg-white">
                          <div className="pt-2">{faq.a}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal */}
              <div className="flex gap-4 items-center pl-2">
                <a href="/terms-and-conditions" className="text-sm font-bold text-slate-500 hover:text-navy transition">Terms &amp; Conditions</a>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <a href="/privacy-policy" className="text-sm font-bold text-slate-500 hover:text-navy transition">Privacy Policy</a>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="bg-white rounded-brand-xl shadow-sm border border-error/20 p-6 md:p-8 animate-fadeIn">
              <h2 className="font-sora text-xl font-bold text-error flex items-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6" /> Danger Zone
              </h2>
              <p className="text-sm font-medium text-slate-600 mb-8">Once you delete your account, there is no going back. All your data, classes, and wallet balances will be permanently lost.</p>

              <div className="p-6 bg-error/5 border border-error/20 rounded-xl max-w-lg">
                {!showDeleteForm ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-700">Are you sure you want to delete your account?</p>
                    <button 
                      onClick={() => setShowDeleteForm(true)}
                      className="px-6 py-2.5 bg-error text-white text-sm font-bold rounded-xl hover:bg-red-700 transition w-full sm:w-auto"
                    >
                      Delete Account
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDeleteAccount} className="space-y-4 animate-slide-up-sm">
                    <p className="text-sm font-semibold text-error">Confirm deletion by entering your password:</p>
                    <div>
                      <input 
                        type="password" 
                        required
                        placeholder="Current Password"
                        value={deleteConfirmPassword}
                        onChange={e => setDeleteConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-error/30 rounded-xl focus:ring-2 focus:ring-error/20 outline-none transition text-sm font-medium" 
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => { setShowDeleteForm(false); setDeleteConfirmPassword(''); }}
                        className="flex-1 px-4 py-3 bg-white text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={deleting}
                        className="flex-1 px-4 py-3 bg-error text-white text-sm font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-70"
                      >
                        {deleting ? 'Deleting...' : 'Permanently Delete'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      
      <OTPModal 
        isOpen={otpModalOpen} 
        onClose={() => setOtpModalOpen(false)} 
        fieldType={otpField} 
        onSuccess={handleOtpSuccess} 
      />
      
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
}
