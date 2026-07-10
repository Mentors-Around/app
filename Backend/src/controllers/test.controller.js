// src/controllers/test.controller.js
import { Test, TestAttempt, Classroom, Enrollment } from '../models/index.js';
import { asyncHandler }  from '../utils/AsyncHandler.js';
import ApiError           from '../utils/ApiError.js';
import ApiResponse        from '../utils/ApiResponse.js';
import { TEST_STATUS, ENROLLMENT_STATUS } from '../constants/enums.js';
import logger              from '../config/logger.config.js';

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

async function assertTeacherOwnsClassroom(classroomId, teacherId) {
  const classroom = await Classroom.findById(classroomId).select('teacherId title subject').lean();
  if (!classroom) throw ApiError.notFound('Classroom');
  if (classroom.teacherId.toString() !== teacherId.toString()) {
    throw ApiError.forbidden('Only the classroom teacher can manage tests for this classroom');
  }
  return classroom;
}

async function assertStudentEnrolled(classroomId, studentId) {
  const enrollment = await Enrollment.findOne({
    classroomId, studentId, status: ENROLLMENT_STATUS.ACTIVE,
  }).lean();
  if (!enrollment) throw ApiError.forbidden('You must be actively enrolled in this classroom');
  return enrollment;
}

// ── POST /classrooms/:classroomId/tests — Teacher creates a monthly test ──────
export const createTest = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const {
    title, monthKey, questions = [], durationMinutes = 30,
    availableFrom = null, availableTo = null,
  } = req.body;

  if (!title?.trim())            throw ApiError.badRequest('title is required');
  if (!monthKey || !MONTH_KEY_REGEX.test(monthKey)) {
    throw ApiError.badRequest('monthKey is required in YYYY-MM format');
  }
  if (!Array.isArray(questions) || questions.length < 1) {
    throw ApiError.badRequest('At least one question is required');
  }
  for (const q of questions) {
    if (!q.text?.trim()) throw ApiError.badRequest('Each question requires text');
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw ApiError.badRequest('Each question requires at least 2 options');
    }
    if (
      typeof q.correctAnswerIndex !== 'number' ||
      q.correctAnswerIndex < 0 ||
      q.correctAnswerIndex >= q.options.length
    ) {
      throw ApiError.badRequest('Each question requires a valid correctAnswerIndex');
    }
  }

  const classroom = await assertTeacherOwnsClassroom(classroomId, req.user._id);

  const existing = await Test.findOne({ classroomId, monthKey }).lean();
  if (existing) throw ApiError.badRequest(`A test for ${monthKey} already exists for this classroom`);

  const test = await Test.create({
    classroomId,
    teacherId: req.user._id,
    title:     title.trim(),
    subject:   classroom.subject,
    monthKey,
    questions,
    durationMinutes: Math.min(Math.max(Number(durationMinutes) || 30, 1), 180),
    availableFrom: availableFrom ? new Date(availableFrom) : null,
    availableTo:   availableTo   ? new Date(availableTo)   : null,
    status: TEST_STATUS.DRAFT,
  });

  logger.info('Test created', { testId: test._id, classroomId });
  res.status(201).json(new ApiResponse(201, test, 'Test created'));
});

// ── PATCH /tests/:testId/publish — Teacher publishes a draft test ─────────────
export const publishTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.testId);
  if (!test) throw ApiError.notFound('Test');
  if (test.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the owning teacher can publish this test');
  }
  if (test.status !== TEST_STATUS.DRAFT) throw ApiError.badRequest('Only draft tests can be published');

  test.status = TEST_STATUS.PUBLISHED;
  await test.save();
  res.status(200).json(new ApiResponse(200, test, 'Test published'));
});

// ── GET /classrooms/:classroomId/tests — Teacher: list tests for a classroom ──
export const listClassroomTests = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  await assertTeacherOwnsClassroom(classroomId, req.user._id);

  const tests = await Test.find({ classroomId }).sort({ monthKey: -1 }).lean();
  res.status(200).json(new ApiResponse(200, tests, 'Classroom tests'));
});

