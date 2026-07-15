import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';

// Wraps every authenticated route (student/teacher/admin). Auth + role
// checks already happened in <ProtectedRoute>; this layout is presentation
// only — no localStorage, no redirect logic here.
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-page relative">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 block md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <div
          className={`flex-1 min-h-screen flex flex-col w-full relative z-30 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'md:ml-[64px]' : 'md:ml-[240px]'
          }`}
        >
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main key={location.pathname} className="p-4 md:p-6 lg:p-8 flex-1 animate-fadeIn">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
