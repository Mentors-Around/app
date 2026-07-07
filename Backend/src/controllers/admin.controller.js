// src/controllers/admin.controller.js
import mongoose from 'mongoose';
import {
  User, TeacherProfile, Document, Classroom,
  Payment, EnrollmentQuery, Enrollment, Report,
  ExtraClass, Review,
} from '../models/index.js';
import { NotificationService } from '../services/notification.service.js';
import { asyncHandler }        from '../utils/AsyncHandler.js';
import ApiError                from '../utils/ApiError.js';
import ApiResponse             from '../utils/ApiResponse.js';
import { VERIFICATION_STATUS, CLASSROOM_STATUS } from '../constants/enums.js';
import logger                  from '../config/logger.config.js';

// ── Audit log helper ──────────────────────────────────────────────────────────
const auditLog = (req, action, payload = {}) => {
  logger.warn('ADMIN_ACTION', {
    adminId:       req.user._id,
    action,
    correlationId: req.correlationId,
    payload,
  });
};

// ── Teacher Management ────────────────────────────────────────────────────────

export const getPendingTeachers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await TeacherProfile.pendingVerification({ page: Number(page), limit: Number(limit) });
  res.status(200).json(new ApiResponse(200, result, 'Pending teachers'));
});

export const approveTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  auditLog(req, 'APPROVE_TEACHER', { teacherId });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const profile = await TeacherProfile.findOneAndUpdate(
      { userId: teacherId },
      { $set: { verificationStatus: VERIFICATION_STATUS.APPROVED, verifiedAt: new Date(), rejectionReason: null } },
      { new: true, session },
    );
    if (!profile) throw ApiError.notFound('Teacher profile');

    const user = await User.findByIdAndUpdate(
      teacherId,
      { $set: { isVerificationPending: false, kycStatus: 'approved' } },
      { new: true, session },
    );
    if (!user) throw ApiError.notFound('Teacher user');

    await session.commitTransaction();

    // Non-blocking notification
    NotificationService.notifyTeacherApproved(user).catch(() => {});

    res.status(200).json(new ApiResponse(200, null, 'Teacher approved'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

export const rejectTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const { reason }    = req.body;
  if (!reason?.trim()) throw ApiError.badRequest('Rejection reason is required');

  auditLog(req, 'REJECT_TEACHER', { teacherId, reason });

  // DO NOT deactivate account — teacher can resubmit KYC
  await Promise.all([
    TeacherProfile.findOneAndUpdate(
      { userId: teacherId },
      { $set: { verificationStatus: VERIFICATION_STATUS.REJECTED, rejectionReason: reason, adminNotes: reason } },
    ),
    User.findByIdAndUpdate(teacherId, { $set: { kycStatus: 'rejected' } }),
  ]);

  const user = await User.findById(teacherId).select('phone name');
  NotificationService.notifyTeacherRejected(user, reason).catch(() => {});

  res.status(200).json(new ApiResponse(200, null, 'Teacher application rejected'));
});

export const getAllTeachers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const filter = { verificationStatus: status || { $exists: true } };
  if (search) filter['$text'] = { $search: search };

  const result = await TeacherProfile.paginate(filter, {
    page: Number(page), limit: Math.min(Number(limit), 50),
    populate: { path: 'userId', select: 'name phone email kycStatus isActive isBanned createdAt' },
    sort: { createdAt: -1 },
    select: '-adminNotes -bankAccount.accountNumber -aadhaarNumber',
  });
  res.status(200).json(new ApiResponse(200, result, 'Teachers'));
});

export const suspendTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const { reason }    = req.body;
  if (!reason) throw ApiError.badRequest('Reason required');

  auditLog(req, 'SUSPEND_TEACHER', { teacherId, reason });

  const user = await User.findById(teacherId);
  if (!user) throw ApiError.notFound('Teacher');
  await user.ban(reason);

  res.status(200).json(new ApiResponse(200, null, 'Teacher suspended'));
});

// ── Document Review ───────────────────────────────────────────────────────────

