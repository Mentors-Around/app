import { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, ArrowRight } from 'lucide-react';

const OTPModal = ({ isOpen, onClose, fieldType, currentVal, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [newValue, setNewValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setNewValue('');
      setOtpValue('');
      setCountdown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const getLabel = () => {
    if (fieldType === 'email') return 'Email Address';
    if (fieldType === 'phone') return 'Phone Number';
    if (fieldType === 'parentPhone') return 'Parent / Guardian Number';
    return 'Value';
  };

  const handleSendOtp = () => {
    if (!newValue) return;
    setStep(2);
    setCountdown(30);
  };

  const handleVerifyOtp = () => {
    if (otpValue.length === 6 || otpValue.length === 4) {
      // Mock validation
      setStep(3);
    }
  };

  const handleFinish = () => {
    onSuccess(newValue, fieldType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          {step === 1 && (
            <div>
              <h3 className="font-sora font-bold text-xl text-navy mb-2">Update {getLabel()}</h3>
              <p className="text-slate-500 text-sm mb-6">Enter your new {fieldType === 'email' ? 'email address' : 'phone number'}. We will send an OTP to verify it.</p>
              
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">New {getLabel()}</label>
                <input 
                  type={fieldType === 'email' ? 'email' : 'tel'} 
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={fieldType === 'email' ? 'Enter new email' : 'Enter new number'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                />
              </div>
              
              <button 
                onClick={handleSendOtp}
                disabled={!newValue}
                className="w-full py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:bg-navy-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Send OTP <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-sky-500" />
              </div>
              <h3 className="font-sora font-bold text-xl text-navy mb-2">Verify OTP</h3>
              <p className="text-slate-500 text-sm mb-6">
                OTP sent to:<br/>
                <strong className="text-slate-700">{newValue}</strong>
              </p>
              
              <div className="mb-6">
                <input 
                  type="text" 
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[1em] bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-800 font-bold text-xl focus:outline-none focus:border-navy focus:bg-white transition"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setCountdown(30)}
                  disabled={countdown > 0}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition disabled:opacity-50"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
                <button 
                  onClick={handleVerifyOtp}
                  disabled={otpValue.length < 4}
                  className="flex-1 py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:bg-navy-light transition disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="font-sora font-bold text-2xl text-navy mb-2">Updated Successfully!</h3>
              <p className="text-slate-500 text-sm mb-8">✅ {getLabel()} updated successfully.</p>
              
              <button 
                onClick={handleFinish}
                className="w-full py-3 bg-navy text-white rounded-xl font-bold shadow-sm hover:bg-navy-light transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
