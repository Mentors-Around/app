import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { CheckCircle, Loader2 } from 'lucide-react';
import Alert from '../../components/shared/Alert';

const ResetPassword = () => {
  const { resetPassword, user, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-login check
  useEffect(() => {
    if (user) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [user, navigate, getDashboardRoute]);

  useEffect(() => {
    document.title = 'Reset Password — TrueEd';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Mock update password
      await resetPassword('user@example.com', password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-scale-in text-center py-6 font-inter">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="font-sora text-3xl font-bold text-navy mb-2">Password Updated</h2>
        <p className="text-slate-500 font-medium mb-8">
          Password Updated Successfully.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="font-inter">
      <div className="mb-6">
        <h2 className="font-sora text-2xl font-bold text-navy mb-2">Reset Password</h2>
        <p className="text-slate-500 font-medium">Enter a new secure password below</p>
      </div>

      {error && (
        <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          disabled={loading || !password || !confirmPassword}
          className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