export const getPendingDocuments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await Document.pendingReviewQueue({ page: Number(page), limit: Number(limit) });
  res.status(200).json(new ApiResponse(200, result, 'Pending documents'));
});

export const approveDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note = '' } = req.body;
  auditLog(req, 'APPROVE_DOCUMENT', { documentId: id });

  const doc = await Document.findById(id);
  if (!doc) throw ApiError.notFound('Document');

  await doc.approve(req.user._id, note);
  res.status(200).json(new ApiResponse(200, null, 'Document approved'));
});

export const rejectDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) throw ApiError.badRequest('Rejection reason required');

  auditLog(req, 'REJECT_DOCUMENT', { documentId: id, reason });

  const doc = await Document.findById(id);
  if (!doc) throw ApiError.notFound('Document');
  await doc.reject(req.user._id, reason);

  res.status(200).json(new ApiResponse(200, null, 'Document rejected'));
});

// ── Extra Class Approval ──────────────────────────────────────────────────────

export const getPendingExtraClasses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await ExtraClass.pendingQueue({ page: Number(page), limit: Number(limit) });
  res.status(200).json(new ApiResponse(200, result, 'Pending extra class requests'));
});

export const approveExtraClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note = '' } = req.body;
  auditLog(req, 'APPROVE_EXTRA_CLASS', { extraClassId: id });

  const ec = await ExtraClass.findById(id).populate('teacherId', 'phone');
  if (!ec) throw ApiError.notFound('Extra class request');
  await ec.approve(req.user._id, note);

  res.status(200).json(new ApiResponse(200, null, 'Extra class approved'));
});

export const rejectExtraClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) throw ApiError.badRequest('Rejection reason required');

  auditLog(req, 'REJECT_EXTRA_CLASS', { extraClassId: id, reason });

  const ec = await ExtraClass.findById(id);
  if (!ec) throw ApiError.notFound('Extra class request');
  await ec.reject(req.user._id, reason);

  res.status(200).json(new ApiResponse(200, null, 'Extra class rejected'));
});

// ── Reports / Disputes ────────────────────────────────────────────────────────

export const getOpenReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await Report.openQueue({ page: Number(page), limit: Number(limit) });
  res.status(200).json(new ApiResponse(200, result, 'Open reports'));
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actionTaken, note } = req.body;
  if (!actionTaken || !note) throw ApiError.badRequest('actionTaken and note are required');

  auditLog(req, 'RESOLVE_REPORT', { reportId: id, actionTaken });

  const report = await Report.findById(id);
  if (!report) throw ApiError.notFound('Report');
  await report.resolve({ adminId: req.user._id, actionTaken, note });

  res.status(200).json(new ApiResponse(200, null, 'Report resolved'));
});

export const dismissReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  if (!note) throw ApiError.badRequest('Note required');

  auditLog(req, 'DISMISS_REPORT', { reportId: id });

  const report = await Report.findById(id);
  if (!report) throw ApiError.notFound('Report');
  await report.dismiss(req.user._id, note);

  res.status(200).json(new ApiResponse(200, null, 'Report dismissed'));
});

export const getClassroomRiskSummary = asyncHandler(async (req, res) => {
  const summary = await Report.classroomRiskSummary();
  res.status(200).json(new ApiResponse(200, summary, 'Risk summary'));
});

// ── Refund Management ─────────────────────────────────────────────────────────
export const approveManualRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Admin manual refund' } = req.body;
  auditLog(req, 'APPROVE_MANUAL_REFUND', { paymentId: id, reason });

  const payment = await Payment.findById(id);
  if (!payment) throw ApiError.notFound('Payment');

  // Manual override — admin has reviewed edge case
  payment.escrowStatus        = 'released';
  payment.escrowReleasedAt    = new Date();
  payment.escrowReleaseReason = reason;
  await payment.save();

  res.status(200).json(new ApiResponse(200, null, 'Refund approved'));
});

