// src/routes/admin.routes.js
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin }  from '../middlewares/admin.middleware.js';
import {
  getPendingTeachers, approveTeacher, rejectTeacher, getAllTeachers, suspendTeacher,
  getPendingDocuments, approveDocument, rejectDocument,
  getPendingExtraClasses, approveExtraClass, rejectExtraClass,
  getOpenReports, resolveReport, dismissReport, getClassroomRiskSummary,
  approveManualRefund,
  getAllClassrooms, cancelClassroom,
  getAllUsers, banUser, unbanUser,
  getAllReviews, hideReview,
  getPlatformStats, getTopTeachers, getReportsDashboard,
  getSystemSettings, updateSystemSettings,
} from '../controllers/admin.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

// ── Teachers ──────────────────────────────────────────────────────────────────
router.get('/teachers',                       getAllTeachers);
router.get('/teachers/pending',               getPendingTeachers);
router.patch('/teachers/:teacherId/approve',  approveTeacher);
router.patch('/teachers/:teacherId/reject',   rejectTeacher);
router.patch('/teachers/:teacherId/suspend',  suspendTeacher);

// ── Documents ─────────────────────────────────────────────────────────────────
router.get('/documents/pending',        getPendingDocuments);
router.patch('/documents/:id/approve',  approveDocument);
router.patch('/documents/:id/reject',   rejectDocument);

// ── Extra Classes ─────────────────────────────────────────────────────────────
router.get('/extra-classes/pending',        getPendingExtraClasses);
router.patch('/extra-classes/:id/approve',  approveExtraClass);
router.patch('/extra-classes/:id/reject',   rejectExtraClass);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports',                    getOpenReports);
router.get('/reports/risk-summary',       getClassroomRiskSummary);
router.patch('/reports/:id/resolve',      resolveReport);
router.patch('/reports/:id/dismiss',      dismissReport);

// ── Refunds ───────────────────────────────────────────────────────────────────
router.patch('/refunds/:id/approve', approveManualRefund);

// ── Classrooms ────────────────────────────────────────────────────────────────
router.get('/classrooms',                          getAllClassrooms);
router.patch('/classrooms/:classroomId/cancel',    cancelClassroom);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users',                    getAllUsers);
router.patch('/users/:userId/ban',      banUser);
router.patch('/users/:userId/unban',    unbanUser);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.get('/reviews',                  getAllReviews);
router.patch('/reviews/:reviewId/hide', hideReview);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', getPlatformStats);

// ── Top Teachers ──────────────────────────────────────────────────────────────
router.get('/top-teachers', getTopTeachers);

// ── Reports Dashboard ─────────────────────────────────────────────────────────
router.get('/reports/dashboard', getReportsDashboard);

// ── System Settings ───────────────────────────────────────────────────────────
router.get('/settings',   getSystemSettings);
router.patch('/settings', updateSystemSettings);

export default router;