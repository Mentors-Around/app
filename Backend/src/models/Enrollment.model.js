// ─────────────────────────────────────────────────────────────────────────────
// src/models/Enrollment.model.js
//
// Created when a student pays the full classroom fee after query is accepted.
// Holds snapshot of fees paid and tracks student's progress in the classroom.
// ─────────────────────────────────────────────────────────────────────────────
import mongoose             from 'mongoose';
import mongoosePaginate     from 'mongoose-paginate-v2';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { ENROLLMENT_STATUS } from '../constants/enums.js';
import {
  jsonTransform,
  toObjectOptions,
  moneyField,
  enumField,
  defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

const enrollmentSchema = new Schema(
  {
    studentId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Student ID is required'],
      index:    true,
    },
    classroomId: {
      type:     Schema.Types.ObjectId,
      ref:      'Classroom',
      required: [true, 'Classroom ID is required'],
      index:    true,
    },
    teacherId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    queryId: {
      type:     Schema.Types.ObjectId,
      ref:      'EnrollmentQuery',
      required: true,
      unique:   true, // one enrollment per accepted query
      index:    true,
    },
    paymentId: {
      type:     Schema.Types.ObjectId,
      ref:      'Payment',
      required: true,
      unique:   true,
      index:    true,
    },
    // ── Fee snapshot ──────────────────────────────────────────────────────────
    feesPaidPaise:      { ...moneyField({ required: true }) },
    // 4% deposit teacher paid when accepting query (snapshot)
    teacherDepositPaise:{ ...moneyField() },
    // ── Status ────────────────────────────────────────────────────────────────
    status: enumField(ENROLLMENT_STATUS, ENROLLMENT_STATUS.ACTIVE),
    // ── Progress tracking ────────────────────────────────────────────────────
    // Classes attended (updated by attendance service)
    classesAttended:      { type: Number, default: 0, min: 0 },
    // Last date attendance was marked (used for idempotent daily tracking)
    lastAttendedAt:       { type: Date,   default: null },
    // Assignments completed by student
    assignmentsCompleted: { type: Number, default: 0, min: 0 },
    // ── Vote on early completion ──────────────────────────────────────────────
    earlyEndVote:   { type: Boolean, default: null },  // null = not voted
    earlyEndVotedAt:{ type: Date,    default: null },
    // ── Review ────────────────────────────────────────────────────────────────
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', default: null },
    // ── Payout tracking ───────────────────────────────────────────────────────
    payoutId:      { type: Schema.Types.ObjectId, ref: 'Payout', default: null },
    payoutSettled: { type: Boolean, default: false },
    // ── Drop/expel reason ─────────────────────────────────────────────────────
    exitReason: { type: String, trim: true, default: null },
    exitedAt:   { type: Date,   default: null },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

enrollmentSchema.plugin(mongoosePaginate);
enrollmentSchema.plugin(mongooseLeanVirtuals);

// ── Indexes ───────────────────────────────────────────────────────────────────
// One active enrollment per student per classroom
enrollmentSchema.index(
  { studentId: 1, classroomId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: ENROLLMENT_STATUS.ACTIVE },
  },
);
enrollmentSchema.index({ classroomId: 1, status: 1 });
enrollmentSchema.index({ teacherId: 1, status: 1, createdAt: -1 });
enrollmentSchema.index({ studentId: 1, status: 1, createdAt: -1 });
enrollmentSchema.index({ payoutSettled: 1, status: 1 }); // payout cron

// ── Virtuals ───────────────────────────────────────────────────────────────────
enrollmentSchema.virtual('feesRupees').get(function () {
  return this.feesPaidPaise / 100;
});

// ── Instance methods ──────────────────────────────────────────────────────────
enrollmentSchema.methods.drop = async function (reason = '') {
  this.status     = ENROLLMENT_STATUS.DROPPED;
  this.exitReason = reason;
  this.exitedAt   = new Date();
  return this.save();
};

enrollmentSchema.methods.castEarlyEndVote = async function (approve) {
  if (this.earlyEndVote !== null) throw new Error('Already voted');
  this.earlyEndVote    = approve;
  this.earlyEndVotedAt = new Date();
  return this.save();
};

// ── Static methods ─────────────────────────────────────────────────────────────
/**
 * Count votes for early completion (for a classroom's active enrollments).
 */
enrollmentSchema.statics.earlyEndVoteSummary = async function (classroomId) {
  const result = await this.aggregate([
    {
      $match: {
        classroomId: new mongoose.Types.ObjectId(classroomId),
        status:      ENROLLMENT_STATUS.ACTIVE,
      },
    },
    {
      $group: {
        _id:          null,
        total:        { $sum: 1 },
        approveCount: { $sum: { $cond: [{ $eq: ['$earlyEndVote', true] }, 1, 0] } },
        rejectCount:  { $sum: { $cond: [{ $eq: ['$earlyEndVote', false] }, 1, 0] } },
        notVoted:     { $sum: { $cond: [{ $eq: ['$earlyEndVote', null] }, 1, 0] } },
      },
    },
  ]);
  if (!result.length) return { total: 0, approveCount: 0, rejectCount: 0, notVoted: 0, approvalPercent: 0 };
  const r = result[0];
  r.approvalPercent = r.total > 0 ? Math.round((r.approveCount / r.total) * 100) : 0;
  return r;
};

/**
 * Student's enrolled classrooms - paginated dashboard view.
 */
enrollmentSchema.statics.studentDashboard = function (studentId, options = {}) {
  return this.paginate(
    { studentId, status: ENROLLMENT_STATUS.ACTIVE },
    {
      ...defaultPaginateOptions,
      sort:     { createdAt: -1 },
      populate: [
        { path: 'classroomId', select: 'title subject mode schedule status stats gmeetLink' },
        { path: 'teacherId', select: 'name avatarUrl' },
      ],
      ...options,
    },
  );
};

/**
 * All active enrollments for a classroom (for payout calculation).
 */
enrollmentSchema.statics.activeForClassroom = function (classroomId) {
  return this.find({ classroomId, status: ENROLLMENT_STATUS.ACTIVE })
    .select('studentId feesPaidPaise teacherDepositPaise payoutId payoutSettled')
    .lean();
};

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);