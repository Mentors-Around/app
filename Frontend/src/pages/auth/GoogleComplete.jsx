// src/pages/auth/GoogleComplete.jsx
// Handles new Google OAuth users who need to complete their profile
// (choose role, set DOB and password). Backend redirects here with ?g=<base64Profile>.
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Alert from '@/components/shared/Alert';
import { ROLES } from '@/constants/enums';

const isStrongPassword = (p) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(p);

const GoogleComplete = () => {
  const { completeGoogleSignup, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [googleData, setGoogleData] = useState('');
  const [profile, setProfile] = useState(null);
  const [parseError, setParseError] = useState('');

  const [role, setRole] = useState(ROLES.STUDENT);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const g = searchParams.get('g');
    if (!g) {
      setParseError('Missing Google profile data. Please try signing in again.');
      return;
    }
    try {
      const parsed = JSON.parse(atob(g));
      if (!parsed.email || !parsed.googleId) throw new Error('Incomplete');
      setGoogleData(g);
      setProfile(parsed);
    } catch {
      setParseError('Invalid Google profile data. Please try signing in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateOfBirth) return setError('Date of birth is required.');
    if (!isStrongPassword(password)) {
      return setError('Password must be at least 8 characters with at least one letter and one number.');
    }
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setError('');
    setLoading(true);
    try {
      const { user } = await completeGoogleSignup({
        googleData,
        role,
        dateOfBirth,
        password,
        name: profile?.name,
      });
      if (user?.role === ROLES.TEACHER) {
        navigate('/teacher/kyc', { replace: true });
      } else {
        navigate(getDashboardRoute(user?.role), { replace: true });
      }
    } catch (err) {
      setError(err?.message || 'Could not complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (parseError) {
    return (
      <div className="font-inter text-center">
        <AlertCircle className="mx-auto text-error mb-4" size={40} />
        <h2 className="font-sora text-xl font-bold text-navy mb-2">Something went wrong</h2>
        <p className="text-slate-500 text-sm mb-6">{parseError}</p>
        <Link to="/login" className="inline-block bg-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-navy-hover transition">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="font-inter">
      <div className="mb-6 text-center">
        {profile?.avatar && (
          <img src={profile.avatar} alt={profile.name} className="w-14 h-14 rounded-full mx-auto mb-3 border-2 border-slate-100 object-cover" />
        )}
        <h2 className="font-sora text-2xl font-bold text-navy mb-1">Complete your profile</h2>
        <p className="text-slate-500 text-sm font-medium">
          Welcome, <strong>{profile?.name || profile?.email}</strong>! Just a few more details.
        </p>
      </div>

      <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            {[ROLES.STUDENT, ROLES.TEACHER].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-3 rounded-xl font-bold text-sm border-2 transition capitalize ${
                  role === r ? 'border-navy bg-navy/5 text-navy' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            max={new Date(Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Set a Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ chars, letters and numbers"
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

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !dateOfBirth || !password || !confirmPassword}
          className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default GoogleComplete;
