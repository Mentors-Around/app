// src/routes/AppRoutes.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import PublicLayout from '@/layouts/PublicLayout';
import Spinner from '@/components/shared/Spinner';
import { ROLES } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';

// ── Public & Shared ──
const LandingPage = lazy(() => import('@/pages/shared/LandingPage'));
const NotFound = lazy(() => import('@/pages/shared/NotFound'));
const PublicTeacherProfile = lazy(() => import('@/pages/shared/PublicTeacherProfile'));
const AboutUs = lazy(() => import('@/pages/shared/AboutUs'));
const Safety = lazy(() => import('@/pages/shared/Safety'));
const TeacherBecome = lazy(() => import('@/pages/shared/TeacherBecome'));
const TeacherEarningsInfo = lazy(() => import('@/pages/shared/TeacherEarningsInfo'));
const TeacherVerification = lazy(() => import('@/pages/shared/TeacherVerification'));
const Community = lazy(() => import('@/pages/shared/Community'));
const Contact = lazy(() => import('@/pages/shared/Contact'));
const Legal = lazy(() => import('@/pages/shared/Legal'));
const RefundPolicy = lazy(() => import('@/pages/shared/RefundPolicy'));
const CoachingCenters = lazy(() => import('@/pages/shared/CoachingCenters'));
const HowPaymentsWork = lazy(() => import('@/pages/shared/HowPaymentsWork'));
const SubjectLandingPage = lazy(() => import('@/pages/shared/SubjectLandingPage'));
const Notifications = lazy(() => import('@/pages/shared/Notifications'));
const Support = lazy(() => import('@/pages/shared/Support'));

// ── Auth ──
const Login = lazy(() => import('@/pages/auth/Login'));
const Signup = lazy(() => import('@/pages/auth/Signup'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const AdminLogin = lazy(() => import('@/pages/auth/AdminLogin'));
const GoogleComplete = lazy(() => import('@/pages/auth/GoogleComplete'));

// ── Student ──
const StudentDiscover = lazy(() => import('@/pages/student/StudentDiscover'));
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'));
const StudentWallet = lazy(() => import('@/pages/student/StudentWallet'));
const StudentProfile = lazy(() => import('@/pages/student/StudentProfile'));
const MyQueriesPage = lazy(() => import('@/pages/student/MyQueriesPage'));
const StudentBookings = lazy(() => import('@/pages/student/StudentBookings'));
const StudentClassroomDetails = lazy(() => import('@/pages/student/StudentClassroomDetails'));
const StudentSettings = lazy(() => import('@/pages/student/StudentSettings'));
const StudentFavourites = lazy(() => import('@/pages/student/StudentFavourites'));
const StudentTests = lazy(() => import('@/pages/student/StudentTests'));
const StudentTestTaking = lazy(() => import('@/pages/student/StudentTestTaking'));
const StudentTestResults = lazy(() => import('@/pages/student/StudentTestResults'));

// ── Teacher ──
const TeacherDashboard = lazy(() => import('@/pages/teacher/TeacherDashboard'));
const TeacherClassrooms = lazy(() => import('@/pages/teacher/TeacherClassrooms'));
const TeacherClassroomDetails = lazy(() => import('@/pages/teacher/TeacherClassroomDetails'));
const TeacherWallet = lazy(() => import('@/pages/teacher/TeacherWallet'));
const TeacherKYC = lazy(() => import('@/pages/teacher/TeacherKYC'));
const TeacherSettings = lazy(() => import('@/pages/teacher/TeacherSettings'));
const TeacherQueriesPage = lazy(() => import('@/pages/teacher/TeacherQueriesPage'));
const TeacherDoubtsPage = lazy(() => import('@/pages/teacher/TeacherDoubtsPage'));
const TeacherReports = lazy(() => import('@/pages/teacher/TeacherReports'));
const TeacherReviews = lazy(() => import('@/pages/teacher/TeacherReviews'));
const TeacherStudents = lazy(() => import('@/pages/teacher/TeacherStudents'));

// ── Admin ──
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'));
const AdminPayouts = lazy(() => import('@/pages/admin/AdminPayouts'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));

const Fallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-page">
    <Spinner size="lg" />
  </div>
);

// Smart /dashboard redirect — sends user to their role-specific dashboard
const DashboardRedirect = () => {
  const { isAuthenticated, isLoading, getDashboardRoute } = useAuth();
  if (isLoading) return <Fallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardRoute()} replace />;
};

const AppRoutes = () => (
  <Suspense fallback={<Fallback />}>
    <Routes>
      {/* Smart /dashboard catch-all for Google OAuth existing-user redirect */}
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Public Pages wrapped in PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/support" element={<Support />} />
        <Route path="/teacher/become" element={<TeacherBecome />} />
        <Route path="/teacher/earnings-info" element={<TeacherEarningsInfo />} />
        <Route path="/teacher/verification" element={<TeacherVerification />} />
        <Route path="/community" element={<Community />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Legal />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/coaching-centers" element={<CoachingCenters />} />
        <Route path="/how-payments-work" element={<HowPaymentsWork />} />
        <Route path="/subjects/:subject" element={<SubjectLandingPage />} />
        <Route path="/teachers/:teacherId" element={<PublicTeacherProfile />} />
        {/* Public discover — browseable without login */}
        <Route path="/discover" element={<StudentDiscover />} />
      </Route>

      {/* Guest-only auth pages (redirect to dashboard if already logged in) */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          {/* Google OAuth: new user profile completion page */}
          <Route path="/auth/complete-profile" element={<GoogleComplete />} />
        </Route>
      </Route>

      {/* Student */}
      <Route element={<ProtectedRoute roles={[ROLES.STUDENT]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/discover" element={<StudentDiscover />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/wallet" element={<StudentWallet />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/notifications" element={<Notifications />} />
          <Route path="/student/my-queries" element={<MyQueriesPage />} />
          <Route path="/student/bookings" element={<StudentBookings />} />
          <Route path="/classroom/:classroomId" element={<StudentClassroomDetails />} />
          <Route path="/student/settings" element={<StudentSettings />} />
          <Route path="/student/favourites" element={<StudentFavourites />} />
          <Route path="/student/tests" element={<StudentTests />} />
          <Route path="/student/tests/:testId" element={<StudentTestTaking />} />
          <Route path="/student/tests/:testId/results" element={<StudentTestResults />} />
        </Route>
      </Route>

      {/* Teacher */}
      <Route element={<ProtectedRoute roles={[ROLES.TEACHER]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/classrooms" element={<TeacherClassrooms />} />
          <Route path="/teacher/classrooms/:id" element={<TeacherClassroomDetails />} />
          <Route path="/teacher/wallet" element={<TeacherWallet />} />
          <Route path="/teacher/kyc" element={<TeacherKYC />} />
          <Route path="/teacher/notifications" element={<Notifications />} />
          <Route path="/teacher/settings" element={<TeacherSettings />} />
          <Route path="/teacher/queries" element={<TeacherQueriesPage />} />
          <Route path="/teacher/doubts" element={<TeacherDoubtsPage />} />
          <Route path="/teacher/reports" element={<TeacherReports />} />
          <Route path="/teacher/reviews" element={<TeacherReviews />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/payouts" element={<AdminPayouts />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
