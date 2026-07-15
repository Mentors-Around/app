import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import authService from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import Alert from '@/components/shared/Alert';
import { ROLES } from '@/constants/enums';

const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isPhoneValid = (p) => /^\d{10}$/.test(p.replace(/\D/g, ''));
const isStrongPassword = (p) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(p);

// Steps: identity (email/phone/role) -> otp (dual verify) -> profile (name/dob/password)
const Signup = () => {
  const { completeSignup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('identity');
  const [role, setRole] = useState(ROLES.STUDENT);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!isEmailValid(email)) return setError('Please enter a valid email address.');
    if (!isPhoneValid(phone)) return setError('Please enter a valid 10-digit phone number.');

    setError('');
    setLoading(true);
    try {
      await authService.signupSendOtp({ email: email.trim().toLowerCase(), phone: phone.replace(/\D/g, ''), role });
      setStep('otp');
      setCooldown(30);
    } catch (err) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (emailOtp.length !== 6 || phoneOtp.length !== 6) return setError('Enter both 6-digit codes.');

    setError('');
    setLoading(true);
    try {
      const { data } = await authService.signupVerifyOtp({
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        emailOtp,
        phoneOtp,
      });
      setSessionToken(data?.data?.sessionToken ?? data?.sessionToken);
      setStep('profile');
    } catch (err) {
      setError(err?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Full name is required.');
    if (!dateOfBirth) return setError('Date of birth is required.');
    if (!isStrongPassword(password)) {
      return setError('Password must be 8+ characters with at least one letter and one number.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setError('');
    setLoading(true);
    try {
      const payload = { sessionToken, name: name.trim(), role, dateOfBirth, password };
      if (role === ROLES.STUDENT) {
        const { user } = await completeSignup(payload);
        navigate(user?.role === ROLES.STUDENT ? '/student/dashboard' : '/teacher/dashboard', { replace: true });
      } else {
        // Teacher accounts require KYC before session issuance — no auto-login.
        await authService.signupComplete(payload);
        navigate('/login', {
          replace: true,
          state: { message: 'Account created! Log in to complete your KYC verification and start teaching.' },
        });
      }
    } catch (err) {
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter">
      <div className="mb-6 text-center">
        <h2 className="font-sora text-3xl font-bold text-navy mb-2">Create Your Account</h2>
        <p className="text-slate-500 font-medium">
          {step === 'identity' && 'Join TrueEd as a student or teacher'}
          {step === 'otp' && 'Verify your email and phone'}
          {step === 'profile' && 'A few more details to finish up'}
        </p>
      </div>

      <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />

      {step === 'identity' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
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

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. you@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !phone}
            className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Codes'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Code sent to {email}
            </label>
            <input
              type="text"
              maxLength={6}
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit email code"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Code sent to {phone}
            </label>
            <input
              type="text"
              maxLength={6}
              value={phoneOtp}
              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit phone code"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <button type="button" onClick={() => setStep('identity')} className="font-bold text-slate-500 hover:text-navy transition">
              Change details
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={cooldown > 0}
              className="font-bold text-amber hover:text-amber-600 disabled:opacity-50 transition"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend codes'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || emailOtp.length !== 6 || phoneOtp.length !== 6}
            className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
          </button>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters, letters and numbers"
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
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm font-semibold text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-navy hover:text-sky transition font-bold">
          Log In
        </Link>
      </p>
    </div>
  );
};

export default Signup;
