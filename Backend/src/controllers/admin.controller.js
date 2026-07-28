// src/controllers/admin.controller.js
import mongoose from 'mongoose';
import {
  User, TeacherProfile, Document, Classroom,
  Payment, EnrollmentQuery, Enrollment, Report,
  ExtraClass, Review, SystemSettings,
} from '../models/index.js';
import { NotificationService } from '../services/notification.service.js';
import { EmailService }        from '../services/email.service.js';
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
      { $set: { verificationStatus: VERIFICATION_STATUS.APPROVED, verifiedAt: new Date(), verifiedBy: req.user._id, rejectionReason: null } },
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

    // Send email notifications
    EmailService.send({
      to: user.email,
      subject: 'Your TrueEd Teacher Account KYC is Approved! 🎉',
      html: `<!DOCTYPE html><html><body>
        <h2>Congratulations ${user.name}!</h2>
        <p>We are pleased to inform you that your KYC verification request has been reviewed and <strong>approved</strong> by our admin team.</p>
        <p>You can now log in, access all teacher features, and start creating classrooms on the platform.</p>
        <br/><p>Warm regards,<br/>The TrueEd Team</p>
      </body></html>`,
      text: `Congratulations ${user.name}! Your KYC verification has been approved. You can now access all features and create classrooms.`
    }).catch(() => {});

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

  const user = await User.findById(teacherId).select('phone name email');
  if (!user) throw ApiError.notFound('Teacher user');

  // Send rejection email first
  await EmailService.send({
    to: user.email,
    subject: 'Your TrueEd KYC Verification has been Rejected',
    html: `<!DOCTYPE html><html><body>
      <h2>Dear ${user.name},</h2>
      <p>We regret to inform you that your KYC verification request was rejected by our admin team for the following reason:</p>
      <blockquote style="background:#f9f9f9;border-left:5px solid #ccc;margin:1.5em 10px;padding:0.5em 10px;">${reason}</blockquote>
      <p>Consequently, your teacher account creation has failed. You will need to sign up again and submit your documents with the correct details.</p>
      <br/><p>Warm regards,<br/>The TrueEd Team</p>
    </body></html>`,
    text: `Dear ${user.name}, your KYC verification was rejected for the following reason: ${reason}. Your account creation has failed, and you need to sign up again and submit correct details.`
  }).catch(() => {});

  // Then delete User and TeacherProfile records so they can sign up again
  await TeacherProfile.findOneAndDelete({ userId: teacherId });
  await User.findByIdAndDelete(teacherId);

  res.status(200).json(new ApiResponse(200, null, 'Teacher application rejected and account removed'));
});

export const getAllTeachers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (status) {
    filter.verificationStatus = status;
  }
  if (search) {
    const users = await User.find({
      role: 'teacher',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    const userIds = users.map(u => u._id);
    filter.userId = { $in: userIds };
  }

  const result = await TeacherProfile.paginate(filter, {
    page: Number(page), limit: Math.min(Number(limit), 50),
    populate: [
      { path: 'userId', select: 'name phone email kycStatus isActive isBanned createdAt' },
      { path: 'verifiedBy', select: 'name email username' }
    ],
    sort: { createdAt: -1 },
    select: '-adminNotes -bankAccount.accountNumber -aadhaarNumber',
  });
  res.status(200).json(new ApiResponse(200, result, 'Teachers'));
});

