// src/controllers/enrollment.controller.js
import mongoose from 'mongoose';
import {
  Classroom, EnrollmentQuery, Enrollment, Payment,
  StudentWallet, User, TeacherProfile,
} from '../models/index.js';
import { WalletService }       from '../services/wallet.service.js';
import { EscrowService }       from '../services/escrow.service.js';
import { PaymentService }      from '../services/payment.service.js';
import { NotificationService } from '../services/notification.service.js';
import { EmailService }        from '../services/email.service.js';
import { asyncHandler }        from '../utils/AsyncHandler.js';
import ApiError                from '../utils/ApiError.js';
import ApiResponse             from '../utils/ApiResponse.js';
import {
  QUERY_STATUS, PAYMENT_PURPOSE, PAYMENT_STATUS, ENROLLMENT_STATUS,
} from '../constants/enums.js';
import { calcTeacherDeposit } from '../utils/finance.util.js';
import { blockAllPII }        from '../utils/pil.util.js';
import logger                 from '../config/logger.config.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /queries — Student sends enrollment query (costs 1 token)
// ─────────────────────────────────────────────────────────────────────────────
export const sendQuery = asyncHandler(async (req, res) => {
  const { classroomId, message = '' } = req.body;
  if (!classroomId) throw ApiError.badRequest('classroomId is required');

  let queryMessage = message.trim();
  if (!queryMessage) {
    queryMessage = "I want to join the classroom";
  }

  // PII guard on student message
  blockAllPII({ message: queryMessage });

  const classroom = await Classroom.findById(classroomId);
  if (!classroom)                  throw ApiError.notFound('Classroom');
  if (!classroom.canAcceptStudents()) {
    throw new ApiError(400, 'Classroom is not accepting new students', [], 'CLASSROOM_CLOSED');
  }

  const [existingQuery, existingEnrollment] = await Promise.all([
    EnrollmentQuery.findActiveQuery(req.user._id, classroomId),
    Enrollment.findOne({ studentId: req.user._id, classroomId, status: ENROLLMENT_STATUS.ACTIVE }),
  ]);
  if (existingQuery)      throw new ApiError(409, 'You already have an active query for this classroom', [], 'DUPLICATE_QUERY');
  if (existingEnrollment) throw new ApiError(409, 'You are already enrolled in this classroom', [], 'ALREADY_ENROLLED');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const allocatedQueryId = new mongoose.Types.ObjectId();
    await WalletService.debitToken(req.user._id, allocatedQueryId, classroomId, session);

    const [query] = await EnrollmentQuery.create([{
      _id:                 allocatedQueryId,
      studentId:           req.user._id,
      classroomId,
      teacherId:           classroom.teacherId,
      message:             queryMessage,
      teacherDepositPaise: calcTeacherDeposit(classroom.feesPaise),
    }], { session });

    await Classroom.findByIdAndUpdate(classroomId, { $inc: { 'stats.totalQueries': 1 } }, { session });
    await session.commitTransaction();

    // Non-blocking: notify teacher + send student receipt for token spend
    const [student, teacher] = await Promise.all([
      User.findById(req.user._id).select('name phone email'),
      User.findById(classroom.teacherId).select('name phone'),
    ]);
    NotificationService.notifyTeacherNewQuery(teacher, student, classroom).catch(() => {});
    if (student?.email) {
      EmailService.sendPaymentReceipt(student.email, {
        recipientName: student.name,
        transactionId: allocatedQueryId.toString(),
        description:   `1 Query Token used — ${classroom.title}`,
        type:          'token_purchase',
        amountPaise:   0, // token was already in wallet; receipt is for token usage
        date:          new Date().toISOString(),
        classroomName: classroom.title,
      });
    }

    logger.info('Query sent', { queryId: query._id, studentId: req.user._id });
    res.status(201).json(new ApiResponse(201, query, 'Enrollment request sent'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /queries/:queryId/accept — Teacher accepts (charges 4% deposit)
// ─────────────────────────────────────────────────────────────────────────────
export const acceptQuery = asyncHandler(async (req, res) => {
  const { queryId }        = req.params;
  const { teacherMessage = null } = req.body;

  // PII guard on teacher's optional message
  if (teacherMessage) blockAllPII({ teacherMessage });

  const query = await EnrollmentQuery.findById(queryId);
  if (!query) throw ApiError.notFound('Query');
  if (query.teacherId.toString() !== req.user._id.toString()) throw ApiError.forbidden('You do not own this query');
  if (query.status !== QUERY_STATUS.PENDING) {
    throw new ApiError(400, `Query is already ${query.status}`, [], 'INVALID_STATUS');
  }

  const classroom = await Classroom.findById(query.classroomId);
  if (!classroom) throw ApiError.notFound('Classroom');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { charged, depositPaise } = await EscrowService.chargeTeacherDeposit(
      req.user._id, query._id, classroom.feesPaise, session,
    );

    if (charged) {
      await query.accept(depositPaise, teacherMessage);
      await Classroom.findByIdAndUpdate(query.classroomId, { $inc: { 'stats.acceptedQueries': 1 } }, { session });
      await session.commitTransaction();

      const [student, teacher] = await Promise.all([
        User.findById(query.studentId).select('name phone email'),
        User.findById(req.user._id).select('name email'),
      ]);
      NotificationService.notifyStudentQueryAccepted(student, classroom).catch(() => {});

      // Receipt email to teacher for 4% deposit
      if (teacher?.email) {
        EmailService.sendPaymentReceipt(teacher.email, {
          recipientName: teacher.name,
          transactionId: query._id.toString(),
          description:   `4% deposit — Query accepted for ${classroom.title}`,
          type:          'teacher_deposit',
          amountPaise:   depositPaise,
          date:          new Date().toISOString(),
          classroomName: classroom.title,
        });
      }

      logger.info('Query accepted (wallet)', { queryId, teacherId: req.user._id });
      return res.status(200).json(new ApiResponse(200, { status: 'accepted', query }, 'Query accepted'));
    }

    // Insufficient wallet — need Razorpay top-up
    const order = await PaymentService.createOrder({
      amountPaise: depositPaise,
      receipt:     `dep_${queryId.toString().slice(-8)}_${Date.now()}`,
      notes:       { purpose: PAYMENT_PURPOSE.TEACHER_DEPOSIT, queryId: queryId.toString(), teacherId: req.user._id.toString() },
    });

    await Payment.findOneAndUpdate(
      { queryId: query._id, purpose: PAYMENT_PURPOSE.TEACHER_DEPOSIT, status: PAYMENT_STATUS.CREATED },
      { razorpayOrderId: order.id },
      { session },
    );

    await session.commitTransaction();

    logger.info('Query accept pending deposit', { queryId, teacherId: req.user._id });
    return res.status(202).json(new ApiResponse(202, {
      status: 'pending_payment', depositPaise, razorpayOrder: order,
    }, 'Deposit payment required to confirm acceptance'));

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /queries/:queryId/reject — Teacher rejects query
// ─────────────────────────────────────────────────────────────────────────────
export const rejectQuery = asyncHandler(async (req, res) => {
  const { queryId }                   = req.params;
  const { reason = '', teacherMessage = null } = req.body;

  if (teacherMessage) blockAllPII({ teacherMessage });

  const query = await EnrollmentQuery.findById(queryId);
  if (!query) throw ApiError.notFound('Query');
  if (query.teacherId.toString() !== req.user._id.toString()) throw ApiError.forbidden('You do not own this query');
  if (query.status !== QUERY_STATUS.PENDING) {
    throw new ApiError(400, `Query is already ${query.status}`, [], 'INVALID_STATUS');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await query.reject(reason, teacherMessage);
    await WalletService.refundToken(query.studentId, query._id, 'Token refunded: query rejected by teacher', session);
    await session.commitTransaction();

    const [student, classroom] = await Promise.all([
      User.findById(query.studentId).select('phone email name'),
      Classroom.findById(query.classroomId).select('title'),
    ]);
    NotificationService.notifyStudentQueryRejected(student, classroom).catch(() => {});

    res.status(200).json(new ApiResponse(200, null, 'Query rejected, token refunded to student'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /queries/:queryId/enroll — Student pays enrollment fee from wallet
// ─────────────────────────────────────────────────────────────────────────────
export const enrollInClassroom = asyncHandler(async (req, res) => {
  const { queryId }       = req.params;
  const { useWalletCash, password, transactionPassword } = req.body;
  const providedPassword = password || transactionPassword;

  const query = await EnrollmentQuery.findById(queryId).populate('classroomId');
  if (!query)                                                  throw ApiError.notFound('Query');
  if (query.studentId.toString() !== req.user._id.toString()) throw ApiError.forbidden('This query does not belong to you');
  if (query.status !== QUERY_STATUS.ACCEPTED) {
    throw new ApiError(400, 'Query must be in accepted status to enroll', [], 'QUERY_NOT_ACCEPTED');
  }
  if (query.studentEnrollDeadline && query.studentEnrollDeadline < new Date()) {
    throw new ApiError(400, 'Enrollment window has expired (24 hours). Please re-apply.', [], 'ENROLLMENT_EXPIRED');
  }

  const classroom = query.classroomId;

  if (useWalletCash) {
    if (!providedPassword) {
      throw new ApiError(
        400,
        'Password verification is required for wallet payments. Please enter your account password.',
        [],
        'PASSWORD_REQUIRED'
      );
    }

    const userWithPass = await User.findById(req.user._id).select('+passwordHash');
    if (!userWithPass?.passwordHash) {
      throw new ApiError(403, 'No password set on this account. Please set a password to make wallet transfers.', [], 'NO_PASSWORD_SET');
    }

    const isValidPassword = await userWithPass.comparePassword(providedPassword);
    if (!isValidPassword) {
      throw new ApiError(401, 'Incorrect password. Wallet payment failed.', [], 'INVALID_PASSWORD');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await WalletService.debitCashOrThrow(req.user._id, classroom.feesPaise, session);

      const [payment] = await Payment.create([{
        purpose:          PAYMENT_PURPOSE.ENROLLMENT_FEE,
        payerId:          req.user._id,
        classroomId:      classroom._id,
        queryId:          query._id,
        teacherId:        classroom.teacherId,
        totalAmountPaise: classroom.feesPaise,
        status:           PAYMENT_STATUS.CAPTURED,
        gateway:          'wallet',
        escrowStatus:     'holding',
        escrowHeldAt:     new Date(),
        capturedAt:       new Date(),
      }], { session });

      const [enrollment] = await Enrollment.create([{
        studentId:           req.user._id,
        classroomId:         classroom._id,
        teacherId:           classroom.teacherId,
        queryId:             query._id,
        paymentId:           payment._id,
        feesPaidPaise:       classroom.feesPaise,
        teacherDepositPaise: query.teacherDepositPaise,
        status:              ENROLLMENT_STATUS.ACTIVE,
      }], { session });

      await query.markEnrolled(enrollment._id);
      await Classroom.findByIdAndUpdate(classroom._id, { $inc: { 'stats.enrolledStudents': 1 } }, { session });
      await session.commitTransaction();

      // Fetch wallet balance after debit for receipt
      const updatedWallet = await StudentWallet.findOne({ studentId: req.user._id }).lean();

      // Receipt email to student
      const student = await User.findById(req.user._id).select('name email phone');
      if (student?.email) {
        EmailService.sendPaymentReceipt(student.email, {
          recipientName:       student.name,
          transactionId:       payment._id.toString(),
          description:         `Classroom Enrollment — ${classroom.title}`,
          type:                'enrollment_fee',
          amountPaise:         classroom.feesPaise,
          date:                new Date().toISOString(),
          classroomName:       classroom.title,
          balanceAfterPaise:   updatedWallet?.cashBalancePaise,
        });
      }
      NotificationService.notifyEnrollmentConfirmed(student, null, classroom).catch(() => {});

      return res.status(201).json(new ApiResponse(201, enrollment, 'Enrolled successfully'));
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // Gateway payment — return Razorpay order
  const order = await PaymentService.createEnrollmentOrder(req.user._id, classroom._id, classroom.feesPaise);

  const payment = await Payment.create({
    purpose:          PAYMENT_PURPOSE.ENROLLMENT_FEE,
    payerId:          req.user._id,
    classroomId:      classroom._id,
    queryId:          query._id,
    teacherId:        classroom.teacherId,
    totalAmountPaise: classroom.feesPaise,
    status:           PAYMENT_STATUS.CREATED,
    razorpayOrderId:  order.id,
    idempotencyKey:   req.idempotencyKey || null,
  });

  res.status(200).json(new ApiResponse(200, {
    razorpayOrder: order, paymentId: payment._id, amountPaise: classroom.feesPaise,
  }, 'Payment order created. Complete payment to enroll.'));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /queries/:queryId/enroll/verify — Verify Razorpay enrollment payment
// ─────────────────────────────────────────────────────────────────────────────
export const verifyEnrollmentPayment = asyncHandler(async (req, res) => {
  const { queryId } = req.params;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw ApiError.badRequest('razorpayOrderId, razorpayPaymentId and razorpaySignature are required');
  }

  const isValid = PaymentService.verifyPaymentSignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature });
  if (!isValid) throw new ApiError(400, 'Invalid payment signature', [], 'PAYMENT_SIGNATURE_INVALID');

  const query = await EnrollmentQuery.findById(queryId).populate('classroomId');
  if (!query || query.studentId.toString() !== req.user._id.toString()) throw ApiError.notFound('Query');

  const payment = await Payment.findOne({ razorpayOrderId, payerId: req.user._id });
  if (!payment) throw ApiError.notFound('Payment record');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await payment.capture({ razorpayPaymentId, razorpaySignature, method: null });

    const classroom = query.classroomId;
    const [enrollment] = await Enrollment.create([{
      studentId:           req.user._id,
      classroomId:         classroom._id,
      teacherId:           classroom.teacherId,
      queryId:             query._id,
      paymentId:           payment._id,
      feesPaidPaise:       classroom.feesPaise,
      teacherDepositPaise: query.teacherDepositPaise,
      status:              ENROLLMENT_STATUS.ACTIVE,
    }], { session });

    await query.markEnrolled(enrollment._id);
    await Classroom.findByIdAndUpdate(classroom._id, { $inc: { 'stats.enrolledStudents': 1 } }, { session });
    await session.commitTransaction();

    const student = await User.findById(req.user._id).select('name email phone');
    if (student?.email) {
      EmailService.sendPaymentReceipt(student.email, {
        recipientName:  student.name,
        transactionId:  razorpayPaymentId,
        description:    `Enrollment — ${classroom.title}`,
        type:           'enrollment_fee',
        amountPaise:    classroom.feesPaise,
        date:           new Date().toISOString(),
        classroomName:  classroom.title,
      });
    }
    NotificationService.notifyEnrollmentConfirmed(student, null, classroom).catch(() => {});

    res.status(201).json(new ApiResponse(201, enrollment, 'Enrollment confirmed'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /me/dashboard — Student dashboard summary
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const { Announcement } = await import('../models/index.js');
  const studentId = req.user._id;

  const [activeEnrollments, completedCount, wallet, tabCounts] = await Promise.all([
    Enrollment.find({ studentId, status: ENROLLMENT_STATUS.ACTIVE })
      .populate({
        path:   'classroomId',
        select: 'title subject stream mode schedule gmeetLink offlineFacility teacherId',
        populate: { path: 'teacherId', select: 'name avatarUrl' },
      })
      .lean(),
    Enrollment.countDocuments({ studentId, status: ENROLLMENT_STATUS.COMPLETED }),
    StudentWallet.findOne({ studentId }).lean(),
    EnrollmentQuery.studentQueryCounts(studentId),
  ]);

  const classroomIds = activeEnrollments
    .map((e) => e.classroomId?._id)
    .filter(Boolean);

  const [upcomingClasses, recentNotices] = await Promise.all([
    _buildStudentUpcomingSchedule(activeEnrollments, 7),
    classroomIds.length
      ? Announcement.find({ classroomId: { $in: classroomIds } })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('title content classroomId createdAt')
          .lean()
      : [],
  ]);

  res.status(200).json(new ApiResponse(200, {
    classroomCounts: {
      active:    activeEnrollments.length,
      completed: completedCount,
    },
    upcomingClasses,
    recentNotices,
    wallet: {
      tokenBalance:      wallet?.tokenBalance || 0,
      cashBalancePaise:  wallet?.cashBalancePaise || 0,
    },
    queryTabCounts: tabCounts,
  }, 'Student dashboard data'));
});

// INTERNAL HELPER — build upcoming session list for a student's active enrollments
function _buildStudentUpcomingSchedule(enrollments, daysAhead = 7) {
  const now     = new Date();
  const ceiling = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const results = [];

  for (const enrollment of enrollments) {
    const classroom = enrollment.classroomId;
    if (!classroom || !Array.isArray(classroom.schedule)) continue;

    for (const slot of classroom.schedule) {
      const nextDate = _nextOccurrence(slot.day, slot.startTime, now);
      if (nextDate && nextDate <= ceiling) {
        results.push({
          classroomId:     classroom._id,
          classroomTitle:  classroom.title,
          subject:         classroom.subject,
          teacherName:     classroom.teacherId?.name || null,
          teacherAvatar:   classroom.teacherId?.avatarUrl || null,
          mode:            classroom.mode,
          gmeetLink:       classroom.mode === 'online' ? classroom.gmeetLink : null,
          offlineAddress:  classroom.offlineFacility?.address || null,
          scheduledAt:     nextDate.toISOString(),
          day:             slot.day,
          startTime:       slot.startTime,
          endTime:         slot.endTime,
        });
      }
    }
  }
  return results.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

function _nextOccurrence(dayOfWeek, startTime, from) {
  if (dayOfWeek < 0 || dayOfWeek > 6) return null;
  const [h, m]    = startTime.split(':').map(Number);
  const candidate = new Date(from);
  candidate.setHours(h, m, 0, 0);

  let diff = dayOfWeek - candidate.getDay();
  if (diff < 0 || (diff === 0 && candidate <= from)) diff += 7;
  else if (diff === 0 && candidate > from) diff = 0;

  candidate.setDate(candidate.getDate() + diff);
  return candidate;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET / — Student's enrolled classrooms  (tab: active | completed | all)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentEnrollments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, tab = 'active' } = req.query;

  const statusMap = {
    active:    ENROLLMENT_STATUS.ACTIVE,
    completed: ENROLLMENT_STATUS.COMPLETED,
    all:       undefined,
  };

  if (!Object.keys(statusMap).includes(tab)) {
    throw ApiError.badRequest('tab must be one of: active, completed, all');
  }

  const filter = { studentId: req.user._id };
  if (statusMap[tab]) filter.status = statusMap[tab];

  const result = await Enrollment.paginate(filter, {
    page:     Number(page),
    limit:    Math.min(Number(limit), 20),
    sort:     { createdAt: -1 },
    populate: [
      {
        path:   'classroomId',
        select: 'title subject stream mode feesPaise status thumbnailUrl classroomType skillLevel academicLevel schedule gmeetLink teacherId totalHoursPlanned stats',
        populate: { path: 'teacherId', select: 'name avatarUrl' },
      },
    ],
    select: 'classroomId status classesAttended assignmentsCompleted feesPaidPaise createdAt',
  });

  res.status(200).json(new ApiResponse(200, result, 'Your enrolled classrooms'));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /queries — Student's query history with UI tab mapping
// Teacher tab: active | accepted | enrolled | rejected | expired | refunded
// Student tab: active | accepted | enrolled | rejected | expired
// ─────────────────────────────────────────────────────────────────────────────
export const getMyQueries = asyncHandler(async (req, res) => {
  const { tab, page = 1, limit = 20 } = req.query;
  const isTeacher = req.user.role === 'teacher';

  // Map UI tab names → DB status values
  const studentTabMap = {
    active:   QUERY_STATUS.PENDING,
    accepted: QUERY_STATUS.ACCEPTED,
    enrolled: QUERY_STATUS.ENROLLED,
    rejected: [QUERY_STATUS.REJECTED, QUERY_STATUS.EXPIRED], // teacher no-show = auto-expired
    expired:  QUERY_STATUS.LAPSED,                           // accepted but student didn't enroll
    archived: 'archived',
  };

  const teacherTabMap = {
    active:   QUERY_STATUS.PENDING,
    accepted: QUERY_STATUS.ACCEPTED,
    enrolled: QUERY_STATUS.ENROLLED,
    rejected: QUERY_STATUS.REJECTED,
    expired:  QUERY_STATUS.EXPIRED,   // teacher didn't respond in 24h
    refunded: QUERY_STATUS.LAPSED,    // student didn't enroll → teacher got 4% back
    archived: 'archived',
  };

  const tabMap = isTeacher ? teacherTabMap : studentTabMap;
  const filter = isTeacher ? { teacherId: req.user._id } : { studentId: req.user._id };

  if (tab === 'archived') {
    if (isTeacher) {
      filter.isArchivedByTeacher = true;
    } else {
      filter.isArchivedByStudent = true;
    }
  } else {
    if (isTeacher) {
      filter.isArchivedByTeacher = { $ne: true };
    } else {
      filter.isArchivedByStudent = { $ne: true };
    }

    if (tab && tabMap[tab]) {
      const statusValue = tabMap[tab];
      filter.status = Array.isArray(statusValue) ? { $in: statusValue } : statusValue;
    }
  }

  const result = await EnrollmentQuery.paginate(filter, {
    page:     Number(page),
    limit:    Math.min(Number(limit), 50),
    sort:     { createdAt: -1 },
    populate: [
      { path: 'classroomId', select: 'title subject mode feesPaise thumbnailUrl classroomType skillLevel' },
      ...(isTeacher
        ? [{ path: 'studentId', select: 'name avatarUrl phone' }]
        : [{ path: 'teacherId', select: 'name avatarUrl' }]),
    ],
  });

  // Attach tab counts
  const tabCounts = isTeacher
    ? await EnrollmentQuery.teacherQueryCounts(req.user._id)
    : await EnrollmentQuery.studentQueryCounts(req.user._id);

  res.status(200).json(new ApiResponse(200, { ...result, tabCounts }, 'Queries'));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /:enrollmentId/review — Student reviews a completed classroom
// ─────────────────────────────────────────────────────────────────────────────
export const submitReview = asyncHandler(async (req, res) => {
  const { Review } = await import('../models/index.js');
  const { enrollmentId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) throw ApiError.badRequest('rating must be between 1 and 5');

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment || enrollment.studentId.toString() !== req.user._id.toString()) throw ApiError.notFound('Enrollment');
  if (enrollment.status !== 'completed') throw ApiError.badRequest('You can only review completed classrooms');
  if (enrollment.reviewId) throw new ApiError(409, 'You have already reviewed this classroom', [], 'REVIEW_EXISTS');

  if (comment) blockAllPII({ comment });

  const review = await Review.create({
    enrollmentId,
    studentId:   req.user._id,
    teacherId:   enrollment.teacherId,
    classroomId: enrollment.classroomId,
    rating,
    comment:     comment?.trim() || '',
  });

  await Enrollment.findByIdAndUpdate(enrollmentId, { reviewId: review._id });
  await Review.updateStats(enrollment.teacherId, enrollment.classroomId);

  res.status(201).json(new ApiResponse(201, review, 'Review submitted'));
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /queries/:queryId — Student withdraws a PENDING query (gets token back)
// ─────────────────────────────────────────────────────────────────────────────
export const withdrawQuery = asyncHandler(async (req, res) => {
  const { queryId } = req.params;

  const query = await EnrollmentQuery.findById(queryId);
  if (!query) throw ApiError.notFound('Query');

  // Only the student who sent the query can withdraw it
  if (query.studentId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not own this query');
  }

  // Only pending queries can be withdrawn (not already accepted/enrolled/rejected)
  if (query.status !== QUERY_STATUS.PENDING) {
    throw new ApiError(
      400,
      `Cannot withdraw a query with status: ${query.status}. Only pending queries can be withdrawn.`,
      [],
      'INVALID_QUERY_STATUS'
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Atomically close the query and refund 1 token
    query.status = QUERY_STATUS.LAPSED; // student withdrew = lapsed/closed_inactive
    await query.save({ session });

    await WalletService.refundToken(
      req.user._id,
      query._id,
      'Token refunded — query withdrawn by student',
      session
    );

    await session.commitTransaction();
    logger.info('Query withdrawn by student', { queryId, studentId: req.user._id });

    res.status(200).json(new ApiResponse(200, null, 'Query withdrawn and 1 token refunded to your wallet'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /queries/:queryId/messages — Send chat message under a query
// ─────────────────────────────────────────────────────────────────────────────
export const sendQueryMessage = asyncHandler(async (req, res) => {
  const { queryId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    throw ApiError.badRequest('Message text is required');
  }

  const query = await EnrollmentQuery.findById(queryId);
  if (!query) throw ApiError.notFound('Query');

  const userId = req.user._id.toString();
  const isStudent = query.studentId.toString() === userId;
  const isTeacher = query.teacherId.toString() === userId;

  if (!isStudent && !isTeacher) {
    throw ApiError.forbidden('You are not authorized to send messages under this query');
  }

  if (query.status !== QUERY_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot send messages when query is ${query.status}`);
  }

  query.messages = query.messages || [];
  query.messages.push({
    senderId: req.user._id,
    text: text.trim(),
    createdAt: new Date(),
  });

  await query.save();

  res.status(200).json(new ApiResponse(200, query.messages, 'Message sent successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /queries/:queryId/archive — Archive/unarchive a query
// ─────────────────────────────────────────────────────────────────────────────
export const archiveQuery = asyncHandler(async (req, res) => {
  const { queryId } = req.params;
  const { archive = true } = req.body;

  const query = await EnrollmentQuery.findById(queryId);
  if (!query) throw ApiError.notFound('Query');

  const userId = req.user._id.toString();
  const isStudent = query.studentId.toString() === userId;
  const isTeacher = query.teacherId.toString() === userId;

  if (!isStudent && !isTeacher) {
    throw ApiError.forbidden('You are not authorized to access this query');
  }

  // Active queries can't be archived by student or teacher
  if (query.status === QUERY_STATUS.PENDING) {
    throw ApiError.badRequest('Active queries cannot be archived');
  }

  if (isStudent) {
    query.isArchivedByStudent = !!archive;
  }
  if (isTeacher) {
    query.isArchivedByTeacher = !!archive;
  }

  await query.save();

  res.status(200).json(new ApiResponse(200, {
    isArchivedByStudent: query.isArchivedByStudent,
    isArchivedByTeacher: query.isArchivedByTeacher
  }, `Query ${archive ? 'archived' : 'unarchived'} successfully`));
});