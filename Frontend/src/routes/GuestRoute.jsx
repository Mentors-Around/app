// src/routes/GuestRoute.jsx
// Blocks already-authenticated users from seeing login/signup again.
// A KYC-pending teacher is sent directly to /teacher/kyc instead of their normal dashboard.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/shared/Spinner';
import { ROLES } from '@/constants/enums';

const GuestRoute = () => {
  const { isAuthenticated, isLoading, getDashboardRoute, role, kycPending } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isAuthenticated) {
    // Teacher with pending KYC → skip dashboard, go straight to KYC
    if (role === ROLES.TEACHER && kycPending) {
      return <Navigate to="/teacher/kyc" replace />;
    }
    return <Navigate to={getDashboardRoute()} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
