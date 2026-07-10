// src/routes/test.routes.js
import { Router } from 'express';
import { authenticate }   from '../middlewares/auth.middleware.js';
import { requireTeacher } from '../middlewares/teacher.middleware.js';
import { requireStudent } from '../middlewares/student.middleware.js';
import { requireParentalConsentIfMinor } from '../middlewares/minorConsent.middleware.js';
import {
  publishTest, getStudentTests,
  startTestAttempt, submitTestAttempt, getTestResults,
} from '../controllers/test.controller.js';

const router = Router();
router.use(authenticate);

// ── Teacher ────────────────────────────────────────────────────────────────────
router.patch('/:testId/publish', requireTeacher, publishTest);

// ── Student ────────────────────────────────────────────────────────────────────
router.get('/me',                    requireStudent, getStudentTests);
router.post('/:testId/start',        requireStudent, requireParentalConsentIfMinor, startTestAttempt);
router.post('/:testId/submit',       requireStudent, submitTestAttempt);
router.get('/:testId/results',       requireStudent, getTestResults);

export default router;
