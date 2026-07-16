// ─────────────────────────────────────────────────────────────────────────────
// src/models/Report.model.js
//
// Students can report a teacher for:
//   - Not following schedule (missed classes)
//   - Abandoning the course
//   - Misconduct / inappropriate behaviour
//   - Other issues
//
// Admin reviews and determines action (warn, suspend, trigger refund, etc.).
// Multiple students can report the same teacher/classroom independently.
// ─────────────────────────────────────────────────────────────────────────────
import mongoose             from 'mongoose';
import mongoosePaginate     from 'mongoose-paginate-v2';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import {
  jsonTransform,
  toObjectOptions,
  auditSchema,
  enumField,
  defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

export const REPORT_REASON = Object.freeze({
  MISSED_CLASS:          'missed_class',
  SCHEDULE_VIOLATION:    'schedule_violation',
  COURSE_ABANDONED:      'course_abandoned',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  MISCONDUCT:            'misconduct',
  QUALITY_ISSUE:         'quality_issue',
  OTHER:                 'other',
});

export const REPORT_STATUS = Object.freeze({
  OPEN:        'open',
  UNDER_REVIEW:'under_review',
  RESOLVED:    'resolved',
  DISMISSED:   'dismissed',
});

export const ADMIN_ACTION_TAKEN = Object.freeze({
  WARNING_ISSUED:      'warning_issued',
  TEACHER_SUSPENDED:   'teacher_suspended',
  REFUND_TRIGGERED:    'refund_triggered',
  NO_ACTION:           'no_action',
  CLASSROOM_CLOSED:    'classroom_closed',
});

const reportSchema = new Schema(
  {
    // ── Reporter ───────────────────────────────────────────────────────────────
    // ── Reporter ───────────────────────────────────────────────────────────────
    reportedBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reporter (student) ID is required'],
      index:    true,
    },
    reporterId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: false,
    },
    // ── Subject of report ──────────────────────────────────────────────────────
    teacherId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Teacher ID is required'],
      index:    true,
    },
    targetId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: false,
    },
    targetType: {
      type:     String,
      required: false,
    },
    classroomId: {
      type:     Schema.Types.ObjectId,
      ref:      'Classroom',
      required: [true, 'Classroom ID is required'],
      index:    true,
    },
    enrollmentId: {
      type:     Schema.Types.ObjectId,
      ref:      'Enrollment',
      default:  null,
      index:    true,
    },
    // ── Report content ─────────────────────────────────────────────────────────
    reason: {
      type:     String,
      enum:     { values: Object.values(REPORT_REASON), message: '{VALUE} is not a valid reason' },
      required: [true, 'Report reason is required'],
    },
    reportType: {
      type:     String,
      required: false,
    },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      trim:      true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    evidenceUrls: {
      type:    [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5 && arr.every((u) => /^https?:\/\/.+/.test(u)),
        message:   'Max 5 evidence URLs, all must be valid',
      },
    },
    // Specific class/date the issue occurred (optional)
    incidentDate: { type: Date, default: null },
    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    Object.values(REPORT_STATUS),
      default: REPORT_STATUS.OPEN,
      index:   true,
    },
    // ── Admin resolution ───────────────────────────────────────────────────────
    adminActionTaken: {
      type:    String,
      enum:    [...Object.values(ADMIN_ACTION_TAKEN), null],
      default: null,
    },
    adminNote:  { type: String, trim: true, default: null },
    resolvedAt: { type: Date,   default: null, index: true },
    // If refund was triggered, link it
    refundRequestId: {
      type:    Schema.Types.ObjectId,
      ref:     'RefundRequest',
      default: null,
    },
    audit: { type: auditSchema, default: () => ({}) },
    // ── Reporter notification ──────────────────────────────────────────────────
    reporterNotified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

