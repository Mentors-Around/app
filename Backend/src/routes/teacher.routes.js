// src/routes/teacher.routes.js
import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { requireTeacher, requireTeacherPending } from '../middlewares/teacher.middleware.js';
import { handleKYCUpload } from '../middlewares/upload.middleware.js';
import { uploadLimiter } from '../middlewares/rateLimit.middleware.js';
import {
  submitProfile, uploadKYC, getDashboard, getEarnings,
  getMyQueries, getPublicProfile, getMyClassrooms,
  getMyDoubts, updateAvailability,
  getTeacherWallet, initiateTeacherDeposit, verifyTeacherDeposit,
} from '../controllers/teacher.controller.js';
import { paymentLimiter }       from '../middlewares/rateLimit.middleware.js';
import { requireIdempotencyKey } from '../middlewares/idempotency.middleware.js';

const router = Router();

// ── Onboarding (teacher account pending KYC) ──────────────────────────────────
router.post('/onboarding/profile', authenticate, requireTeacherPending, submitProfile);
router.post('/onboarding/kyc',     authenticate, requireTeacherPending, uploadLimiter, ...handleKYCUpload, uploadKYC);

// ── Approved teacher routes ───────────────────────────────────────────────────
router.get('/me/dashboard',    authenticate, requireTeacher, getDashboard);
router.get('/me/earnings',     authenticate, requireTeacher, getEarnings);
router.get('/me/classrooms',   authenticate, requireTeacher, getMyClassrooms);
router.get('/me/queries',      authenticate, requireTeacher, getMyQueries);
router.get('/me/doubts',       authenticate, requireTeacher, getMyDoubts);
router.patch('/me/availability', authenticate, requireTeacher, updateAvailability);

// ── Public profile (no auth required) ────────────────────────────────────────
router.get('/:teacherId/public', optionalAuthenticate, getPublicProfile);

// ── Teacher wallet — balance, deposit (Razorpay), earnings ───────────────────
router.get('/me/wallet',                authenticate, requireTeacher, getTeacherWallet);
router.post('/me/wallet/deposit',        authenticate, requireTeacher, paymentLimiter, requireIdempotencyKey, initiateTeacherDeposit);
router.post('/me/wallet/deposit/verify', authenticate, requireTeacher, paymentLimiter, verifyTeacherDeposit);

export default router;