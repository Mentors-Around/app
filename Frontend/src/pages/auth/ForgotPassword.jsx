import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Alert from '../../components/shared/Alert';

const ForgotPassword = () => {
  const { resetPassword, sendPhoneOTP, verifyPhoneOTP, user, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-login redirect
  useEffect(() => {
    if (user) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [user, navigate, getDashboardRoute]);

  useEffect(() => {
    document.title = 'Forgot Password — TrueEd';
  }, []);

  const isEmail = (val) => val.includes('@');
  const isPhoneValid = (p) => /^\d{10}$/.test(p.replace(/[\s-+]/g, ''));

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!emailOrPhone) {
      setError('Please enter your Email Address or Phone Number.');
      return;
    }

    const cleanInput = emailOrPhone.trim();
    if (!isEmail(cleanInput) && !isPhoneValid(cleanInput)) {
      setError('Please enter a valid email address or 10-digit phone number.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Mock sending OTP
      await sendPhoneOTP(cleanInput);
      setSuccess('Demo OTP code is 123456');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }
    if (otp.length !== 6) {
      setError('Verification code must be 6 digits.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await verifyPhoneOTP(otp);
      setSuccess('');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Please enter both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await resetPassword(emailOrPhone, newPassword);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter">
      {step > 1 && step < 4 && (
        <button
          onClick={() => {
            setError('');
            setSuccess('');
            setStep(step - 1);
          }}
          className="absolute top-4 left-6 text-slate-400 hover:text-navy font-bold transition flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      {error && (
        <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />
      )}
      {success && (
        <Alert message={success} type="success" show={!!success} onDismiss={() => setSuccess('')} />
      )}

      {/* Step 1: Input Email/Phone */}
      {step === 1 && (
        <div>
          <div className="mb-6">
            <h2 className="font-sora text-2xl font-bold text-navy mb-2">Forgot Password</h2>
            <p className="text-slate-500 font-medium">Enter your email or phone number to reset</p>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email or Phone Number</label>
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="e.g. rahul@example.com or 9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !emailOrPhone}
              className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-semibold text-slate-500">
            Remembered your password?{' '}
            <Link to="/login" className="text-navy hover:text-sky transition font-bold">
              Log in
            </Link>
          </p>
        </div>
      )}

      {/* Step 2: Verification Code */}
      {step === 2 && (
        <div className="text-center">
          <div className="mb-6">
            <h2 className="font-sora text-2xl font-bold text-navy mb-2">Verify OTP</h2>
            <p className="text-slate-500 font-medium">
              Enter the 6-digit code we sent to
              <br />
              <span className="font-bold text-navy">{emailOrPhone}</span>
            </p>
          </div>

          <form onSubmit={handleStep2Submit}>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 123456"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-bold text-navy focus:outline-none focus:border-navy focus:bg-white transition mb-6"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mb-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
            </button>
          </form>

          <button
            onClick={() => {
              setOtp('');
              setStep(1);
            }}
            className="text-xs font-bold text-slate-500 hover:text-navy transition"
          >
            Use different email/phone
          </button>
        </div>
      )}

      {/* Step 3: Reset Password */}
      {step === 3 && (
        <div>
          <div className="mb-6">
            <h2 className="font-sora text-2xl font-bold text-navy mb-2">New Password</h2>
            <p className="text-slate-500 font-medium">Set a new secure password for your account</p>
          </div>

          <form onSubmit={handleStep3Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="animate-scale-in text-center py-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="font-sora text-3xl font-bold text-navy mb-2">Password Updated</h2>
          <p className="text-slate-500 font-medium mb-8">
            Your password has been updated successfully.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow-lg"
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
