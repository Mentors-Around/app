import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsent from './components/CookieConsent';
import Navbar from './components/landing/Navbar';
import Footer from './components/landing/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PageTransition from './components/PageTransition';
import StudentDashboard from './pages/StudentDashboard';
import StudentDiscover from './pages/StudentDiscover';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherKYC from './pages/TeacherKYC';
import AdminVerify from './pages/AdminVerify';
import DashboardLayout from './layouts/DashboardLayout';

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
import DirectQueriesPage from './pages/DirectQueriesPage';
import MyQueriesPage from './pages/MyQueriesPage';
import SubjectLandingPage from './pages/SubjectLandingPage';
import StudentClassroomDetails from './pages/StudentClassroomDetails';

// New Profile Pages
import StudentProfile from './pages/StudentProfile';
import StudentBookings from './pages/StudentBookings';
import StudentFavourites from './pages/StudentFavourites';
import StudentPayments from './pages/StudentPayments';
import StudentSettings from './pages/StudentSettings';
import StudentRooms from './pages/StudentRooms';
import ClassroomLobby from './pages/ClassroomLobby';
import StudentTests from './pages/StudentTests';
import StudentTestTaking from './pages/StudentTestTaking';
import StudentTestResults from './pages/StudentTestResults';
import TeacherProfile from './pages/TeacherProfile';
import TeacherStudents from './pages/TeacherStudents';
import TeacherEarnings from './pages/TeacherEarnings';
import TeacherReviews from './pages/TeacherReviews';
import TeacherSettings from './pages/TeacherSettings';
import TeacherClassrooms from './pages/TeacherClassrooms';
import TeacherClassroomDetails from './pages/TeacherClassroomDetails';
import TeacherQueriesPage from './pages/TeacherQueriesPage';
import TeacherDoubtsPage from './pages/TeacherDoubtsPage';
import TeacherReports from './pages/TeacherReports';
import PublicTeacherProfile from './pages/PublicTeacherProfile';

const App = () => {
  const location = useLocation();

  return (
    <ErrorBoundary>
        <Routes>
          {/* Public Routes with Navbar/Footer */}
          <Route element={
          <div className="flex flex-col min-h-screen">
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
          <Route path="/community" element={<Community />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Legal />} />
          <Route path="/terms" element={<Legal />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/teacher/become" element={<TeacherBecome />} />
          <Route path="/teacher/:teacherId" element={<PublicTeacherProfile />} />
          <Route path="/tutor/:id" element={<PublicTeacherProfile />} />
          <Route path="/classroom/:classroomId" element={<StudentClassroomDetails />} />
          <Route path="/coaching-centers" element={<CoachingCenters />} />
          <Route path="/how-payments-work" element={<HowPaymentsWork />} />
          <Route path="/lessons/:subject" element={<SubjectLandingPage />} />
          <Route path="/lessons/:subject/:city/:teacherSlug" element={<PublicTeacherProfile />} />
        </Route>

        {/* Auth & Form Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/teacher/kyc" element={<TeacherKYC />} />
        <Route path="/teacher/apply" element={<TeacherApply />} />

        {/* Student Routes */}
        <Route path="/student" element={<DashboardLayout role="student" />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="discover" element={<StudentDiscover />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="bookings" element={<StudentBookings />} />
          <Route path="favourites" element={<StudentFavourites />} />
          <Route path="payments" element={<StudentPayments />} />
          <Route path="settings" element={<StudentSettings />} />
          <Route path="rooms" element={<StudentRooms />} />
          <Route path="lobby/:id" element={<ClassroomLobby />} />
          <Route path="tests" element={<StudentTests />} />
          <Route path="tests/:testId" element={<StudentTestTaking />} />
          <Route path="tests/:testId/results" element={<StudentTestResults />} />
          <Route path="direct-queries" element={<DirectQueriesPage />} />
          <Route path="my-queries" element={<MyQueriesPage />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<DashboardLayout role="teacher" />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="earnings" element={<TeacherEarnings />} />
          <Route path="queries" element={<TeacherQueriesPage />} />
          <Route path="doubts" element={<TeacherDoubtsPage />} />
          <Route path="reports" element={<TeacherReports />} />
          <Route path="reviews" element={<TeacherReviews />} />
          <Route path="settings" element={<TeacherSettings />} />
          <Route path="classrooms" element={<TeacherClassrooms />} />
          <Route path="classrooms/:id" element={<TeacherClassroomDetails />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route path="verify" element={<AdminVerify />} />
        </Route>

        {/* 404 Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Cookie Consent — appears on all pages */}
      <CookieConsent />
    </ErrorBoundary>
  );
};

export default App;
