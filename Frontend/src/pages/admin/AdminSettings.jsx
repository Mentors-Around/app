// src/pages/admin/AdminSettings.jsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Save, CheckCircle, Percent, IndianRupee, ServerCrash, Loader2,
  User, Laptop, Shield, Mail, Phone, Settings, X
} from 'lucide-react';
import apiClient from '@/services/apiClient';
import Spinner from '@/components/shared/Spinner';
import { useAuth } from '@/hooks/useAuth';
import userService from '@/services/user.service';
import ThemePreferences from '@/components/shared/ThemePreferences';
import { formatDate } from '@/utils/date.util';

// Lightweight local service for platform settings (backend endpoint may vary)
const settingsService = {
  get: () => apiClient.get('/admin/settings'),
  update: (data) => apiClient.patch('/admin/settings', data),
};

const AdminSettings = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('platform');

  const [settings, setSettings] = useState({
    platformFeePercent: 10,
    minWithdrawalRupees: 1000,
    queryTokenPriceRupees: 20,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // OTP Verification States
  const [otpModal, setOtpModal] = useState({ isOpen: false, field: '', value: '', step: 1, otp: '', cooldown: 0 });

  useEffect(() => {
    document.title = 'Settings — Admin';
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await settingsService.get();
      const payload = data?.data ?? data;
      if (payload) {
        setSettings(prev => ({
          ...prev,
          platformFeePercent: payload.platformFeePercent ?? payload.platformFee ?? prev.platformFeePercent,
          minWithdrawalRupees: payload.minWithdrawalRupees ?? payload.minWithdrawal ?? prev.minWithdrawalRupees,
          queryTokenPriceRupees: payload.queryTokenPriceRupees ?? payload.queryTokenPrice ?? prev.queryTokenPriceRupees,
          maintenanceMode: payload.maintenanceMode ?? prev.maintenanceMode,
        }));
      }
    } catch (err) {
      const status = err?.statusCode || err?.response?.status;
      if (status === 404 || status === 405) {
        setApiUnavailable(true);
      }
      // Silently use defaults if endpoint unavailable
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (otpModal.cooldown <= 0) return;
    const t = setInterval(() => {
      setOtpModal(prev => ({ ...prev, cooldown: prev.cooldown - 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [otpModal.cooldown]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      if (apiUnavailable) {
        // No backend — just simulate
        await new Promise(r => setTimeout(r, 800));
        toast.success('Settings saved (local only — backend unavailable)');
      } else {
        await settingsService.update(settings);
        toast.success('Settings updated successfully');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast.error(err?.message || 'Could not save settings');
    } finally { setSaving(false); }
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

  const tabs = [
    { id: 'platform', label: 'Platform Rules', icon: <Settings className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile Settings', icon: <User className="w-5 h-5" /> },
    { id: 'theme', label: 'Theme & Appearance', icon: <Laptop className="w-5 h-5" /> },
  ];

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 animate-fadeIn relative px-4 md:px-0">
      <div>
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">Control Panel Settings</h1>
        <p className="text-slate-500 font-medium">Configure global parameters and manage your admin preferences.</p>
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
                  ? 'bg-white shadow-sm text-sky border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
              }`}
            >
              <div className={`${activeTab === tab.id ? 'text-sky' : 'text-slate-400'}`}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="md:col-span-3">
          {activeTab === 'platform' && (
            <div className="space-y-6">
              {apiUnavailable && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
                  ⚠️ Settings API not available. Changes will be local only until the backend activates this endpoint.
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-8">
                {/* Financial Settings */}
                <div>
                  <h2 className="font-sora text-lg font-bold text-navy mb-4 border-b border-slate-100 pb-2">Financial Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-slate-400" /> Platform Fee (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number" min={0} max={100} step={0.5}
                          value={settings.platformFeePercent}
                          onChange={e => setSettings({ ...settings, platformFeePercent: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy outline-none focus:bg-white focus:border-sky transition pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-1.5">Deducted from teacher earnings per booking.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4 text-slate-400" /> Minimum Withdrawal (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          type="number" min={0}
                          value={settings.minWithdrawalRupees}
                          onChange={e => setSettings({ ...settings, minWithdrawalRupees: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy outline-none focus:bg-white focus:border-sky transition pl-8"
                        />
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-1.5">Minimum amount before a teacher can withdraw.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4 text-slate-400" /> Query Token Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          type="number" min={1}
                          value={settings.queryTokenPriceRupees}
                          onChange={e => setSettings({ ...settings, queryTokenPriceRupees: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy outline-none focus:bg-white focus:border-sky transition pl-8"
                        />
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-1.5">Price per token for 1-on-1 doubt sessions.</p>
                    </div>
                  </div>
                </div>

                {/* System Settings */}
                <div>
                  <h2 className="font-sora text-lg font-bold text-navy mb-4 border-b border-slate-100 pb-2">System State</h2>
                  <div className="p-5 border border-red-200 bg-red-50/50 rounded-xl flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex gap-3">
                      <ServerCrash className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-red-900 mb-0.5">Maintenance Mode</p>
                        <p className="text-sm font-medium text-red-700 max-w-lg">
                          Enable this to prevent users from accessing the platform. Only admins can log in. Use during major upgrades.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
                    </label>
                  </div>
                </div>

                {/* Save */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {success && (
                      <span className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                        <CheckCircle className="w-4 h-4" /> Settings updated successfully
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-hover transition shadow-sm flex items-center gap-2 disabled:opacity-70"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
              <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-sky" /> Admin Profile Details
              </h2>
              <div className="space-y-6 max-w-xl">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="font-semibold text-navy text-sm">Status</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> Active Platform Administrator
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
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <ThemePreferences />
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
};

export default AdminSettings;