// ── Classroom Oversight ───────────────────────────────────────────────────────
export const getAllClassrooms = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const result = await Classroom.paginate(filter, {
    page: Number(page), limit: Math.min(Number(limit), 50),
    sort: { createdAt: -1 },
    populate: { path: 'teacherId', select: 'name phone' },
  });
  res.status(200).json(new ApiResponse(200, result, 'Classrooms'));
});

export const cancelClassroom = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { reason }      = req.body;
  if (!reason) throw ApiError.badRequest('Reason required');

  auditLog(req, 'CANCEL_CLASSROOM', { classroomId, reason });

  await Classroom.findByIdAndUpdate(classroomId, {
    status: CLASSROOM_STATUS.CANCELLED,
    adminNotes: reason,
  });

  res.status(200).json(new ApiResponse(200, null, 'Classroom cancelled'));
});

// ── Users oversight ───────────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const filter = { deletedAt: null };
  if (role)   filter.role = role;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const result = await User.paginate(filter, {
    page: Number(page), limit: Math.min(Number(limit), 100),
    sort: { createdAt: -1 },
    select: '-fcmTokens -passwordHash -mfaSecret',
  });
  res.status(200).json(new ApiResponse(200, result, 'Users'));
});

export const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  if (!reason) throw ApiError.badRequest('Reason required');

  auditLog(req, 'BAN_USER', { userId, reason });

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');
  await user.ban(reason);

  res.status(200).json(new ApiResponse(200, null, 'User banned'));
});

export const unbanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  auditLog(req, 'UNBAN_USER', { userId });

  await User.findByIdAndUpdate(userId, {
    isBanned:  false,
    banReason: null,
    isActive:  true,
  });

  res.status(200).json(new ApiResponse(200, null, 'User unbanned'));
});

// ── Review Moderation ─────────────────────────────────────────────────────────
export const hideReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reason }   = req.body;

  auditLog(req, 'HIDE_REVIEW', { reviewId, reason });

  const review = await Review.findByIdAndUpdate(reviewId, {
    isVisible: false,
    adminNote: reason,
  }, { new: true });

  if (!review) throw ApiError.notFound('Review');
  await Review.updateStats(review.teacherId, review.classroomId);

  res.status(200).json(new ApiResponse(200, null, 'Review hidden'));
});

// ── Platform Stats ────────────────────────────────────────────────────────────
export const getPlatformStats = asyncHandler(async (req, res) => {
  const [userStats, classroomStats, paymentStats] = await Promise.all([
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ]),
    Classroom.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: '$purpose', totalPaise: { $sum: '$totalAmountPaise' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.status(200).json(new ApiResponse(200, { userStats, classroomStats, paymentStats }, 'Platform stats'));
});
// ── Top Teachers ──────────────────────────────────────────────────────────────
// Returns teachers ranked by average rating, total students, and total classrooms
export const getTopTeachers = asyncHandler(async (req, res) => {
  const { limit = 20, page = 1 } = req.query;

  const result = await TeacherProfile.paginate(
    { verificationStatus: VERIFICATION_STATUS.APPROVED },
    {
      page:     Number(page),
      limit:    Math.min(Number(limit), 50),
      sort:     { 'stats.avgRating': -1, 'stats.totalStudentsTaught': -1, 'stats.totalClassrooms': -1 },
      populate: { path: 'userId', select: 'name avatarUrl email phone createdAt' },
      select:   '-adminNotes -bankAccount -aadhaarNumber -kycDocumentIds',
    },
  );

  res.status(200).json(new ApiResponse(200, result, 'Top teachers'));
});

// ── Reports Dashboard ─────────────────────────────────────────────────────────
export const getReportsDashboard = asyncHandler(async (req, res) => {
  auditLog(req, 'VIEW_REPORTS_DASHBOARD', {});

  const [byStatus, byType, recent] = await Promise.all([
    Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Report.aggregate([
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
    ]),
    Report.find({ status: { $in: ['open', 'under_review'] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('reporterId', 'name role')
      .lean(),
  ]);

  res.status(200).json(new ApiResponse(200, { byStatus, byType, recent }, 'Reports dashboard'));
});