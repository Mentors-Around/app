import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

const getInitials = (name) => {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const defaultMockStudent = {
  name: 'Student User',
  initials: 'SU',
  email: 'student@example.com',
  phone: '+91 9876543210',
  location: 'Bangalore',
  school: 'National High School',
  class: 'Class 10',
  subjects: ['Mathematics', 'Science'],
  role: 'student',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('trueed_profile');
    const savedRole = localStorage.getItem('trueed_role');
    const savedToken = localStorage.getItem('trueed_token');

    if (savedToken && savedProfile && savedRole) {
      const parsedUser = JSON.parse(savedProfile);
      if (!parsedUser.initials && parsedUser.name) {
        parsedUser.initials = getInitials(parsedUser.name);
      }
      setUser(parsedUser);
      setRole(savedRole);
      setIsAuthenticated(true);
    } else {
      // Provide a functional UI even without login
      setUser(defaultMockStudent);
      setRole('student');
      setIsAuthenticated(true);
    }
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

  // Simulate phone OTP send
  const sendPhoneOTP = (phone) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, phone });
      }, 1500);
    });
  };

  // Verify phone OTP — demo code: 123456
  const verifyPhoneOTP = (otp) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (otp === '123456') {
          resolve({ success: true });
        } else {
          reject(new Error('Invalid OTP. Try 123456 for demo'));
        }
      }, 1200);
    });
  };

  // Register profile
  const register = (profile) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, profile });
      }, 1500);
    });
  };

  // Verify email OTP — demo code: 654321
  const verifyEmailOTP = (otp, profile) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (otp === '654321') {
          const profileWithInitials = {
            ...profile,
            initials: getInitials(profile.name)
          };
          // Save to localStorage
          localStorage.setItem('trueed_profile', JSON.stringify(profileWithInitials));
          localStorage.setItem('trueed_role', profile.role);
          localStorage.setItem('trueed_token', 'demo_token_' + Date.now());
          localStorage.setItem('trueed_uid', 'demo_uid_' + Date.now());

          setUser(profileWithInitials);
          setRole(profile.role);
          setIsAuthenticated(true);

          resolve({ success: true });
        } else {
          reject(new Error('Invalid code. Try 654321 for demo'));
        }
      }, 1200);
    });
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('trueed_profile');
    localStorage.removeItem('trueed_role');
    localStorage.removeItem('trueed_token');
    localStorage.removeItem('trueed_uid');
    
    // Provide a generic mock student on logout instead of crashing
    setUser(defaultMockStudent);
    setRole('student');
    setIsAuthenticated(false);
  };

  // Get route by role
  const getDashboardRoute = (userRole) => {
    const routes = {
      student: '/student/discover',
      teacher: '/teacher/dashboard',
      admin: '/admin/verify',
    };
    return routes[userRole] || '/student/discover';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        updateUser,
        sendPhoneOTP,
        verifyPhoneOTP,
        register,
        verifyEmailOTP,
        logout,
        getDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
