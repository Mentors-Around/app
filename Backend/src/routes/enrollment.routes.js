// src/routes/enrollment.routes.js
import { Router } from 'express';
import { authenticate }                from '../middlewares/auth.middleware.js';
import { requireStudent }             from '../middlewares/student.middleware.js';
import { requireTeacher }             from '../middlewares/teacher.middleware.js';
import { requireParentalConsentIfMinor } from '../middlewares/minorConsent.middleware.js';
import { requireIdempotencyKey }      from '../middlewares/idempotency.middleware.js';
import { paymentLimiter }             from '../middlewares/rateLimit.middleware.js';
import {
  sendQuery, acceptQuery, rejectQuery,
  enrollInClassroom, verifyEnrollmentPayment,
  getStudentEnrollments, getMyQueries, submitReview, getStudentDashboard,
  withdrawQuery, sendQueryMessage, archiveQuery,
} from '../controllers/enrollment.controller.js';

const router = Router();
router.use(authenticate);

// ── Student: send enrollment query (costs 1 token) ────────────────────────────
router.post(
  '/queries',
  requireStudent, requireParentalConsentIfMinor, requireIdempotencyKey,
  sendQuery,
);

// ── Teacher: accept / reject query (with optional teacherMessage) ─────────────
router.patch('/queries/:queryId/accept', requireTeacher, acceptQuery);
router.patch('/queries/:queryId/reject', requireTeacher, rejectQuery);

// ── Messages/Chat under the query ──────────────────────────────────────────────
router.post('/queries/:queryId/messages', sendQueryMessage);

// ── Archiving (works for student or teacher) ───────────────────────────────────
router.patch('/queries/:queryId/archive', archiveQuery);

// ── Student: pay and enroll ───────────────────────────────────────────────────
router.post(
  '/queries/:queryId/enroll',
  requireStudent, requireParentalConsentIfMinor, requireIdempotencyKey, paymentLimiter,
  enrollInClassroom,
);
router.post(
  '/queries/:queryId/enroll/verify',
  requireStudent, paymentLimiter,
  verifyEnrollmentPayment,
);

// ── Query history — works for BOTH student and teacher (tab-based filtering) ──
// Student tabs: active | accepted | enrolled | rejected | expired
// Teacher tabs: active | accepted | enrolled | rejected | expired | refunded
router.get('/queries', getMyQueries);

// ── Student: withdraw a pending query (refunds 1 token) ───────────────────────
router.delete('/queries/:queryId', requireStudent, withdrawQuery);

// ── Student: enrolled classrooms dashboard (active | completed) ───────────────
router.get('/me/dashboard', requireStudent, getStudentDashboard);
router.get('/', requireStudent, getStudentEnrollments);

// ── Student: review a completed classroom ────────────────────────────────────
router.post('/:enrollmentId/review', requireStudent, submitReview);

export default router;