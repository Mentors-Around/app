// src/controllers/poll.controller.js
import { Poll, Enrollment, Classroom } from '../models/index.js';
import { EmailService }        from '../services/email.service.js';
import { asyncHandler }        from '../utils/AsyncHandler.js';
import ApiError                from '../utils/ApiError.js';
import ApiResponse             from '../utils/ApiResponse.js';
import { POLL_TYPE, POLL_STATUS, ENROLLMENT_STATUS, CLASSROOM_STATUS } from '../constants/enums.js';
import logger                  from '../config/logger.config.js';

// ── POST /classrooms/:classroomId/polls ───────────────────────────────────────
export const createPoll = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { question, options, expiresInHours = 24 } = req.body;

  if (!question?.trim())          throw ApiError.badRequest('question is required');
  if (!Array.isArray(options) || options.length < 2) {
    throw ApiError.badRequest('At least 2 options are required');
  }

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');
  if (classroom.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the classroom teacher can create polls');
  }
  if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
    throw ApiError.badRequest('Can only create polls in active classrooms');
  }

  const expiresAt = new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000);

  const poll = await Poll.create({
    classroomId,
    teacherId:  req.user._id,
    type:       POLL_TYPE.GENERAL,
    question:   question.trim(),
    options:    options.map((o) => ({ text: typeof o === 'string' ? o.trim() : o.text?.trim() })),
    expiresAt,
    status:     POLL_STATUS.ACTIVE,
  });

  logger.info('Poll created', { classroomId, pollId: poll._id });

  // Non-blocking: email enrolled students about the new poll
  const { User } = await import('../models/index.js');
  Enrollment.find({ classroomId, status: ENROLLMENT_STATUS.ACTIVE })
    .select('studentId').lean()
    .then(async (enrollments) => {
      const students = await User.find({
        _id: { $in: enrollments.map((e) => e.studentId) },
      }).select('email name').lean();
      students.forEach((student) => {
        if (student.email) {
          EmailService.sendClassroomNotification(student.email, {
            studentName:    student.name || 'Student',
            classroomTitle: classroom.title,
            eventType:      'poll',
            eventTitle:     question.trim(),
            eventBody:      `This poll closes in ${expiresInHours} hour(s). Log in to cast your vote.`,
          });
        }
      });
    }).catch(() => {});

  res.status(201).json(new ApiResponse(201, poll, 'Poll created'));
});

// ── GET /classrooms/:classroomId/polls ────────────────────────────────────────
export const getClassroomPolls = asyncHandler(async (req, res) => {
  const { classroomId }   = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  const isTeacher = req.user?.role === 'teacher' && classroom.teacherId.toString() === req.user._id.toString();

  if (!isTeacher) {
    const enrolled = await Enrollment.findOne({ studentId: req.user._id, classroomId, status: ENROLLMENT_STATUS.ACTIVE }).lean();
    if (!enrolled) throw ApiError.forbidden('You must be enrolled to view polls');
  }

  const filter = { classroomId };
  if (status) filter.status = status;
  else filter.type = POLL_TYPE.GENERAL; // Students don't see early-end polls directly

  const result = await Poll.paginate(filter, {
    page: Number(page), limit: Math.min(Number(limit), 20),
    sort: { createdAt: -1 },
  });

  res.status(200).json(new ApiResponse(200, result, 'Polls'));
});

// ── POST /classrooms/:classroomId/polls/:pollId/vote ──────────────────────────
export const votePoll = asyncHandler(async (req, res) => {
  const { classroomId, pollId } = req.params;
  const { optionIndex }         = req.body;

  if (optionIndex === undefined || optionIndex === null) {
    throw ApiError.badRequest('optionIndex is required');
  }

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  const enrolled = await Enrollment.findOne({ studentId: req.user._id, classroomId, status: ENROLLMENT_STATUS.ACTIVE }).lean();
  if (!enrolled) throw ApiError.forbidden('You must be enrolled to vote in polls');

  const poll = await Poll.findOne({ _id: pollId, classroomId });
  if (!poll) throw ApiError.notFound('Poll');
  if (poll.status !== POLL_STATUS.ACTIVE) throw ApiError.badRequest('Poll is not active');
  if (poll.expiresAt < new Date()) {
    await Poll.findByIdAndUpdate(pollId, { status: POLL_STATUS.EXPIRED });
    throw ApiError.badRequest('Poll has expired');
  }
  if (Number(optionIndex) < 0 || Number(optionIndex) >= poll.options.length) {
    throw ApiError.badRequest('Invalid option index');
  }

  // Check if already voted
  const alreadyVoted = poll.votes?.some((v) => v.userId.toString() === req.user._id.toString());
  if (alreadyVoted) throw new ApiError(409, 'You have already voted in this poll', [], 'ALREADY_VOTED');

  await Poll.findByIdAndUpdate(pollId, {
    $push: { votes: { userId: req.user._id, optionIndex: Number(optionIndex), votedAt: new Date() } },
    $inc:  { [`options.${optionIndex}.count`]: 1 },
  });

  res.status(200).json(new ApiResponse(200, null, 'Vote recorded'));
});

// ── GET /classrooms/:classroomId/polls/:pollId ────────────────────────────────
export const getPollDetail = asyncHandler(async (req, res) => {
  const { classroomId, pollId } = req.params;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  const isTeacher = req.user?.role === 'teacher' && classroom.teacherId.toString() === req.user._id.toString();
  if (!isTeacher) {
    const enrolled = await Enrollment.findOne({ studentId: req.user._id, classroomId, status: ENROLLMENT_STATUS.ACTIVE }).lean();
    if (!enrolled) throw ApiError.forbidden('Not enrolled');
  }

  const poll = await Poll.findOne({ _id: pollId, classroomId }).lean();
  if (!poll) throw ApiError.notFound('Poll');

  // Hide voter identities from students
  if (!isTeacher) {
    delete poll.votes;
  }

  res.status(200).json(new ApiResponse(200, poll, 'Poll detail'));
});

// ── PATCH /classrooms/:classroomId/polls/:pollId/close ───────────────────────
export const closePoll = asyncHandler(async (req, res) => {
  const { classroomId, pollId } = req.params;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');
  if (classroom.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the classroom teacher can close polls');
  }

  const poll = await Poll.findOne({ _id: pollId, classroomId });
  if (!poll) throw ApiError.notFound('Poll');
  if (poll.status === POLL_STATUS.CLOSED) throw ApiError.badRequest('Poll is already closed');

  await poll.close?.() || Poll.findByIdAndUpdate(pollId, { status: POLL_STATUS.CLOSED });

  res.status(200).json(new ApiResponse(200, null, 'Poll closed'));
});