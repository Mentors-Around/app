import { createContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext(null);

const getInitials = (name) => {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [kycStatus, setKycStatus] = useState('NOT_VERIFIED');
  const [kycReason, setKycReason] = useState('');
  const [loading, setLoading] = useState(true);

  // Sync profile & token from Backend on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('trueed_token');
      const savedProfile = localStorage.getItem('trueed_profile');
      const savedRole = localStorage.getItem('trueed_role');

      if (savedToken) {
        try {
          const profileData = await api.user.getMe();
          const profileUser = profileData?.user || profileData;
          if (profileUser && profileUser._id) {
            profileUser.initials = getInitials(profileUser.name);
            setUser(profileUser);
            setRole(profileUser.role);
            setIsAuthenticated(true);
            localStorage.setItem('trueed_profile', JSON.stringify(profileUser));
            localStorage.setItem('trueed_role', profileUser.role);
            
            const kyc = profileUser.kycStatus || (profileUser.isVerificationPending ? 'pending' : 'VERIFIED');
            setKycStatus(kyc);
          } else if (savedProfile && savedRole) {
            const parsedUser = JSON.parse(savedProfile);
            parsedUser.initials = getInitials(parsedUser.name);
            setUser(parsedUser);
            setRole(savedRole);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.warn('Failed to verify token on mount:', err.message);
          if (err.status === 401) {
            localStorage.removeItem('trueed_token');
            localStorage.removeItem('trueed_profile');
            localStorage.removeItem('trueed_role');
            setUser(null);
            setRole(null);
            setIsAuthenticated(false);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const updateUser = (updates) => {
    setUser((prevUser) => {
      const newUser = { ...prevUser, ...updates };
      if (updates.name !== undefined) {
        newUser.initials = getInitials(updates.name);
      }
      localStorage.setItem('trueed_profile', JSON.stringify(newUser));
      return newUser;
    });
  };

  const updateKycStatus = (status, reason = '') => {
    setKycStatus(status);
    setKycReason(reason);
    localStorage.setItem('trueed_kyc_status', status);
    localStorage.setItem('trueed_kyc_reason', reason);
  };

  const login = async (email, password, rememberMe = false) => {
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }

    try {
      const res = await api.auth.login(email, password);
      const userObj = res.user || res;
      const accessToken = res.accessToken || res.token;

      if (userObj && accessToken) {
        userObj.initials = getInitials(userObj.name);
        localStorage.setItem('trueed_token', accessToken);
        localStorage.setItem('trueed_profile', JSON.stringify(userObj));
        localStorage.setItem('trueed_role', userObj.role);

        setUser(userObj);
        setRole(userObj.role);
        setIsAuthenticated(true);

        const currentKyc = userObj.kycStatus || (res.kycPending ? 'pending' : 'VERIFIED');
        setKycStatus(currentKyc);

        return { success: true, role: userObj.role, user: userObj };
      } else {
        throw new Error('Invalid login response from server');
      }
    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const loginWithPhone = async (phone, otp) => {
    throw new Error('Please login using your Email and Password.');
  };

  const sendPhoneOTP = async (phone) => {
    return { success: true };
  };

  const verifyPhoneOTP = async (otp) => {
    return { success: true };
  };

  const register = async (profileData) => {
    try {
      const res = await api.auth.signupComplete(profileData);
      const userObj = res.user || res;
      const accessToken = res.accessToken;

      if (userObj && accessToken) {
        userObj.initials = getInitials(userObj.name);
        localStorage.setItem('trueed_token', accessToken);
        localStorage.setItem('trueed_profile', JSON.stringify(userObj));
        localStorage.setItem('trueed_role', userObj.role);

        setUser(userObj);
        setRole(userObj.role);
        setIsAuthenticated(true);

        return { success: true, role: userObj.role };
      }
      return { success: true, message: res.message || 'Registration complete' };
    } catch (err) {
      throw new Error(err.message || 'Registration failed');
    }
  };

  const resetPassword = async (emailOrPhone, newPassword) => {
    try {
      const res = await api.auth.resetPassword(emailOrPhone, newPassword);
      return { success: true, ...res };
    } catch (err) {
      throw new Error(err.message || 'Password reset failed');
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('trueed_profile');
      localStorage.removeItem('trueed_role');
      localStorage.removeItem('trueed_token');
      localStorage.removeItem('trueed_uid');
      localStorage.removeItem('trueed_kyc_status');
      
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    }
  };

  const getDashboardRoute = (userRole) => {
    const routes = {
      student: '/student/discover',
      teacher: '/teacher/dashboard',
      admin: '/admin/dashboard',
    };
    return routes[userRole] || '/student/discover';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        kycStatus,
        kycReason,
        loading,
        updateUser,
        updateKycStatus,
        login,
        loginWithPhone,
        sendPhoneOTP,
        verifyPhoneOTP,
        register,
        resetPassword,
        logout,
        getDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
