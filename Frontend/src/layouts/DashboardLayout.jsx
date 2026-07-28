import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';
import Topbar from '../components/shared/Topbar';
import PageTransition from '../components/PageTransition';

import useAuth from '../hooks/useAuth';
import api from '../services/api.js';

const DashboardLayout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout, updateUser } = useAuth();

  // Refresh user details from API on navigation changes
  useEffect(() => {
    const fetchLatestUser = async () => {
      try {
        const res = await api.user.getMe();
        if (res?.user) {
          updateUser(res.user);
        }
      } catch (err) {
        console.warn('Failed to refresh user profile:', err.message);
      }
    };
    if (localStorage.getItem('trueed_token')) {
      fetchLatestUser();
    }
  }, [location.pathname]);

  // Route protection: redirect to /login if no user data in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('trueed_token');
    const savedRole = localStorage.getItem('trueed_role');
    
    // If there is no auth token, redirect to login
    if (!savedToken) {
      navigate('/login', { replace: true });
      return;
    }

    // Role-based route protection
    if (role === 'admin' && savedRole !== 'admin') {
      navigate('/login', { replace: true });
      return;
    }

    // If teacher KYC is not approved yet, redirect to KYC if it's pending/rejected
    if (savedRole === 'teacher' && user) {
      if (user.kycStatus === 'pending' || user.kycStatus === 'rejected') {
        navigate('/teacher/kyc', { replace: true });
      }
    }
  }, [navigate, role, user]);

  // Prevent body scrolling when sidebar drawer is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-page relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 block md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          role={role} 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        
        {/* Main content */}
        <div className={`flex-1 min-h-screen flex flex-col w-full relative z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-[64px]' : 'md:ml-[240px]'}`}>
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          {role === 'teacher' && user?.kycStatus === 'under_review' ? (
            <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
              <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <i className="fa-solid fa-clock text-4xl" />
                </div>
                <h2 className="font-sora text-2xl font-bold text-navy">Verification In Progress</h2>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  Your KYC verification is ongoing. We will mail you once you are verified and then you can access the functionalities of our website.
                </p>
                <div className="pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => { authLogout(); navigate('/login'); }} 
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </main>
          ) : (
            <main className="p-4 md:p-6 lg:p-8 flex-1">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </main>
          )}
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
