// src/context/AuthContext.jsx
// Auth state backed by real httpOnly cookies (accessToken/refreshToken).
// We NEVER store tokens in localStorage/sessionStorage — the backend owns
// them entirely. On mount we just ask the backend "who am I?" via /users/me;
// a 401 there simply means "logged out", which is normal, not an error.
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '@/services/auth.service';
import userService from '@/services/user.service';

export const AuthContext = createContext(null);

const getInitials = (name) => {
  if (!name?.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts.at(-1)[0]).toUpperCase()
    : parts[0][0].toUpperCase();
};

const withInitials = (u) => (u ? { ...u, initials: getInitials(u.name) } : null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // kycPending: set when a teacher account exists but hasn't been approved yet
  const [kycPending, setKycPending] = useState(false);

  const role = user?.role ?? null;

  const hydrate = useCallback(async () => {
    try {
      const { data } = await userService.getMe();
      const me = data?.data ?? data;
      const actualUser = me?.user ?? me;
      setUser(withInitials(actualUser));
      setIsAuthenticated(true);
      // isVerificationPending comes from the User model (teachers only)
      setKycPending(!!(actualUser?.isVerificationPending));
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setKycPending(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
    const onSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      setKycPending(false);
    };
    window.addEventListener('trueed:session-expired', onSessionExpired);
    return () => window.removeEventListener('trueed:session-expired', onSessionExpired);
  }, [hydrate]);

  // setSession is called after a successful login/signup API call.
  // apiResponse wraps the backend ApiResponse shape: { statusCode, success, data: { user, accessToken, kycPending } }
  const setSession = useCallback((apiResponse) => {
    const payload = apiResponse?.data?.data ?? apiResponse?.data ?? apiResponse;
    const nextUser = payload?.user ?? payload;
    setUser(withInitials(nextUser));
    setIsAuthenticated(true);
    // kycPending flag comes from the login endpoint for teachers with pending KYC
    const pendingFlag = payload?.kycPending ?? !!(nextUser?.isVerificationPending);
    setKycPending(pendingFlag);
    return { user: nextUser, kycPending: pendingFlag };
  }, []);

  const loginWithPassword = useCallback(
    async (email, password) => {
      const res = await authService.loginWithPassword(email, password);
      return setSession(res);
    },
    [setSession],
  );

  const completeSignup = useCallback(
    async (payload) => {
      const res = await authService.signupComplete(payload);
      return setSession(res);
    },
    [setSession],
  );

  const completeGoogleSignup = useCallback(
    async (payload) => {
      const res = await authService.googleComplete(payload);
      return setSession(res);
    },
    [setSession],
  );

  const updateUser = useCallback((updates) => {
    setUser((prev) => withInitials({ ...prev, ...updates }));
    if (updates.isVerificationPending !== undefined) {
      setKycPending(!!updates.isVerificationPending);
    }
    if (updates.kycStatus === 'approved') {
      setKycPending(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setKycPending(false);
    }
  }, []);

  const getDashboardRoute = useCallback((r = role) => {
    const routes = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      admin: '/admin/dashboard',
    };
    return routes[r] || '/student/dashboard';
  }, [role]);

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      isLoading,
      kycPending,
      updateUser,
      loginWithPassword,
      completeSignup,
      completeGoogleSignup,
      logout,
      refreshUser: hydrate,
      getDashboardRoute,
    }),
    [user, role, isAuthenticated, isLoading, kycPending, updateUser, loginWithPassword,
      completeSignup, completeGoogleSignup, logout, hydrate, getDashboardRoute],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
