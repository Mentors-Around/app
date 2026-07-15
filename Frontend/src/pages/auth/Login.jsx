// src/pages/auth/Login.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Chrome } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import authService from '@/services/auth.service';
import Alert from '@/components/shared/Alert';
import { ROLES } from '@/constants/enums';

const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const Login = () => {
  const { loginWithPassword, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Show messages passed from other pages (e.g. "account created, please login")
  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message);
      // Clear state so refresh doesn't re-show it
      window.history.replaceState({}, '', location.pathname + location.search);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !isEmailValid(email)) return setError('Please enter a valid email address.');
    if (!password) return setError('Password is required.');

    setError('');
    setInfo('');
    setLoading(true);
    try {
      const { user, kycPending } = await loginWithPassword(email.trim().toLowerCase(), password);
      // Teacher with pending KYC → send them straight to KYC page
      if (user?.role === ROLES.TEACHER && kycPending) {
        navigate('/teacher/kyc', { replace: true });
        return;
      }
      const from = location.state?.from?.pathname
        || searchParams.get('next')
        || null;
      const dashRoute = getDashboardRoute(user?.role);
      navigate(from || dashRoute, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // This redirects the browser to Google OAuth — no await needed
      window.location.href = `/api/v1/auth/google?state=${encodeURIComponent(location.state?.from?.pathname || '')}`;
    } catch {
      setGoogleLoading(false);
      setError('Could not initiate Google login. Please try again.');
    }
  };

  return (
    <div className="font-inter">
      <div className="mb-6 text-center">
        <h2 className="font-sora text-3xl font-bold text-navy mb-2">Welcome Back</h2>
        <p className="text-slate-500 font-medium">Access your TrueEd dashboard</p>
      </div>

      {info && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-start gap-2">
          <span className="shrink-0 mt-0.5">✓</span>
          <span>{info}</span>
        </div>
      )}

      <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="login-email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. student@example.com"
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
              id="login-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
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
        </div>

        <button
          type="submit"
          id="login-submit"
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400">OR</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <button
        type="button"
        id="login-google"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-navy hover:bg-slate-50 transition flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Chrome className="w-5 h-5 text-sky" />
        )}
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm font-semibold text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-navy hover:text-sky transition font-bold">
          Create Account
        </Link>
      </p>
    </div>
  );
};

export default Login;