export const suspendTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const reason = req.body?.reason || 'Administrative suspension';

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
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const result = await User.paginate(filter, {
    page: Number(page), limit: Math.min(Number(limit), 100),
    sort: { createdAt: -1 },
    select: '-fcmTokens -passwordHash -mfaSecret',
  });

  const StudentWallet = mongoose.model('StudentWallet');
  const TeacherProfile = mongoose.model('TeacherProfile');
  const Enrollment = mongoose.model('Enrollment');

  const rawDocs = result?.results || result?.docs || [];

  const docsWithDetails = await Promise.all(
    rawDocs.map(async (uDoc) => {
      const u = typeof uDoc.toObject === 'function' ? uDoc.toObject() : uDoc;
      if (u.role === 'student' || !u.role) {
        const wallet = await StudentWallet.findOne({ studentId: u._id }).lean();
        const count = await Enrollment.countDocuments({ studentId: u._id, status: { $in: ['active', 'enrolled'] } });
        u.walletBalanceRs = wallet ? (wallet.cashBalancePaise || 0) / 100 : 0;
        u.queryTokens = wallet ? (wallet.tokenBalance ?? 0) : 0;
        u.classroomsCount = count || 0;
      } else if (u.role === 'teacher') {
        const profile = await TeacherProfile.findOne({ userId: u._id }).lean();
        const count = await Classroom.countDocuments({ teacherId: u._id, status: 'active' });
        u.walletBalanceRs = profile ? (profile.walletPaise || 0) / 100 : 0;
        u.queryTokens = 0;
        u.classroomsCount = count || 0;
        u.teacherProfile = profile || null;
      }
      return u;
    })
  );

  result.docs = docsWithDetails;
  result.results = docsWithDetails;
  res.status(200).json(new ApiResponse(200, result, 'Users'));
});

export const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const reason = req.body?.reason || 'Administrative suspension';

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
export const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (search) {
    filter.comment = { $regex: search, $options: 'i' };
  }

  const result = await Review.paginate(filter, {
    page: Number(page),
    limit: Math.min(Number(limit), 50),
    sort: { createdAt: -1 },
    populate: [
      { path: 'studentId', select: 'name email avatarUrl' },
      { path: 'teacherId', select: 'name email avatarUrl' },
      { path: 'classroomId', select: 'title subject' },
    ],
  });

  res.status(200).json(new ApiResponse(200, result, 'Platform reviews'));
});

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
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [userStats, classroomStats, paymentStats, openReportsCount, todayRevenueAgg, monthRevenueAgg, monthlyTrendAgg] = await Promise.all([
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
    Report.countDocuments({ status: { $in: ['open', 'under_review'] } }),
    Payment.aggregate([
      { $match: { status: 'captured', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$totalAmountPaise' } } }
    ]),
    Payment.aggregate([
      { $match: { status: 'captured', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmountPaise' } } }
    ]),
    Payment.aggregate([
      { $match: { status: 'captured' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          revenuePaise: { $sum: '$totalAmountPaise' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = now.getMonth();
  const monthlyRevenueTrend = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonthIdx - i;
    let y = now.getFullYear();
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    const found = monthlyTrendAgg.find(item => item._id.month === (m + 1) && item._id.year === y);
    monthlyRevenueTrend.push({
      name: monthNames[m],
      revenue: found ? Math.round(found.revenuePaise / 100) : 0
    });
  }

  const todayRevenue = todayRevenueAgg.length ? Math.round(todayRevenueAgg[0].total / 100) : 0;
  const monthlyRevenue = monthRevenueAgg.length ? Math.round(monthRevenueAgg[0].total / 100) : 0;

  res.status(200).json(new ApiResponse(200, {
    userStats,
    classroomStats,
    paymentStats,
    openReportsCount,
    todayRevenue,
    monthlyRevenue,
    monthlyRevenueTrend
  }, 'Platform stats'));
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
      select:   'userId bio headline experienceYears education stats',
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

// ── System Settings ───────────────────────────────────────────────────────────
export const getSystemSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.getSettings();
  res.status(200).json(new ApiResponse(200, settings, 'System settings retrieved'));
});

export const updateSystemSettings = asyncHandler(async (req, res) => {
  const { platformFeePercent, minWithdrawalRupees, queryTokenPriceRupees, maintenanceMode } = req.body;

  auditLog(req, 'UPDATE_SYSTEM_SETTINGS', req.body);

  const settings = await SystemSettings.getSettings();

  if (platformFeePercent !== undefined) settings.platformFeePercent = platformFeePercent;
  if (minWithdrawalRupees !== undefined) settings.minWithdrawalRupees = minWithdrawalRupees;
  if (queryTokenPriceRupees !== undefined) settings.queryTokenPriceRupees = queryTokenPriceRupees;
  if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;

  await settings.save();

  res.status(200).json(new ApiResponse(200, settings, 'System settings updated successfully'));
});