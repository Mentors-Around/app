import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Alert from '@/components/shared/Alert';
import { ROLES } from '@/constants/enums';

// Admin accounts are regular Users with role='admin' — same login endpoint,
// we just refuse access here if the authenticated account isn't an admin.
const AdminLogin = () => {
  const { loginWithPassword, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please enter both email and password.');

    setError('');
    setLoading(true);
    try {
      // If another user session is active, log them out silently first
      // so the admin credentials can establish a fresh session.
      await logout().catch(() => {});

      const { user } = await loginWithPassword(email.trim().toLowerCase(), password);
      if (user?.role !== ROLES.ADMIN) {
        await logout();
        setError('This account does not have admin access.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter">
      <div className="mb-6 text-center">
        <h2 className="font-sora text-3xl font-bold text-navy mb-2">Admin Access</h2>
        <p className="text-slate-500 font-medium">Restricted to authorized administrators</p>
      </div>

      <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login as Admin'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
