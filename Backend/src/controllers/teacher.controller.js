// src/controllers/teacher.controller.js
import mongoose from 'mongoose';
import {
  User, TeacherProfile, Document, Classroom, Doubt,
  EnrollmentQuery, ExtraClass, Review, Enrollment,
} from '../models/index.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { PaymentService }    from '../services/payment.service.js';
import { EmailService }      from '../services/email.service.js';
import { asyncHandler }      from '../utils/AsyncHandler.js';
import ApiError              from '../utils/ApiError.js';
import ApiResponse           from '../utils/ApiResponse.js';
import {
  DOCUMENT_TYPE, DOCUMENT_STATUS, VERIFICATION_STATUS, PAYMENT_PURPOSE, PAYMENT_STATUS,
} from '../constants/enums.js';
import logger from '../config/logger.config.js';

// ── POST /onboarding/profile ────────────────────────────────────────────────────
export const submitProfile = asyncHandler(async (req, res) => {
  const {
    bio, headline, subjects, languages, city, state, country,
    experienceYears, education, bankAccount, portfolioUrls,
    // hourlyRate is intentionally NOT accepted — each classroom has its own fee
  } = req.body;

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    throw ApiError.badRequest('At least one subject is required');
  }
  if (bankAccount?.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankAccount.ifsc)) {
    throw ApiError.badRequest('Invalid IFSC code format');
  }

  const profile = await TeacherProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      $set: {
        bio:             bio?.trim()      || '',
        headline:        headline?.trim() || '',
        subjects:        subjects.map((s) => s.trim()),
        languages:       languages        || ['Hindi', 'English'],
        city:            city?.toLowerCase().trim(),
        state:           state?.toLowerCase().trim(),
        country:         country          || 'india',
        experienceYears: experienceYears  || 0,
        education:       education        || [],
        bankAccount:     bankAccount      || undefined,
        portfolioUrls:   portfolioUrls    || [],
      },
    },
    { new: true, upsert: true, runValidators: true },
  ).select('-adminNotes -searchKeywords -bankAccount.accountNumber');

  res.status(200).json(new ApiResponse(200, profile, 'Teacher profile updated'));
});

