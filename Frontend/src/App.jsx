import React, { useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { registerLoadingCallbacks } from './services/api';
import LoadingOverlay from './components/shared/LoadingOverlay';
import CookieConsent from './components/CookieConsent';
import Navbar from './components/landing/Navbar';
import Footer from './components/landing/Footer';
import LandingPage from './pages/LandingPage';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminLogin from './pages/auth/AdminLogin';
import PageTransition from './components/PageTransition';
import StudentDashboard from './pages/StudentDashboard';
import StudentDiscover from './pages/StudentDiscover';
import StudentTutors from './pages/StudentTutors';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherKYC from './pages/TeacherKYC';
import AdminVerify from './pages/AdminVerify';
import AdminDashboard from './pages/AdminDashboard';
import AdminTeachers from './pages/AdminTeachers';
import AdminStudents from './pages/AdminStudents';
import AdminKYC from './pages/AdminKYC';
import AdminReports from './pages/AdminReports';
import AdminWallet from './pages/AdminWallet';
import AdminReviews from './pages/AdminReviews';
import AdminClassrooms from './pages/AdminClassrooms';
import AdminSupport from './pages/AdminSupport';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import DashboardLayout from './layouts/DashboardLayout';
import { OverlayProvider } from './contexts/OverlayContext';

// New Public Pages
import Safety from './pages/Safety';
import AboutUs from './pages/AboutUs';
import TeacherEarningsInfo from './pages/TeacherEarningsInfo';
import TeacherVerification from './pages/TeacherVerification';
import Community from './pages/Community';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import RefundPolicy from './pages/RefundPolicy';
import TeacherBecome from './pages/TeacherBecome';
import TeacherApply from './pages/TeacherApply';
import NotFound from './pages/NotFound';
import CoachingCenters from './pages/CoachingCenters';
import HowPaymentsWork from './pages/HowPaymentsWork';
import MyQueriesPage from './pages/MyQueriesPage';
import SubjectLandingPage from './pages/SubjectLandingPage';
import StudentClassroomDetails from './pages/StudentClassroomDetails';

// New Profile Pages
import StudentProfile from './pages/StudentProfile';
import StudentBookings from './pages/StudentBookings';
import StudentFavourites from './pages/StudentFavourites';
import StudentSettings from './pages/StudentSettings';
import StudentRooms from './pages/StudentRooms';
import ClassroomLobby from './pages/ClassroomLobby';
import StudentTests from './pages/StudentTests';
import StudentTestTaking from './pages/StudentTestTaking';
import StudentTestResults from './pages/StudentTestResults';
import TeacherProfile from './pages/TeacherProfile';
import TeacherStudents from './pages/TeacherStudents';
import TeacherReviews from './pages/TeacherReviews';
import TeacherSettings from './pages/TeacherSettings';
import TeacherClassrooms from './pages/TeacherClassrooms';
import TeacherClassroomDetails from './pages/TeacherClassroomDetails';
import TeacherClassroomStudents from './pages/TeacherClassroomStudents';
import TeacherQueriesPage from './pages/TeacherQueriesPage';
import TeacherDoubtsPage from './pages/TeacherDoubtsPage';
import TeacherReports from './pages/TeacherReports';
import PublicTeacherProfile from './pages/PublicTeacherProfile';
import PublicStudentProfile from './pages/PublicStudentProfile';
import Notifications from './pages/Notifications';
import StudentWallet from './pages/StudentWallet';
import TeacherWallet from './pages/TeacherWallet';

import { WalletProvider } from './contexts/WalletContext';

// Bridge component: connects React LoadingContext to the plain api.js module
function LoadingBridge() {
  const { startLoading, stopLoading } = useLoading();
  useEffect(() => {
    registerLoadingCallbacks(startLoading, stopLoading);
  }, [startLoading, stopLoading]);
  return null;
}

const App = () => {
  const location = useLocation();

  useEffect(() => {
    if (!localStorage.getItem('trueed_reviews')) {
      localStorage.setItem('trueed_reviews', JSON.stringify([]));
    }
  }, []);

  return (
    <ErrorBoundary>
      <LoadingProvider>
        <LoadingBridge />
        <LoadingOverlay />
        <WalletProvider>
          <OverlayProvider>
          <Routes>
            {/* Public Routes with Navbar/Footer */}
          <Route element={
          <div className="flex flex-col min-h-screen bg-page">
            <Navbar />
            <main className="flex-1 pt-16">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </main>
            <Footer />
          </div>
        }>
          <Route path="/" element={<LandingPage />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/teacher/earnings-info" element={<TeacherEarningsInfo />} />
          <Route path="/teacher/verification" element={<TeacherVerification />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Legal />} />
          <Route path="/privacy-policy" element={<Legal />} />
          <Route path="/terms" element={<Legal />} />
          <Route path="/terms-and-conditions" element={<Legal />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/refund-cancellation" element={<RefundPolicy />} />
          <Route path="/teacher/become" element={<TeacherBecome />} />
          <Route path="/teacher/:teacherId" element={<PublicTeacherProfile />} />
          <Route path="/tutor/:id" element={<PublicTeacherProfile />} />
          <Route path="/student/:studentId" element={<PublicStudentProfile />} />
          <Route path="/classroom/:classroomId" element={<StudentClassroomDetails />} />
          <Route path="/how-payments-work" element={<HowPaymentsWork />} />
          <Route path="/lessons/:subject" element={<SubjectLandingPage />} />
          <Route path="/lessons/:subject/:city/:teacherSlug" element={<PublicTeacherProfile />} />
        </Route>

        {/* Auth & Form Routes */}
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/signup" element={<AuthLayout><Signup /></AuthLayout>} />
        <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
        <Route path="/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
        <Route path="/admin/login" element={<AuthLayout><AdminLogin /></AuthLayout>} />
        <Route path="/teacher/kyc" element={<TeacherKYC />} />
        <Route path="/teacher/apply" element={<TeacherApply />} />

        {/* Student Routes */}
        <Route path="/student" element={<DashboardLayout role="student" />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="discover" element={<StudentDiscover />} />
          <Route path="tutors" element={<StudentTutors />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="bookings" element={<StudentBookings />} />
          <Route path="favourites" element={<StudentFavourites />} />
          <Route path="settings" element={<StudentSettings />} />
          <Route path="rooms" element={<StudentRooms />} />
          <Route path="lobby/:id" element={<ClassroomLobby />} />
          <Route path="tests" element={<StudentTests />} />
          <Route path="tests/:testId" element={<StudentTestTaking />} />
          <Route path="tests/:testId/results" element={<StudentTestResults />} />
          <Route path="my-queries" element={<MyQueriesPage />} />
          <Route path="wallet" element={<StudentWallet />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<DashboardLayout role="teacher" />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="queries" element={<TeacherQueriesPage />} />
          <Route path="doubts" element={<TeacherDoubtsPage />} />
          <Route path="reports" element={<TeacherReports />} />
          <Route path="reviews" element={<TeacherReviews />} />
          <Route path="settings" element={<TeacherSettings />} />
          <Route path="classrooms" element={<TeacherClassrooms />} />
          <Route path="classrooms/:id" element={<TeacherClassroomDetails />} />
          <Route path="classrooms/:id/students" element={<TeacherClassroomStudents />} />
          <Route path="wallet" element={<TeacherWallet />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route path="verify" element={<AdminVerify />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="kyc" element={<AdminKYC />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="wallet" element={<AdminWallet />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="classrooms" element={<AdminClassrooms />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
          </OverlayProvider>
        </WalletProvider>

        {/* Cookie Consent — appears on all pages */}
        <CookieConsent />
      </LoadingProvider>
    </ErrorBoundary>
  );
};

export default App;
