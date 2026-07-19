import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Alert from '../../components/shared/Alert';

const AdminLogin = () => {
  const { login, user, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-login redirect
  useEffect(() => {
    if (user) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [user, navigate, getDashboardRoute]);

  useEffect(() => {
    document.title = 'Admin Login — TrueEd';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (email.toLowerCase() !== 'admin@trueed.in' || password !== 'Admin@123') {
      setError('Invalid admin credentials.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Unauthorized access. Only admin credentials allowed.');
      }
    } catch (err) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
          Admin Portal
        </div>
        <h2 className="font-sora text-2xl font-bold text-navy mb-1">Admin Login</h2>
        <p className="text-slate-500 text-sm font-medium">Verify credentials to access admin panel</p>
      </div>

      {error && (
        <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@trueed.in"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In to Dashboard'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
