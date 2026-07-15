// src/routes/ProtectedRoute.jsx
// Blocks unauthenticated users. Optionally restricts to specific roles.
// Also handles the teacher KYC-pending state — those teachers are redirected
// to /teacher/kyc except when they're already on that route.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/shared/Spinner';
import { ROLES } from '@/constants/enums';

const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, isLoading, role, kycPending } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/not-found" replace />;
  }

  // Teacher with pending KYC: only allow access to /teacher/kyc and /teacher/settings
  // All other teacher routes will redirect to the KYC page.
  if (
    role === ROLES.TEACHER &&
    kycPending &&
    !location.pathname.startsWith('/teacher/kyc') &&
    !location.pathname.startsWith('/teacher/settings')
  ) {
    return <Navigate to="/teacher/kyc" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
