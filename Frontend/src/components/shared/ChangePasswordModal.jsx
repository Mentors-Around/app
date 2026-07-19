import { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPassword(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setError("All fields are required.");
      return;
    }
    
    if (passwords.new.length < 8) {
      setError("Please choose a stronger password.");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock failure for specific password to demonstrate error handling
      if (passwords.current === 'wrong') {
        throw new Error("❌ Incorrect current password.");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <h3 className="font-sora font-bold text-xl text-navy mb-2">Change Password</h3>
          <p className="text-slate-500 text-sm mb-6">Enter your current password and choose a new one to secure your account.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                placeholder="Enter current password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">New Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                placeholder="Enter new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Confirm New Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                placeholder="Confirm new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                required
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600 hover:text-navy transition">
                <input 
                  type="checkbox" 
                  checked={showPassword} 
                  onChange={() => setShowPassword(!showPassword)}
                  className="w-4 h-4 text-navy rounded focus:ring-navy border-slate-300"
                />
                Show Password
              </label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:bg-navy-light transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