// ── POST /onboarding/kyc ────────────────────────────────────────────────────────
export const uploadKYC = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw ApiError.badRequest('At least one document file is required');

  const documentType = req.body.documentType || DOCUMENT_TYPE.AADHAAR;
  if (!Object.values(DOCUMENT_TYPE).includes(documentType)) throw ApiError.badRequest('Invalid document type');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const docIds = [];
    for (let i = 0; i < req.files.length; i++) {
      const file   = req.files[i];
      const result = await CloudinaryService.uploadKYCDocument(file.buffer, req.user._id.toString(), `${documentType}_${i}`);
      const [doc]  = await Document.create([{
        teacherId:     req.user._id,
        type:          documentType,
        fileUrl:       result.secure_url,
        s3Key:         result.public_id,
        mimeType:      file.mimetype,
        fileSizeBytes: file.size,
        status:        DOCUMENT_STATUS.UPLOADED,
      }], { session });
      docIds.push(doc._id);
    }

    await TeacherProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $push: { kycDocumentIds: { $each: docIds } },
        $set: { verificationStatus: VERIFICATION_STATUS.PENDING }
      },
      { session }
    );
    await User.findByIdAndUpdate(req.user._id, { kycStatus: 'under_review' }, { session });
    await session.commitTransaction();

    logger.info('KYC documents uploaded', { userId: req.user._id, count: docIds.length });
    res.status(200).json(new ApiResponse(200, { uploaded: docIds.length }, 'Documents uploaded. Under review.'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ── GET /me/dashboard ────────────────────────────────────────────────────────────
export const getDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  const [
    classroomStats, pendingQueries, resolvedQueries, totalEnrolledStudents, pendingDoubts, pendingExtraClasses, profile,
  ] = await Promise.all([
    Classroom.aggregate([
      { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
      {
        $group: {
          _id:              null,
          total:            { $sum: 1 },
          active:           { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completed:        { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalStudents:    { $sum: '$stats.enrolledStudents' },
          totalEarnings:    { $sum: '$stats.totalEarningsPaise' },
        },
      },
    ]),
    EnrollmentQuery.countDocuments({ teacherId, status: 'pending' }),
    EnrollmentQuery.countDocuments({ teacherId, status: { $in: ['accepted', 'rejected', 'resolved', 'enrolled', 'completed', 'responded'] } }),
    Enrollment.countDocuments({ teacherId }),
    Doubt.countDocuments({ teacherId, status: 'open' }),
    ExtraClass.countDocuments({ teacherId, status: 'pending' }),
    TeacherProfile.findOne({ userId: teacherId })
      .select('walletPaise walletRupees stats verificationStatus bio headline subjects')
      .lean({ virtuals: true }),
  ]);

  // ── Upcoming classes (next 7 days based on weekly schedule) ──────────────────
  const activeClassrooms = await Classroom.find({
    teacherId,
    status:  'active',
    endDate: { $gte: new Date() },
  }).select('title subject schedule mode gmeetLink offlineFacility.address classroomType').lean();

  const upcomingClasses = _buildUpcomingSchedule(activeClassrooms, 7);

  res.status(200).json(new ApiResponse(200, {
    classroomStats: classroomStats[0] || {
      total: 0, active: 0, completed: 0, totalStudents: 0, totalEarnings: 0,
    },
    pendingQueries,
    resolvedQueriesCount: resolvedQueries || 0,
    totalEnrolledStudents: totalEnrolledStudents || classroomStats[0]?.totalStudents || 0,
    pendingDoubts,
    pendingExtraClasses,
    upcomingClasses,                       // next 7 days of scheduled sessions
    walletPaise:       profile?.walletPaise       || 0,
    walletRupees:      profile?.walletRupees      || 0,
    verificationStatus: profile?.verificationStatus,
  }, 'Dashboard data'));
});

// ── GET /me/earnings ──────────────────────────────────────────────────────────
export const getEarnings = asyncHandler(async (req, res) => {
  const { Payout, Enrollment } = await import('../models/index.js');

  const [profile, payouts, monthlyAgg] = await Promise.all([
    TeacherProfile.findOne({ userId: req.user._id })
      .select('walletPaise walletRupees stats.totalEarningsPaise stats.withdrawnPaise stats.pendingPayoutPaise')
      .lean({ virtuals: true }),
    Payout.find({ teacherId: req.user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Enrollment.aggregate([
      { $match: { teacherId: req.user._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalPaise: { $sum: '$feesPaidPaise' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Build last 6 months default chart data if empty/partial
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyData = [];
  const monthMap = new Map(monthlyAgg.map(m => [m._id, m.totalPaise / 100]));

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = months[d.getMonth()];
    monthlyData.push({
      name: monthName,
      earnings: monthMap.get(key) || 0
    });
  }

  res.status(200).json(new ApiResponse(200, {
    walletPaise:        profile?.walletPaise                  || 0,
    walletRupees:       profile?.walletRupees                 || 0,
    totalEarningsPaise: profile?.stats?.totalEarningsPaise    || 0,
    withdrawnPaise:     profile?.stats?.withdrawnPaise        || 0,
    pendingPayoutPaise: profile?.stats?.pendingPayoutPaise    || 0,
    recentPayouts:      payouts,
    monthlyData,
  }, 'Earnings data'));
});

// ── GET /me/students ──────────────────────────────────────────────────────────
export const getMyStudents = asyncHandler(async (req, res) => {
  const { Enrollment } = await import('../models/index.js');
  const teacherId = req.user._id;

  // Only fetch students who have ACTIVE enrollments in this teacher's classrooms
  // Do NOT include students who just sent a query (not enrolled yet)
  const enrollments = await Enrollment.find({ teacherId, status: 'active' })
    .populate('studentId', 'name city avatarUrl role streakDays')
    .populate('classroomId', 'title subject mode schedule status')
    .sort({ createdAt: -1 })
    .lean();

  const studentMap = new Map();

  enrollments.forEach((e) => {
    if (e.studentId) {
      const sId = e.studentId._id ? e.studentId._id.toString() : e.studentId.toString();
      if (!studentMap.has(sId)) {
        studentMap.set(sId, {
          id: sId,
          name: e.studentId.name || 'Student',
          city: e.studentId.city || 'India',
          avatarUrl: e.studentId.avatarUrl || null,
          classroom: e.classroomId?.title || 'Classroom',
          subject: e.classroomId?.subject || 'General',
          classroomId: e.classroomId?._id || null,
          status: e.status?.toUpperCase() || 'ACTIVE',
          enrolledAt: e.createdAt,
          streakDays: e.studentId.streakDays || 0,
          classesAttended: e.classesAttended || 0,
          assignmentsCompleted: e.assignmentsCompleted || 0,
          additionalClassrooms: [],
        });
      } else {
        // Student enrolled in multiple classrooms — append classroom info
        const existing = studentMap.get(sId);
        if (e.classroomId) {
          existing.additionalClassrooms.push({
            id: e.classroomId._id,
            title: e.classroomId.title,
            subject: e.classroomId.subject,
          });
        }
      }
    }
  });

  const students = Array.from(studentMap.values());
  res.status(200).json(new ApiResponse(200, students, 'My students list (enrolled only)'));
});

// ── GET /me/wallet — Teacher wallet balance ────────────────────────────────────
export const getTeacherWallet = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOne({ userId: req.user._id })
    .select('walletPaise stats.totalEarningsPaise stats.withdrawnPaise')
    .lean({ virtuals: true });

  res.status(200).json(new ApiResponse(200, {
    walletPaise:        profile?.walletPaise             || 0,
    walletRupees:       (profile?.walletPaise || 0) / 100,
    totalEarningsPaise: profile?.stats?.totalEarningsPaise || 0,
    withdrawnPaise:     profile?.stats?.withdrawnPaise     || 0,
    isMockGateway: process.env.PAYMENT_GATEWAY === 'mock' || (!process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_SECRET),
  }, 'Teacher wallet balance'));
});

export const initiateTeacherDeposit = asyncHandler(async (req, res) => {
  const { amountPaise, password } = req.body;
  if (!amountPaise || amountPaise < 100) throw ApiError.badRequest('amountPaise must be at least ₹1 (100 paise)');

  const { Payment, User } = await import('../models/index.js');
  const isMockGateway = process.env.PAYMENT_GATEWAY === 'mock' || (!process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_SECRET);

  if (isMockGateway) {
    if (!password) throw ApiError.badRequest('Password is required for wallet deposit');
    const userWithPass = await User.findById(req.user._id).select('+passwordHash');
    if (!userWithPass?.passwordHash) throw ApiError.badRequest('No password set on this account');
    const isMatch = await userWithPass.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Invalid password');

    // Credit teacher's wallet balance directly
    const profile = await TeacherProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { walletPaise: Math.round(Number(amountPaise)) } },
      { new: true }
    );

    await Payment.create({
      purpose:          PAYMENT_PURPOSE.CASH_DEPOSIT,
      payerId:          req.user._id,
      totalAmountPaise: Math.round(Number(amountPaise)),
      status:           PAYMENT_STATUS.CAPTURED,
      gateway:          'manual',
    });

    logger.info('Teacher direct deposit completed', { userId: req.user._id, amountPaise });
    return res.status(200).json(new ApiResponse(200, { directDeposit: true }, 'Deposit completed successfully'));
  }

  const order = await PaymentService.createOrder({
    amountPaise: Math.round(Number(amountPaise)),
    receipt:     `tdep_${req.user._id.toString().slice(-8)}_${Date.now()}`,
    notes:       { purpose: PAYMENT_PURPOSE.CASH_DEPOSIT, userId: req.user._id.toString(), role: 'teacher' },
  });

  await Payment.create({
    purpose:          PAYMENT_PURPOSE.CASH_DEPOSIT,
    payerId:          req.user._id,
    totalAmountPaise: Math.round(Number(amountPaise)),
    status:           PAYMENT_STATUS.CREATED,
    razorpayOrderId:  order.id,
  });

  res.status(200).json(new ApiResponse(200, { razorpayOrder: order, amountPaise }, 'Deposit order created'));
});

// ── POST /me/wallet/deposit/verify — Verify and credit teacher wallet ──────────
export const verifyTeacherDeposit = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw ApiError.badRequest('razorpayOrderId, razorpayPaymentId and razorpaySignature are required');
  }

  const isValid = PaymentService.verifyPaymentSignature({
    orderId:   razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!isValid) throw new ApiError(400, 'Invalid payment signature', [], 'PAYMENT_SIGNATURE_INVALID');

  const { Payment } = await import('../models/index.js');
  const payment = await Payment.findOne({
    razorpayOrderId,
    payerId:  req.user._id,
    purpose:  PAYMENT_PURPOSE.CASH_DEPOSIT,
    status:   PAYMENT_STATUS.CREATED,
  });
  if (!payment) throw ApiError.notFound('Payment record');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await payment.capture({ razorpayPaymentId, razorpaySignature });
    await TeacherProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { walletPaise: payment.totalAmountPaise } },
      { session },
    );
    await session.commitTransaction();

    const [profile, teacher] = await Promise.all([
      TeacherProfile.findOne({ userId: req.user._id }).select('walletPaise').lean(),
      User.findById(req.user._id).select('name email'),
    ]);

    if (teacher?.email) {
      EmailService.sendPaymentReceipt(teacher.email, {
        recipientName:    teacher.name,
        transactionId:    razorpayPaymentId,
        description:      'Wallet top-up (deposit)',
        type:             'cash_deposit',
        amountPaise:      payment.totalAmountPaise,
        date:             new Date().toISOString(),
        balanceAfterPaise: profile?.walletPaise || 0,
      });
    }

    res.status(200).json(new ApiResponse(200, {
      depositedPaise: payment.totalAmountPaise,
      walletPaise:    profile?.walletPaise || 0,
    }, 'Wallet topped up successfully'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ── GET /me/queries ────────────────────────────────────────────────────────────
export const getMyQueries = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { teacherId: req.user._id };
  if (status) filter.status = status;

  const result = await EnrollmentQuery.paginate(filter, {
    page:     Number(page),
    limit:    Math.min(Number(limit), 200),
    sort:     { createdAt: -1 },
    populate: [
      { path: 'studentId',   select: 'name phone avatarUrl' },
      { path: 'classroomId', select: 'title subject feesPaise classroomType skillLevel' },
    ],
  });

  res.status(200).json(new ApiResponse(200, result, 'Queries fetched'));
});

// ── GET /:teacherId/public — Enhanced public profile with full stats ────────────
export const getPublicProfile = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const [user, profileRaw, classrooms, ratingBreakdown] = await Promise.all([
    User.findOne({ _id: teacherId, role: 'teacher', isActive: true })
      .select('name avatarUrl city state createdAt')
      .lean(),
    TeacherProfile.findOne({ userId: teacherId, verificationStatus: VERIFICATION_STATUS.APPROVED })
      .select('-adminNotes -searchKeywords -aadhaarNumber -kycDocumentIds')
      .lean({ virtuals: true }),
    Classroom.find({ teacherId, status: 'active' })
      .select('title subject stream mode feesPaise maxStudents stats schedule startDate endDate classroomType skillLevel academicLevel')
      .limit(10).lean(),
    Review.ratingBreakdown(teacherId),
  ]);

  if (!user || !profileRaw) throw ApiError.notFound('Teacher');

  const profile = { ...profileRaw };
  delete profile.bankAccount;

  // Surface comprehensive stats for public profile
  const stats = {
    avgRating:          profile.stats?.avgRating          || 0,
    totalReviews:       profile.stats?.totalReviews       || 0,
    totalClassrooms:    profile.stats?.totalClassrooms    || 0,
    activeClassrooms:   profile.stats?.activeClassrooms   || 0,
    completedClassrooms:profile.stats?.completedClassrooms || 0,
    totalStudentsTaught:profile.stats?.totalStudentsTaught || 0,
  };

  // hourlyRate intentionally excluded from response

  res.status(200).json(new ApiResponse(200, {
    user, profile, classrooms, ratingBreakdown, stats,
  }, 'Teacher public profile'));
});

// ── GET /me/classrooms ─────────────────────────────────────────────────────────
export const getMyClassrooms = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { teacherId: req.user._id };
  if (status) filter.status = status;

  const result = await Classroom.paginate(filter, {
    page:  Number(page),
    limit: Math.min(Number(limit), 100),
    sort:  { createdAt: -1 },
  });

  res.status(200).json(new ApiResponse(200, result, 'My classrooms'));
});

// ── GET /me/doubts ─────────────────────────────────────────────────────────────
export const getMyDoubts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'open' } = req.query;

  const result = await Doubt.paginate(
    { teacherId: req.user._id, status },
    {
      page:     Number(page),
      limit:    Math.min(Number(limit), 50),
      sort:     { createdAt: -1 },
      populate: [
        { path: 'studentId',   select: 'name avatarUrl' },
        { path: 'classroomId', select: 'title subject' },
      ],
    },
  );

  res.status(200).json(new ApiResponse(200, result, 'Doubts inbox'));
});