// ── GET /me/tests — Student: upcoming + past tests across enrolled classrooms ─
export const getStudentTests = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const enrollments = await Enrollment.find({ studentId, status: ENROLLMENT_STATUS.ACTIVE })
    .select('classroomId').lean();
  const classroomIds = enrollments.map((e) => e.classroomId);

  if (!classroomIds.length) {
    return res.status(200).json(new ApiResponse(200, { upcoming: [], past: [] }, 'Student tests'));
  }

  const now = new Date();
  const [publishedTests, attempts] = await Promise.all([
    Test.find({ classroomId: { $in: classroomIds }, status: TEST_STATUS.PUBLISHED })
      .populate('classroomId', 'title subject')
      .sort({ monthKey: -1 })
      .lean(),
    TestAttempt.find({ studentId }).select('testId score totalQuestions weakTopics submittedAt status').lean(),
  ]);

  const attemptMap = new Map(attempts.map((a) => [String(a.testId), a]));

  const upcoming = [];
  const past = [];

  for (const test of publishedTests) {
    const attempt = attemptMap.get(String(test._id));
    const isOpen = (!test.availableFrom || now >= test.availableFrom) &&
                   (!test.availableTo   || now <= test.availableTo);

    if (attempt && attempt.status !== 'in_progress') {
      past.push({
        testId:         test._id,
        title:          test.title,
        subject:        test.subject,
        classroomTitle: test.classroomId?.title,
        monthKey:       test.monthKey,
        score:          attempt.score,
        totalQuestions: attempt.totalQuestions,
        weakTopics:     attempt.weakTopics,
        submittedAt:    attempt.submittedAt,
      });
    } else if (isOpen) {
      upcoming.push({
        testId:          test._id,
        title:           test.title,
        subject:         test.subject,
        classroomTitle:  test.classroomId?.title,
        monthKey:        test.monthKey,
        durationMinutes: test.durationMinutes,
        totalQuestions:  test.questions?.length,
        availableFrom:   test.availableFrom,
        availableTo:     test.availableTo,
      });
    }
  }

  res.status(200).json(new ApiResponse(200, { upcoming, past }, 'Student tests'));
});

// ── POST /tests/:testId/start — Student starts an attempt ─────────────────────
export const startTestAttempt = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.testId);
  if (!test) throw ApiError.notFound('Test');
  if (test.status !== TEST_STATUS.PUBLISHED) throw ApiError.badRequest('This test is not currently open');

  const now = new Date();
  if (test.availableFrom && now < test.availableFrom) throw ApiError.badRequest('This test is not open yet');
  if (test.availableTo && now > test.availableTo)     throw ApiError.badRequest('This test has closed');

  await assertStudentEnrolled(test.classroomId, req.user._id);

  const existing = await TestAttempt.findOne({ testId: test._id, studentId: req.user._id });
  if (existing) {
    if (existing.status !== 'in_progress') {
      throw ApiError.badRequest('You have already submitted this test');
    }
    return res.status(200).json(new ApiResponse(200, {
      attemptId: existing._id,
      test:      test.toStudentView(),
      startedAt: existing.startedAt,
    }, 'Resuming existing attempt'));
  }

  const attempt = await TestAttempt.create({
    testId:         test._id,
    classroomId:    test.classroomId,
    studentId:      req.user._id,
    totalQuestions: test.questions.length,
  });

  res.status(201).json(new ApiResponse(201, {
    attemptId: attempt._id,
    test:      test.toStudentView(),
    startedAt: attempt.startedAt,
  }, 'Test attempt started'));
});

// ── POST /tests/:testId/submit — Student submits answers ──────────────────────
export const submitTestAttempt = asyncHandler(async (req, res) => {
  const { answers = [], autoSubmit = false } = req.body;
  const test = await Test.findById(req.params.testId);
  if (!test) throw ApiError.notFound('Test');

  const attempt = await TestAttempt.findOne({ testId: test._id, studentId: req.user._id });
  if (!attempt) throw ApiError.badRequest('No active attempt found — start the test first');
  if (attempt.status !== 'in_progress') throw ApiError.badRequest('This attempt has already been submitted');

  await attempt.gradeAndSubmit(test, answers, Boolean(autoSubmit));

  res.status(200).json(new ApiResponse(200, {
    attemptId:      attempt._id,
    score:          attempt.score,
    totalQuestions: attempt.totalQuestions,
    weakTopics:     attempt.weakTopics,
  }, 'Test submitted'));
});

// ── GET /tests/:testId/results — Student: detailed graded review ──────────────
export const getTestResults = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.testId).lean();
  if (!test) throw ApiError.notFound('Test');

  const attempt = await TestAttempt.findOne({ testId: test._id, studentId: req.user._id }).lean();
  if (!attempt) throw ApiError.notFound('No attempt found for this test');
  if (attempt.status === 'in_progress') throw ApiError.badRequest('Test has not been submitted yet');

  const questionMap = new Map(test.questions.map((q) => [String(q._id), q]));
  const review = attempt.answers.map((a) => {
    const q = questionMap.get(String(a.questionId));
    return {
      questionId:         a.questionId,
      text:               q?.text,
      options:            q?.options,
      correctAnswerIndex: a.correctAnswerIndex,
      selectedIndex:      a.selectedIndex,
      isCorrect:          a.isCorrect,
      topic:              a.topic,
    };
  });

  res.status(200).json(new ApiResponse(200, {
    testId:         test._id,
    title:          test.title,
    subject:        test.subject,
    score:          attempt.score,
    totalQuestions: attempt.totalQuestions,
    weakTopics:     attempt.weakTopics,
    submittedAt:    attempt.submittedAt,
    review,
  }, 'Test results'));
});