reportSchema.pre('validate', async function () {
  if (!this.reportedBy && this.reporterId) {
    this.reportedBy = this.reporterId;
  } else if (!this.reporterId && this.reportedBy) {
    this.reporterId = this.reportedBy;
  }
  if (!this.teacherId && this.targetId) {
    this.teacherId = this.targetId;
  } else if (!this.targetId && this.teacherId) {
    this.targetId = this.teacherId;
  }
  if (!this.reason && this.reportType) {
    // Normalize reportType to match reason enum if possible
    const val = this.reportType.toLowerCase().replace(/[\s_]+/g, '_');
    const matched = Object.values(REPORT_REASON).find(r => r.toLowerCase().replace(/[\s_]+/g, '_') === val);
    if (matched) {
      this.reason = matched;
    } else {
      this.reason = REPORT_REASON.OTHER;
    }
  } else if (!this.reportType && this.reason) {
    this.reportType = this.reason;
  }
});

reportSchema.plugin(mongoosePaginate);
reportSchema.plugin(mongooseLeanVirtuals);

// ── Indexes ───────────────────────────────────────────────────────────────────
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ teacherId: 1, status: 1 });
reportSchema.index({ classroomId: 1, status: 1 });
reportSchema.index({ reportedBy: 1, classroomId: 1 });
// Prevent spam: one open report per student per classroom per reason
reportSchema.index(
  { reportedBy: 1, classroomId: 1, reason: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['open', 'under_review'] } },
  },
);

// ── Virtuals ───────────────────────────────────────────────────────────────────
reportSchema.virtual('isResolved').get(function () {
  return [REPORT_STATUS.RESOLVED, REPORT_STATUS.DISMISSED].includes(this.status);
});

// ── Instance methods ──────────────────────────────────────────────────────────
reportSchema.methods.markUnderReview = async function (adminId) {
  this.status            = REPORT_STATUS.UNDER_REVIEW;
  this.audit.reviewedBy  = adminId;
  this.audit.reviewedAt  = new Date();
  this.audit.adminAction = 'under_review';
  return this.save();
};

reportSchema.methods.resolve = async function ({
  adminId,
  actionTaken,
  note,
  refundRequestId = null,
}) {
  this.status            = REPORT_STATUS.RESOLVED;
  this.adminActionTaken  = actionTaken;
  this.adminNote         = note;
  this.resolvedAt        = new Date();
  this.refundRequestId   = refundRequestId;
  this.audit.reviewedBy  = adminId;
  this.audit.reviewedAt  = new Date();
  this.audit.adminAction = actionTaken;
  this.audit.reviewNote  = note;
  return this.save();
};

reportSchema.methods.dismiss = async function (adminId, note) {
  this.status            = REPORT_STATUS.DISMISSED;
  this.adminActionTaken  = ADMIN_ACTION_TAKEN.NO_ACTION;
  this.adminNote         = note;
  this.resolvedAt        = new Date();
  this.audit.reviewedBy  = adminId;
  this.audit.reviewedAt  = new Date();
  this.audit.adminAction = 'dismissed';
  this.audit.reviewNote  = note;
  return this.save();
};

// ── Static methods ─────────────────────────────────────────────────────────────
reportSchema.statics.openQueue = function (options = {}) {
  return this.paginate(
    { status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.UNDER_REVIEW] } },
    {
      ...defaultPaginateOptions,
      sort: { createdAt: 1 },
      populate: [
        { path: 'reportedBy',  select: 'name phone' },
        { path: 'teacherId',   select: 'name phone' },
        { path: 'classroomId', select: 'title subject' },
      ],
      ...options,
    },
  );
};

/**
 * Aggregate: reports grouped by classroom — used to flag high-risk classrooms.
 */
reportSchema.statics.classroomRiskSummary = function () {
  return this.aggregate([
    { $match: { status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.UNDER_REVIEW] } } },
    {
      $group: {
        _id:        '$classroomId',
        reportCount:{ $sum: 1 },
        reasons:    { $addToSet: '$reason' },
      },
    },
    { $match: { reportCount: { $gte: 2 } } }, // flag classrooms with 2+ open reports
    { $sort:  { reportCount: -1 } },
    {
      $lookup: {
        from:         'classrooms',
        localField:   '_id',
        foreignField: '_id',
        as:           'classroom',
        pipeline:     [{ $project: { title: 1, teacherId: 1, status: 1 } }],
      },
    },
    { $unwind: { path: '$classroom', preserveNullAndEmptyArrays: true } },
  ]);
};

export const Report = mongoose.model('Report', reportSchema);