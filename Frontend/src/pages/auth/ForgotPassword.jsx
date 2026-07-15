import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import authService from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import Alert from '@/components/shared/Alert';

const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isPhoneValid = (p) => /^\d{10}$/.test(p.replace(/\D/g, ''));
const isStrongPassword = (p) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(p);

// Steps: request (choose channel) -> otp (verify) -> reset (new password)
const ForgotPassword = () => {
  const { getDashboardRoute, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('request');
  const [channel, setChannel] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (channel === 'email' && !isEmailValid(email)) return setError('Please enter a valid email address.');
    if (channel === 'phone' && !isPhoneValid(phone)) return setError('Please enter a valid 10-digit phone number.');

    setError('');
    setLoading(true);
    try {
      const { data } = await authService.forgotPasswordSendOtp({
        channel,
        email: channel === 'email' ? email.trim().toLowerCase() : undefined,
        phone: channel === 'phone' ? phone.replace(/\D/g, '') : undefined,
      });
      setInfo(data?.data?.message ?? data?.message ?? 'If an account exists, an OTP has been sent.');
      setStep('otp');
    } catch (err) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('Enter the 6-digit code.');

    setError('');
    setLoading(true);
    try {
      const { data } = await authService.forgotPasswordVerifyOtp({
        channel,
        email: channel === 'email' ? email.trim().toLowerCase() : undefined,
        phone: channel === 'phone' ? phone.replace(/\D/g, '') : undefined,
        otp,
      });
      setSessionToken(data?.data?.sessionToken ?? data?.sessionToken);
      setStep('reset');
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(newPassword)) {
      return setError('Password must be 8+ characters with at least one letter and one number.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setError('');
    setLoading(true);
    try {
      await authService.resetPassword({ sessionToken, newPassword });
      await refreshUser();
      navigate(getDashboardRoute(), { replace: true });
    } catch (err) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter">
      <div className="mb-6 text-center">
        <h2 className="font-sora text-3xl font-bold text-navy mb-2">Reset Password</h2>
        <p className="text-slate-500 font-medium">
          {step === 'request' && "We'll send a code to verify it's you"}
          {step === 'otp' && 'Enter the code we sent you'}
          {step === 'reset' && 'Choose a new password'}
        </p>
      </div>

      <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />
      <Alert message={info} type="success" show={!!info && step === 'otp'} onDismiss={() => setInfo('')} />

      {step === 'request' && (
        <form onSubmit={handleSend} className="space-y-4">
          <div className="flex border-b border-slate-100 mb-2">
            {['email', 'phone'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition capitalize ${
                  channel === c ? 'border-navy text-navy' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {channel === 'email' ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. you@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          ) : (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-navy focus:bg-white transition"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (8+ chars, letters & numbers)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password & Log In'}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm font-semibold text-slate-500">
        Remembered it?{' '}
        <Link to="/login" className="text-navy hover:text-sky transition font-bold">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
