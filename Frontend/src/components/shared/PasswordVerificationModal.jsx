import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const PasswordVerificationModal = ({ isOpen, amount, onClose, onVerified, isWithdrawal = false }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("Password cannot be empty.");
      return;
    }
    
    setVerifying(true);
    
    try {
      // Expected backend integration: POST /verify-password
      const payload = { password, amount };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (password === 'wrong') {
        throw new Error("Incorrect password. Please try again.");
      }
      
      // Password verified successfully
      onVerified();
      setPassword('');
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[7000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-scale-in overflow-hidden relative">
        <button onClick={onClose} disabled={verifying} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Lock className="w-8 h-8 text-slate-700" />
          </div>
          <h3 className="font-sora font-bold text-xl text-navy text-center mb-2">Confirm Your Password</h3>
          <p className="text-sm font-medium text-slate-500 text-center mb-6 leading-relaxed">
            For your security, please enter your account password to complete this {isWithdrawal ? 'withdrawal' : 'wallet transaction'}.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                placeholder="Account Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-medium focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition"
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={verifying} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition">
                Cancel
              </button>
              <button type="submit" disabled={verifying} className="flex-[2] py-3 bg-navy text-white rounded-lg font-bold hover:bg-navy-light transition shadow-sm flex justify-center items-center gap-2">
                {verifying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (isWithdrawal ? 'Confirm Withdrawal' : 'Verify & Pay')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordVerificationModal;
