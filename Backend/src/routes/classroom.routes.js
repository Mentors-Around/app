// src/routes/classroom.routes.js
import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { requireTeacher }    from '../middlewares/teacher.middleware.js';
import { requireStudent }    from '../middlewares/student.middleware.js';
import { checkOwnership }    from '../middlewares/ownership.middleware.js';
import { requireParentalConsentIfMinor } from '../middlewares/minorConsent.middleware.js';
import {
  handleClassroomMediaUpload,
  handleMaterialUpload,
} from '../middlewares/upload.middleware.js';
import { searchLimiter, uploadLimiter } from '../middlewares/rateLimit.middleware.js';
import { Classroom } from '../models/index.js';

import {
  createClassroom, updateClassroom, searchClassrooms,
  getClassroomDetail, requestEarlyEnd, uploadClassroomMedia,
  voteEarlyEnd, getEnrolledStudents, discoverClassrooms, reportFromClassroom,
  joinClass,
} from '../controllers/classroom.controller.js';

import {
  createDoubt, getClassroomDoubts, answerDoubt,
  upvoteDoubt, closeDoubt, getDoubtDetail,
} from '../controllers/doubt.controller.js';

import {
  uploadMaterial, getClassroomMaterials, deleteMaterial,
} from '../controllers/material.controller.js';

import {
  createAnnouncement, getAnnouncements, deleteAnnouncement,
} from '../controllers/announcement.controller.js';

import {
  createAssignment, getAssignments, getAssignmentDetail,
  submitAssignment, gradeSubmission, updateAssignment,
} from '../controllers/assignment.controller.js';

import {
  createPoll, getClassroomPolls, votePoll, getPollDetail, closePoll,
} from '../controllers/poll.controller.js';

import {
  requestExtraClass, getExtraClasses,
} from '../controllers/extraClass.controller.js';

import {
  createTest, listClassroomTests,
} from '../controllers/test.controller.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// CLASSROOM CORE
// ─────────────────────────────────────────────────────────────────────────────

router.get('/search', searchLimiter, optionalAuthenticate, searchClassrooms);

// NOTE: literal-path routes (/search, /discover) MUST be registered before the
// '/:classroomId' param route below, otherwise Express matches them as an ID.
router.get('/discover', optionalAuthenticate, discoverClassrooms);

router.get('/:classroomId', optionalAuthenticate, getClassroomDetail);
router.post('/', authenticate, requireTeacher, createClassroom);

router.patch(
  '/:classroomId',
  authenticate, requireTeacher,
  checkOwnership({ model: Classroom, paramKey: 'classroomId', ownerField: 'teacherId', resourceName: 'Classroom' }),
  updateClassroom,
);

router.post(
  '/:classroomId/early-end',
  authenticate, requireTeacher,
  checkOwnership({ model: Classroom, paramKey: 'classroomId', ownerField: 'teacherId', resourceName: 'Classroom' }),
  requestEarlyEnd,
);

router.post(
  '/:classroomId/media',
  authenticate, requireTeacher, uploadLimiter,
  checkOwnership({ model: Classroom, paramKey: 'classroomId', ownerField: 'teacherId', resourceName: 'Classroom' }),
  ...handleClassroomMediaUpload,
  uploadClassroomMedia,
);

router.post(
  '/:classroomId/vote-early-end',
  authenticate, requireStudent, requireParentalConsentIfMinor,
  voteEarlyEnd,
);

router.get(
  '/:classroomId/students',
  authenticate, requireTeacher,
  checkOwnership({ model: Classroom, paramKey: 'classroomId', ownerField: 'teacherId', resourceName: 'Classroom' }),
  getEnrolledStudents,
);

// ─────────────────────────────────────────────────────────────────────────────
// DOUBTS
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:classroomId/doubts', authenticate, requireStudent, requireParentalConsentIfMinor, createDoubt);
router.get('/:classroomId/doubts',  authenticate, getClassroomDoubts);
router.get('/:classroomId/doubts/:doubtId', authenticate, getDoubtDetail);
router.patch('/:classroomId/doubts/:doubtId/answer', authenticate, requireTeacher, answerDoubt);
router.post('/:classroomId/doubts/:doubtId/upvote',  authenticate, requireStudent, upvoteDoubt);
router.patch('/:classroomId/doubts/:doubtId/close',  authenticate, closeDoubt);

// ─────────────────────────────────────────────────────────────────────────────
// MATERIALS
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/:classroomId/materials',
  authenticate, requireTeacher, uploadLimiter,
  ...handleMaterialUpload,
  uploadMaterial,
);
router.get('/:classroomId/materials', authenticate, getClassroomMaterials);
router.delete('/:classroomId/materials/:materialId', authenticate, requireTeacher, deleteMaterial);

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:classroomId/announcements', authenticate, requireTeacher, createAnnouncement);
router.get('/:classroomId/announcements',  authenticate, getAnnouncements);
router.delete('/:classroomId/announcements/:announcementId', authenticate, requireTeacher, deleteAnnouncement);

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:classroomId/assignments', authenticate, requireTeacher, createAssignment);
router.patch('/:classroomId/assignments/:assignmentId', authenticate, requireTeacher, updateAssignment);
router.get('/:classroomId/assignments',  authenticate, getAssignments);
router.get('/:classroomId/assignments/:assignmentId', authenticate, getAssignmentDetail);

// FIX: handleMaterialUpload (multer.array → req.files) instead of handleSinglePdfUpload
// (multer.single → req.file). assignment.controller.js reads req.files (plural), so
// using single() silently drops every submitted file. handleMaterialUpload corrects this.
router.post(
  '/:classroomId/assignments/:assignmentId/submit',
  authenticate, requireStudent, requireParentalConsentIfMinor, uploadLimiter,
  ...handleMaterialUpload,
  submitAssignment,
);

router.patch('/:classroomId/assignments/:assignmentId/grade', authenticate, requireTeacher, gradeSubmission);

// ─────────────────────────────────────────────────────────────────────────────
// POLLS
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:classroomId/polls', authenticate, requireTeacher, createPoll);
router.get('/:classroomId/polls',  authenticate, getClassroomPolls);
router.get('/:classroomId/polls/:pollId', authenticate, getPollDetail);
router.post('/:classroomId/polls/:pollId/vote',   authenticate, requireStudent, votePoll);
router.patch('/:classroomId/polls/:pollId/close', authenticate, requireTeacher, closePoll);

// ─────────────────────────────────────────────────────────────────────────────
// EXTRA CLASSES
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:classroomId/extra-classes', authenticate, requireTeacher, requestExtraClass);
router.get('/:classroomId/extra-classes',  authenticate, getExtraClasses);

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY SUBJECT TESTS (teacher-authored, classroom-scoped)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:classroomId/tests', authenticate, requireTeacher, createTest);
router.get('/:classroomId/tests',  authenticate, requireTeacher, listClassroomTests);

// ── Report from classroom (enrolled student → report teacher; teacher → report student) ──
router.post('/:classroomId/report', authenticate, reportFromClassroom);

// ── Student joins a live class session (marks attendance) ─────────────────────
router.post('/:classroomId/join', authenticate, requireStudent, joinClass);

export default router;