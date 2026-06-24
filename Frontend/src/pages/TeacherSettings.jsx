import { useState, useEffect } from 'react';

export default function TeacherSettings() {
  useEffect(() => {
    document.title = "Settings — TrueEd";
  }, []);

  const [toast, setToast] = useState(null);
  
  const [notifs, setNotifs] = useState({
    booking: true, reminder: true, queries: true, review: true, platform: true
  });
  
  const [privacy, setPrivacy] = useState({
    showProfile: true, allowMessages: true
  });
  
  const [passwords, setPasswords] = useState({
    current: '', new: '', confirm: ''
  });

  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      showToast('Password updated successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    }, 1000);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    showToast('Account deletion request submitted', 'error');
  };

  const toggleNotif = (key) => setNotifs(p => ({ ...p, [key]: !p[key] }));
  const togglePrivacy = (key) => setPrivacy(p => ({ ...p, [key]: !p[key] }));

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-bold text-navy">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button 
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg font-bold text-white flex items-center gap-2 z-50 transition-opacity ${toast.type === 'error' ? 'bg-red-500' : 'bg-navy'}`}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-check-circle'}`}></i>
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-sora font-extrabold text-navy mb-2">Settings</h1>
        <p className="text-gray-500">Manage your account preferences and security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-sora font-bold text-navy flex items-center gap-2">
                <i className="fa-solid fa-bell text-amber-500"></i> Notifications
              </h2>
            </div>
            <div className="p-6">
              <ToggleSwitch checked={notifs.booking} onChange={() => toggleNotif('booking')} label="New Bookings" description="Alerts for new session requests" />
              <ToggleSwitch checked={notifs.reminder} onChange={() => toggleNotif('reminder')} label="Session Reminders" description="Reminders 1 hr before classes" />
              <ToggleSwitch checked={notifs.queries} onChange={() => toggleNotif('queries')} label="Query Notifications" description="When a student asks a new query" />
              <ToggleSwitch checked={notifs.review} onChange={() => toggleNotif('review')} label="New Reviews" description="When a student leaves feedback" />
              <ToggleSwitch checked={notifs.platform} onChange={() => toggleNotif('platform')} label="Platform Updates" description="Important TrueEd announcements" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-sora font-bold text-navy flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-green-500"></i> Privacy
              </h2>
            </div>
            <div className="p-6">
              <ToggleSwitch checked={privacy.showProfile} onChange={() => togglePrivacy('showProfile')} label="Public Profile" description="Allow students to find you in search" />
              <ToggleSwitch checked={privacy.allowMessages} onChange={() => togglePrivacy('allowMessages')} label="Allow Messages" description="Students can message before booking" />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-sora font-bold text-navy flex items-center gap-2">
                <i className="fa-solid fa-lock text-sky"></i> Change Password
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwords.current}
                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky/50 outline-none" 
                  />
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={savingPassword}
                    className="w-full bg-navy hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2"
                  >
                    {savingPassword ? <><i className="fa-solid fa-spinner fa-spin"></i> Updating...</> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-lg font-sora font-bold text-red-700 flex items-center gap-2 mb-2">
              <i className="fa-solid fa-triangle-exclamation"></i> Danger Zone
            </h2>
            <p className="text-red-600/80 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-6 py-2.5 rounded-lg font-bold transition w-full"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl transition-opacity">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <h3 className="text-xl font-sora font-bold text-center text-navy mb-2">Are you absolutely sure?</h3>
            <p className="text-center text-gray-500 mb-6 text-sm">
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