// ── PATCH /me/availability ─────────────────────────────────────────────────────
export const updateAvailability = asyncHandler(async (req, res) => {
  const {
    isAvailableForNewClassrooms,
    workingDays,
    startTime,
    endTime,
    maxSessions,
    timezone,
    mode,
    // frontend sends nested: { availability: { ... } } OR flat fields
    availability: availabilityObj,
  } = req.body;

  const updateFields = {};

  // Accept boolean availability toggle
  if (typeof isAvailableForNewClassrooms === 'boolean') {
    updateFields.isAvailableForNewClassrooms = isAvailableForNewClassrooms;
  }

  // Build nested availability object from either nested payload or flat fields
  const avail = availabilityObj || {};
  const resolved = {
    workingDays: avail.workingDays ?? workingDays,
    startTime:   avail.startTime   ?? startTime,
    endTime:     avail.endTime     ?? endTime,
    maxSessions: avail.maxSessions ?? maxSessions,
    timezone:    avail.timezone    ?? timezone,
  };
  if (resolved.workingDays !== undefined) updateFields['availability.workingDays'] = resolved.workingDays;
  if (resolved.startTime   !== undefined) updateFields['availability.startTime']   = resolved.startTime;
  if (resolved.endTime     !== undefined) updateFields['availability.endTime']     = resolved.endTime;
  if (resolved.maxSessions !== undefined) updateFields['availability.maxSessions'] = Number(resolved.maxSessions);
  if (resolved.timezone    !== undefined) updateFields['availability.timezone']    = resolved.timezone;

  // Teaching mode
  const teachingMode = avail.mode ?? mode;
  if (teachingMode !== undefined) updateFields.teachingMode = teachingMode;

  if (Object.keys(updateFields).length === 0) {
    throw ApiError.badRequest('No valid availability fields provided');
  }

  await TeacherProfile.findOneAndUpdate({ userId: req.user._id }, { $set: updateFields });
  res.status(200).json(new ApiResponse(200, null, 'Availability updated'));
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — build upcoming class schedule from weekly recurring slots
// ─────────────────────────────────────────────────────────────────────────────
function _buildUpcomingSchedule(classrooms, daysAhead = 7) {
  const now     = new Date();
  const ceiling = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const results = [];

  for (const classroom of classrooms) {
    if (!Array.isArray(classroom.schedule)) continue;

    for (const slot of classroom.schedule) {
      // Find the next occurrence of this day-of-week within the window
      const nextDate = _nextOccurrence(slot.day, slot.startTime, now);
      if (nextDate && nextDate <= ceiling) {
        results.push({
          classroomId:    classroom._id,
          classroomTitle: classroom.title,
          subject:        classroom.subject,
          mode:           classroom.mode,
          gmeetLink:      classroom.mode === 'online' ? classroom.gmeetLink : null,
          offlineAddress: classroom.offlineFacility?.address || null,
          scheduledAt:    nextDate.toISOString(),
          day:            slot.day,
          startTime:      slot.startTime,
          endTime:        slot.endTime,
          durationMinutes: slot.durationMinutes,
        });
      }
    }
  }

  return results.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

function _nextOccurrence(dayOfWeek, startTime, from) {
  if (dayOfWeek < 0 || dayOfWeek > 6) return null;
  const [h, m]   = startTime.split(':').map(Number);
  const candidate = new Date(from);
  candidate.setHours(h, m, 0, 0);

  let diff = dayOfWeek - candidate.getDay();
  if (diff < 0 || (diff === 0 && candidate <= from)) diff += 7;
  else if (diff === 0 && candidate > from) diff = 0;

  candidate.setDate(candidate.getDate() + diff);
  return candidate;
}

// ── GET /me/reviews ─────────────────────────────────────────────────────────────
export const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await Review.paginate(
    { teacherId: req.user._id, isVisible: true },
    {
      page:     Number(page),
      limit:    Math.min(Number(limit), 50),
      sort:     { createdAt: -1 },
      populate: [
        { path: 'studentId',   select: 'name avatarUrl' },
        { path: 'classroomId', select: 'title subject' },
      ],
    }
  );

  res.status(200).json(new ApiResponse(200, result, 'Reviews fetched successfully'));
});

// ── PATCH /me/reviews/:reviewId/reply ───────────────────────────────────────────
export const replyToReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { replyText } = req.body;

  if (replyText === undefined || replyText === null) {
    throw ApiError.badRequest('replyText is required');
  }

  const review = await Review.findById(reviewId);
  if (!review) throw ApiError.notFound('Review');

  if (review.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not own this review');
  }

  review.replyText = replyText.trim();
  review.repliedAt = new Date();
  await review.save();

  res.status(200).json(new ApiResponse(200, review, 'Reply posted successfully'));
});

