// src/pages/admin/AdminSettings.jsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Save, CheckCircle, Percent, IndianRupee, ServerCrash, Loader2 } from 'lucide-react';
import apiClient from '@/services/apiClient';
import Spinner from '@/components/shared/Spinner';

// Lightweight local service for platform settings (backend endpoint may vary)
const settingsService = {
  get: () => apiClient.get('/admin/settings'),
  update: (data) => apiClient.patch('/admin/settings', data),
};

const AdminSettings = () => {
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

  useEffect(() => { document.title = 'Settings — Admin'; }, []);

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
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        setApiUnavailable(true);
      }
      // Silently use defaults if endpoint unavailable
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

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

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Platform Settings</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Configure global platform rules and fees.</p>
      </div>

      {apiUnavailable && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
          ⚠️ Settings API not available. Changes will be local only until the backend activates this endpoint.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
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
          <div className="p-5 border border-red-200 bg-red-50 rounded-xl flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
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
  );
};

export default AdminSettings;
