import { createContext, useState, useEffect } from 'react';

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

  // Load from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('trueed_profile');
    const savedRole = localStorage.getItem('trueed_role');
    const savedToken = localStorage.getItem('trueed_token');

    if (savedToken && savedProfile && savedRole) {
      try {
        const parsedUser = JSON.parse(savedProfile);
        if (!parsedUser.initials && parsedUser.name) {
          parsedUser.initials = getInitials(parsedUser.name);
        }
        setUser(parsedUser);
        setRole(savedRole);
        setIsAuthenticated(true);
      } catch (e) {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    }
    
    const savedKycStatus = localStorage.getItem('trueed_kyc_status');
    const savedKycReason = localStorage.getItem('trueed_kyc_reason');
    if (savedKycStatus) setKycStatus(savedKycStatus);
    if (savedKycReason) setKycReason(savedKycReason);
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

  const login = (email, password, rememberMe = false) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !password) {
          reject(new Error('Please fill in all fields'));
          return;
        }

        const ADMIN_EMAILS = [
          "admin@trueed.in",
          "founder@trueed.in",
          "hariprasad@trueed.in"
        ];

        // MVP Admin check
        const isEmailAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        if (isEmailAdmin) {
          if (password === 'Admin@123') {
            const mockProfile = {
              name: 'Admin User',
              email: email.toLowerCase(),
              role: 'admin',
              initials: 'AD'
            };
            localStorage.setItem('trueed_profile', JSON.stringify(mockProfile));
            localStorage.setItem('trueed_role', 'admin');
            localStorage.setItem('trueed_token', 'demo_token_' + Date.now());
            setUser(mockProfile);
            setRole('admin');
            setIsAuthenticated(true);
            resolve({ success: true, role: 'admin' });
            return;
          } else {
            reject(new Error('Invalid admin credentials'));
            return;
          }
        }

        // Regular login logic
        let userRole = 'student';
        if (email.toLowerCase().includes('teacher')) {
          userRole = 'teacher';
        }

        const mockProfile = {
          name: email.split('@')[0],
          email: email,
          role: userRole,
          initials: getInitials(email.split('@')[0])
        };

        localStorage.setItem('trueed_profile', JSON.stringify(mockProfile));
        localStorage.setItem('trueed_role', userRole);
        localStorage.setItem('trueed_token', 'demo_token_' + Date.now());
        
        setUser(mockProfile);
        setRole(userRole);
        setIsAuthenticated(true);

        resolve({ success: true, role: userRole });
      }, 1200);
    });
  };

  const loginWithPhone = (phone, otp) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (otp === '123456') {
          let userRole = 'student';
          if (phone.includes('99999')) {
            userRole = 'teacher';
          }
          const mockProfile = {
            name: 'Phone User',
            phone: phone,
            role: userRole,
            initials: 'PU'
          };
          localStorage.setItem('trueed_profile', JSON.stringify(mockProfile));
          localStorage.setItem('trueed_role', userRole);
          localStorage.setItem('trueed_token', 'demo_token_' + Date.now());

          setUser(mockProfile);
          setRole(userRole);
          setIsAuthenticated(true);
          resolve({ success: true, role: userRole });
        } else {
          reject(new Error('Invalid OTP. Use 123456 for demo.'));
        }
      }, 1200);
    });
  };

  const sendPhoneOTP = (phone) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), 1200);
    });
  };

  const verifyPhoneOTP = (otp) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (otp === '123456') {
          resolve({ success: true });
        } else {
          reject(new Error('Invalid OTP. Use 123456 for demo.'));
        }
      }, 1200);
    });
  };

  const register = (profileData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profileWithInitials = {
          ...profileData,
          initials: getInitials(profileData.name)
        };
        
        localStorage.setItem('trueed_profile', JSON.stringify(profileWithInitials));
        localStorage.setItem('trueed_role', profileData.role);
        localStorage.setItem('trueed_token', 'demo_token_' + Date.now());
        localStorage.setItem('trueed_uid', 'demo_uid_' + Date.now());

        setUser(profileWithInitials);
        setRole(profileData.role);
        setIsAuthenticated(true);

        resolve({ success: true, role: profileData.role });
      }, 1500);
    });
  };

  const resetPassword = (emailOrPhone, newPassword) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), 1200);
    });
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('trueed_profile');
    localStorage.removeItem('trueed_role');
    localStorage.removeItem('trueed_token');
    localStorage.removeItem('trueed_uid');
    
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  // Get route by role
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