// ── GET / — Public list/search teachers ──────────────────────────────────────────
export const searchTeachersPublic = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  const baseUserFilter = {
    role: 'teacher',
    isActive: true,
    deletedAt: null,
  };

  let matchingUserIds = null;

  if (q && typeof q === 'string' && q.trim().length > 0) {
    const queryStr = q.trim();
    const regex = new RegExp(queryStr, 'i');

    const [userMatches, profileMatches] = await Promise.all([
      User.find({
        ...baseUserFilter,
        $or: [
          { name: regex },
          { username: regex },
          { email: regex },
          { city: regex },
          { state: regex },
        ],
      }).select('_id').lean(),

      TeacherProfile.find({
        verificationStatus: 'approved',
        $or: [
          { subjects: regex },
          { headline: regex },
          { bio: regex },
        ],
      }).select('userId').lean(),
    ]);

    const { Classroom } = await import('../models/index.js');
    const classroomMatches = await Classroom.find({
      $or: [
        { subject: regex },
        { title: regex },
        { description: regex },
      ],
    }).select('teacherId').lean();

    const idSet = new Set([
      ...userMatches.map(u => String(u._id)),
      ...profileMatches.map(p => String(p.userId)),
      ...classroomMatches.map(c => String(c.teacherId)),
    ]);

    matchingUserIds = Array.from(idSet);
  }

  const userFilter = { ...baseUserFilter };
  if (matchingUserIds !== null) {
    userFilter._id = { $in: matchingUserIds };
  }

  const matchedUsers = await User.find(userFilter).select('_id name username avatarUrl city state').lean();
  const teacherUserIds = matchedUsers.map(u => u._id);

  const { Classroom } = await import('../models/index.js');
  const classrooms = await Classroom.find({ teacherId: { $in: teacherUserIds } }).lean();

  const teacherClassroomsMap = new Map();
  classrooms.forEach(c => {
    const tId = String(c.teacherId);
    if (!teacherClassroomsMap.has(tId)) {
      teacherClassroomsMap.set(tId, []);
    }
    teacherClassroomsMap.get(tId).push(c);
  });

  const profiles = await TeacherProfile.find({
    userId: { $in: teacherUserIds },
    verificationStatus: 'approved'
  }).select('userId subjects stats bio experienceYears headline').lean();

  const profileMap = new Map(profiles.map(p => [String(p.userId), p]));
  const matchedTeachers = matchedUsers
    .map(u => {
      const p = profileMap.get(String(u._id));
      if (!p) return null;

      const teacherClassrooms = teacherClassroomsMap.get(String(u._id)) || [];
      let price = 0;
      if (teacherClassrooms.length > 0) {
        const totalHourly = teacherClassrooms.reduce((sum, c) => {
          const hourlyCost = (c.feesPaise / 100) / (c.totalHoursPlanned || 1);
          return sum + hourlyCost;
        }, 0);
        price = Math.round(totalHourly / teacherClassrooms.length);
      }

      return {
        _id: u._id,
        id: u._id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl,
        city: u.city,
        state: u.state,
        subject: p.subjects?.[0] || 'General',
        experience: p.experienceYears ? `${p.experienceYears} years` : 'Not specified',
        bio: p.bio || p.headline || '',
        location: [u.city, u.state].filter(Boolean).join(', ') || 'Online',
        mode: 'Online', // Default
        tags: p.subjects || [],
        rating: p.stats?.avgRating || null,
        reviews: p.stats?.totalReviews || 0,
        price: price || null,
        profile: {
          bio: p.bio,
          experienceYears: p.experienceYears,
          headline: p.headline,
          subjects: p.subjects,
          stats: p.stats
        }
      };
    })
    .filter(Boolean);

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const paginatedDocs = matchedTeachers.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.status(200).json(new ApiResponse(200, {
    docs: paginatedDocs,
    totalDocs: matchedTeachers.length,
    limit: limitNum,
    page: pageNum,
    totalPages: Math.ceil(matchedTeachers.length / limitNum),
  }, 'Teachers fetched successfully'));
});