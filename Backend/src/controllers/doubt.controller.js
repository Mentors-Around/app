// src/controllers/doubt.controller.js
import mongoose from 'mongoose';
import { Doubt, Enrollment, Classroom } from '../models/index.js';
import { CloudinaryService }  from '../services/cloudinary.service.js';
import { NotificationService } from '../services/notification.service.js';
import { asyncHandler }       from '../utils/AsyncHandler.js';
import ApiError               from '../utils/ApiError.js';
import ApiResponse            from '../utils/ApiResponse.js';
import { DOUBT_VISIBILITY, DOUBT_STATUS, ENROLLMENT_STATUS } from '../constants/enums.js';
import { blockAllPII }        from '../utils/pil.util.js';
import logger                 from '../config/logger.config.js';

// ── Shared: verify student is actively enrolled ───────────────────────────────
const assertEnrolled = async (studentId, classroomId) => {
  const enrollment = await Enrollment.findOne({
    studentId, classroomId, status: ENROLLMENT_STATUS.ACTIVE,
  }).lean();
  if (!enrollment) throw ApiError.forbidden('You are not enrolled in this classroom');
  return enrollment;
};

// ── POST /classrooms/:classroomId/doubts ──────────────────────────────────────
export const createDoubt = asyncHandler(async (req, res) => {
  const { classroomId }              = req.params;
  const { topic, question, visibility = DOUBT_VISIBILITY.PUBLIC } = req.body;

  if (!question?.trim()) throw ApiError.badRequest('question is required');
  if (!Object.values(DOUBT_VISIBILITY).includes(visibility)) {
    throw ApiError.badRequest('visibility must be public or private');
  }

  // PII guard
  blockAllPII({ topic, question });

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  await assertEnrolled(req.user._id, classroomId);

  const doubt = await Doubt.create({
    studentId:   req.user._id,
    classroomId,
    teacherId:   classroom.teacherId,
    topic:       topic?.trim() || '',
    question:    question.trim(),
    visibility,
  });

  logger.info('Doubt created', { doubtId: doubt._id, studentId: req.user._id, classroomId });
  res.status(201).json(new ApiResponse(201, doubt, 'Doubt posted'));
});

// ── GET /classrooms/:classroomId/doubts ───────────────────────────────────────
export const getClassroomDoubts = asyncHandler(async (req, res) => {
  const { classroomId }   = req.params;
  const { page = 1, limit = 20, status } = req.query;

  const isTeacher = req.user?.role === 'teacher';
  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  let filter = { classroomId };

  if (isTeacher && classroom.teacherId.toString() === req.user._id.toString()) {
    // Teacher sees all doubts in their classroom
    if (status) filter.status = status;
  } else {
    // Students see only public doubts; must be enrolled
    await assertEnrolled(req.user._id, classroomId);
    filter.visibility = DOUBT_VISIBILITY.PUBLIC;
    if (status) filter.status = status;
  }

  const result = await Doubt.paginate(filter, {
    page: Number(page), limit: Math.min(Number(limit), 50),
    sort: { upvotes: -1, createdAt: -1 },
    populate: { path: 'studentId', select: 'name avatarUrl' },
  });

  res.status(200).json(new ApiResponse(200, result, 'Doubts fetched'));
});

// ── PATCH /classrooms/:classroomId/doubts/:doubtId/answer ─────────────────────
export const answerDoubt = asyncHandler(async (req, res) => {
  const { classroomId, doubtId } = req.params;
  const { text, attachmentUrls = [] } = req.body;

  if (!text?.trim()) throw ApiError.badRequest('Answer text is required');

  // PII guard
  blockAllPII({ answer: text });

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');
  if (classroom.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the classroom teacher can answer doubts');
  }

  const doubt = await Doubt.findOne({ _id: doubtId, classroomId });
  if (!doubt) throw ApiError.notFound('Doubt');

  await doubt.submitAnswer(req.user._id, text.trim(), attachmentUrls);

  // Non-blocking notification to student
  const { User } = await import('../models/index.js');
  User.findById(doubt.studentId).select('phone').then((student) => {
    if (student) {
      NotificationService.notifyDoubtAnswered(student, { title: classroom.title }, doubt.topic).catch(() => {});
    }
  });

  res.status(200).json(new ApiResponse(200, doubt, 'Doubt answered'));
});

// ── POST /classrooms/:classroomId/doubts/:doubtId/upvote ──────────────────────
export const upvoteDoubt = asyncHandler(async (req, res) => {
  const { classroomId, doubtId } = req.params;

  await assertEnrolled(req.user._id, classroomId);

  const doubt = await Doubt.findOne({ _id: doubtId, classroomId, visibility: DOUBT_VISIBILITY.PUBLIC });
  if (!doubt) throw ApiError.notFound('Doubt');

  try {
    await doubt.upvote(req.user._id);
  } catch (err) {
    throw new ApiError(409, err.message, [], 'ALREADY_UPVOTED');
  }

  res.status(200).json(new ApiResponse(200, { upvotes: doubt.upvotes }, 'Upvoted'));
});

// ── PATCH /classrooms/:classroomId/doubts/:doubtId/close ──────────────────────
export const closeDoubt = asyncHandler(async (req, res) => {
  const { classroomId, doubtId } = req.params;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  const doubt = await Doubt.findOne({ _id: doubtId, classroomId });
  if (!doubt) throw ApiError.notFound('Doubt');

  const isTeacher = classroom.teacherId.toString() === req.user._id.toString();
  const isOwner   = doubt.studentId.toString() === req.user._id.toString();
  if (!isTeacher && !isOwner) throw ApiError.forbidden('Not authorized to close this doubt');

  await doubt.close();
  res.status(200).json(new ApiResponse(200, null, 'Doubt closed'));
});

// ── GET /classrooms/:classroomId/doubts/:doubtId ─────────────────────────────
export const getDoubtDetail = asyncHandler(async (req, res) => {
  const { classroomId, doubtId } = req.params;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  const isTeacher = req.user?.role === 'teacher' && classroom.teacherId.toString() === req.user._id.toString();

  if (!isTeacher) {
    await assertEnrolled(req.user._id, classroomId);
  }

  const doubt = await Doubt.findOne({ _id: doubtId, classroomId })
    .populate('studentId', 'name avatarUrl')
    .lean({ virtuals: true });

  if (!doubt) throw ApiError.notFound('Doubt');

  // Hide private doubts from non-owners and non-teachers
  if (doubt.visibility === DOUBT_VISIBILITY.PRIVATE && !isTeacher && doubt.studentId._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('This doubt is private');
  }

  res.status(200).json(new ApiResponse(200, doubt, 'Doubt detail'));
});