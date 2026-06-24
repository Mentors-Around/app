import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';
import Topbar from '../components/shared/Topbar';
import PageTransition from '../components/PageTransition';

const DashboardLayout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Route protection: redirect to /login if no user data in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('trueed_user');
    const savedToken = localStorage.getItem('trueed_token');
    // If there is no auth token, redirect to login
    if (!savedToken) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream relative">
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
          <main className="p-4 md:p-6 lg:p-8 flex-1">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
