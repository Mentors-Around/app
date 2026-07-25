// src/routes/user.routes.js
import { Router } from 'express';
import { authenticate }       from '../middlewares/auth.middleware.js';
import { handleProfileUpload } from '../middlewares/upload.middleware.js';
import { uploadLimiter, authLimiter } from '../middlewares/rateLimit.middleware.js';
import {
  getMe, updateMe, uploadAvatar, deleteMe,
  submitParentalConsent, sendGuardianOtp,
  updateFcmToken, saveClassroom, unsaveClassroom,
  getSavedClassrooms, getPaymentHistory, changePassword,
  requestPhoneChange, confirmPhoneChange,
  requestEmailChange, confirmEmailChange,
  updateParentPhone, getSupport,
  saveTeacher, unsaveTeacher, getSavedTeachers,
  updateUsername, getDashboardStats, getSessions,
  getUserProfile
} from '../controllers/user.controller.js';

const router = Router();

// ── Help & Support (public — no auth required, needed pre-login too) ─────────
router.get('/support', getSupport);

router.use(authenticate);

// ── Profile & Dashboard ───────────────────────────────────────────────────────
router.get('/me',                  getMe);
router.patch('/me',                updateMe);
router.patch('/me/username',       updateUsername);
router.get('/me/dashboard',        getDashboardStats);
router.get('/me/sessions',         getSessions);
router.post('/me/avatar',          uploadLimiter, ...handleProfileUpload, uploadAvatar);
router.delete('/me',               deleteMe);
router.post('/me/change-password', changePassword);

// ── Phone number change (2-step OTP) ──────────────────────────────────────────
router.post('/me/phone/send-otp', authLimiter, requestPhoneChange);
router.post('/me/phone/verify',   authLimiter, confirmPhoneChange);

// ── Email address change (2-step OTP) ─────────────────────────────────────────
router.post('/me/email/send-otp', authLimiter, requestEmailChange);
router.post('/me/email/verify',   authLimiter, confirmEmailChange);

// ── Parent phone (optional — no OTP needed) ───────────────────────────────────
router.patch('/me/parent-phone', updateParentPhone);

// ── Parental consent (minor accounts — OTP by guardian) ───────────────────────
router.post('/me/parental-consent/send-otp', sendGuardianOtp);
router.post('/me/parental-consent',          submitParentalConsent);

// ── FCM push notifications ────────────────────────────────────────────────────
router.post('/me/fcm-token', updateFcmToken);

// ── Saved classrooms (students) ───────────────────────────────────────────────
router.get('/me/saved-classrooms',               getSavedClassrooms);
router.post('/me/saved-classrooms/:classroomId',   saveClassroom);
router.delete('/me/saved-classrooms/:classroomId', unsaveClassroom);

// ── Favourite teachers (students) ─────────────────────────────────────────────
router.get('/me/saved-teachers',            getSavedTeachers);
router.post('/me/saved-teachers/:teacherId',   saveTeacher);
router.delete('/me/saved-teachers/:teacherId', unsaveTeacher);

// ── Payment history ───────────────────────────────────────────────────────────
router.get('/me/payments', getPaymentHistory);

// ── Custom Profile Retrieval (Role-restricted) ─────────────────────────────────
router.get('/:userId/profile', getUserProfile);

export default router;