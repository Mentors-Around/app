import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Alert from '../../components/shared/Alert';

const Login = () => {
  const { login, loginWithPhone, sendPhoneOTP, user, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab state: 'email' or 'phone'
  const [activeTab, setActiveTab] = useState('email');
  
  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // References for focus
  const emailRef = useRef(null);
  const phoneRef = useRef(null);


  // Auto-login check
  useEffect(() => {
    if (user) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [user, navigate, getDashboardRoute]);

  // Autofocus based on tab
  useEffect(() => {
    if (activeTab === 'email' && emailRef.current) {
      emailRef.current.focus();
    } else if (activeTab === 'phone' && phoneRef.current) {
      phoneRef.current.focus();
    }
  }, [activeTab]);

  // Cooldown timer for OTP resend
  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Inline Validation Helpers
  const isIdentifierValid = (val) => {
    if (!val || !val.trim()) return false;
    if (val.includes('@')) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    const cleaned = val.replace(/[\s-+]/g, '');
    if (/^\d+$/.test(cleaned)) {
      return cleaned.length >= 10;
    }
    return val.trim().length >= 3;
  };
  const isPhoneValid = (p) => /^\d{10}$/.test(p.replace(/[\s-+]/g, ''));

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Username, Email or Phone Number is required.');
      return;
    }
    if (!isIdentifierValid(email)) {
      setError('Please enter a valid Username, Email or Phone Number.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      navigate(getDashboardRoute(result.role));
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    const cleanPhone = phone.replace(/[\s-+]/g, '');
    if (!isPhoneValid(cleanPhone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await sendPhoneOTP(cleanPhone);
      setOtpSent(true);
      setOtpCooldown(30);
      const otpCode = res?._dev?.phoneOtp || '123456';
      alert(`📱 [DEV OTP ALERT]\nYour Phone OTP is: ${otpCode}`);
      setSuccess('Demo OTP is 123456');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    if (!otp) {
      setError('Verification code (OTP) is required.');
      return;
    }
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await loginWithPhone(phone, otp);
      navigate(getDashboardRoute(result.role));
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter">
      <div className="mb-6 text-center">
        <h2 className="font-sora text-3xl font-bold text-navy mb-2">Welcome Back</h2>
        <p className="text-slate-500 font-medium">Access your TrueEd dashboard</p>
      </div>

      {error && (
        <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />
      )}
      {success && (
        <Alert message={success} type="success" show={!!success} onDismiss={() => setSuccess('')} />
      )}

      {/* Email/Username/Phone Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Username, Email or Phone Number</label>
          <input
            ref={emailRef}
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter valid credentials"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" className="text-xs font-bold text-amber hover:text-amber-600 transition">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy cursor-pointer"
            />
            <span className="ml-2 text-sm font-semibold text-slate-600">Remember Me</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm font-semibold text-slate-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-navy hover:text-sky transition font-bold">
          Create Account
        </Link>
      </p>
    </div>
  );
};

export default Login;
