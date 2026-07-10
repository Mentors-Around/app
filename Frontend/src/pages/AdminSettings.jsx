import { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle, Percent, IndianRupee, ServerCrash } from 'lucide-react';
import Spinner from '../components/shared/Spinner';

export default function AdminSettings() {
  useEffect(() => { document.title = "Settings — Admin Dashboard"; }, []);

  const [settings, setSettings] = useState({
    platformFee: 10,
    minWithdrawal: 1000,
    queryTokenPrice: 20,
    maintenanceMode: false
  });
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Platform Settings</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Configure global platform rules and fees.</p>
        </div>
      </div>

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
                  type="number" 
                  value={settings.platformFee}
                  onChange={e => setSettings({...settings, platformFee: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy outline-none focus:bg-white focus:border-sky transition pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1.5">Deducted from teacher earnings per classroom booking.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-slate-400" /> Minimum Withdrawal
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  type="number" 
                  value={settings.minWithdrawal}
                  onChange={e => setSettings({...settings, minWithdrawal: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy outline-none focus:bg-white focus:border-sky transition pl-8"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1.5">Minimum amount a teacher must earn before withdrawing.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-slate-400" /> Query Token Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  type="number" 
                  value={settings.queryTokenPrice}
                  onChange={e => setSettings({...settings, queryTokenPrice: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy outline-none focus:bg-white focus:border-sky transition pl-8"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1.5">Price per token for asking 1-on-1 doubts.</p>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div>
          <h2 className="font-sora text-lg font-bold text-navy mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
             System State
          </h2>
          <div className="p-5 border border-red-200 bg-red-50 rounded-xl flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <ServerCrash className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-red-900 mb-0.5">Maintenance Mode</p>
                <p className="text-sm font-medium text-red-700 max-w-lg">Enable this to prevent users from accessing the platform. Only admins will be able to log in. Use during major upgrades.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} className="sr-only peer" />
              <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>

        {/* Save */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {success && (
              <span className="flex items-center gap-2 text-sm font-bold text-emerald-600 animate-fade-in">
                <CheckCircle className="w-4 h-4" /> Settings updated successfully
              </span>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-light transition shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <><Spinner size="sm" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
