// src/models/Enrollmentquery.model.js
import mongoose             from 'mongoose';
import mongoosePaginate     from 'mongoose-paginate-v2';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { QUERY_STATUS }     from '../constants/enums.js';
import {
  jsonTransform, toObjectOptions, moneyField, enumField, defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

// Updated: 24-hour deadlines (was 5 days)
const TEACHER_RESPONSE_DEADLINE_MS = 24 * 60 * 60 * 1000; // 24 hours
const STUDENT_ENROLL_DEADLINE_MS   = 24 * 60 * 60 * 1000; // 24 hours

const enrollmentQuerySchema = new Schema(
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
      required: [true, 'Teacher ID is required'],
      index:    true,
    },

    status: enumField(QUERY_STATUS, QUERY_STATUS.PENDING),

    // ── Token tracking ─────────────────────────────────────────────────────────
    tokensSpent:   { type: Number, default: 1, min: 1 },
    tokenRefunded: { type: Boolean, default: false },

    // ── Student's message to teacher (optional, PII-filtered) ─────────────────
    message: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default:   '',
    },

    // ── Teacher's optional response message (PII-filtered on write) ────────────
    teacherMessage: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Teacher message cannot exceed 500 characters'],
      default:   null,
    },

    // ── Deadlines (24-hour windows) ────────────────────────────────────────────
    teacherResponseDeadline: {
      type:    Date,
      default: () => new Date(Date.now() + TEACHER_RESPONSE_DEADLINE_MS),
      index:   true,
    },
    studentEnrollDeadline: {
      type:    Date,
      default: null,
      index:   true,
    },

    // ── Response tracking ──────────────────────────────────────────────────────
    respondedAt:     { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: null },

    // ── Teacher deposit (4% of classroom fee) ─────────────────────────────────
    teacherDepositPaise:    { ...moneyField() },
    teacherDepositPaid:     { type: Boolean, default: false },
    teacherDepositRefunded: { type: Boolean, default: false },

    // ── Enrollment link ────────────────────────────────────────────────────────
    enrollmentId: {
      type:    Schema.Types.ObjectId,
      ref:     'Enrollment',
      default: null,
      index:   true,
    },

    // ── Chat/Messages under the query ──────────────────────────────────────────
    messages: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text:     { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    // ── Archiving ──────────────────────────────────────────────────────────────
    isArchivedByStudent: { type: Boolean, default: false },
    isArchivedByTeacher: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

enrollmentQuerySchema.plugin(mongoosePaginate);
enrollmentQuerySchema.plugin(mongooseLeanVirtuals);

// ── Indexes ───────────────────────────────────────────────────────────────────
enrollmentQuerySchema.index(
  { studentId: 1, classroomId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } },
  },
);
enrollmentQuerySchema.index({ teacherId: 1, status: 1, createdAt: -1 });
enrollmentQuerySchema.index({ studentId: 1, status: 1, createdAt: -1 });
enrollmentQuerySchema.index({ status: 1, teacherResponseDeadline: 1 });
enrollmentQuerySchema.index({ status: 1, studentEnrollDeadline: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
enrollmentQuerySchema.virtual('isTeacherResponseOverdue').get(function () {
  return this.status === QUERY_STATUS.PENDING && this.teacherResponseDeadline < new Date();
});
enrollmentQuerySchema.virtual('isStudentEnrollOverdue').get(function () {
  return (
    this.status === QUERY_STATUS.ACCEPTED &&
    this.studentEnrollDeadline &&
    this.studentEnrollDeadline < new Date()
  );
});
// Time remaining for teacher to respond (ms, negative = overdue)
enrollmentQuerySchema.virtual('teacherResponseTimeRemaining').get(function () {
  if (this.status !== QUERY_STATUS.PENDING) return null;
  return this.teacherResponseDeadline - new Date();
});
// Time remaining for student to enroll (ms, negative = overdue)
enrollmentQuerySchema.virtual('studentEnrollTimeRemaining').get(function () {
  if (this.status !== QUERY_STATUS.ACCEPTED || !this.studentEnrollDeadline) return null;
  return this.studentEnrollDeadline - new Date();
});

// ── Instance methods ──────────────────────────────────────────────────────────
enrollmentQuerySchema.methods.accept = async function (teacherDepositPaise, teacherMessage = null) {
  if (this.status !== QUERY_STATUS.PENDING) {
    throw new Error(`Cannot accept query in status: ${this.status}`);
  }
  this.status                = QUERY_STATUS.ACCEPTED;
  this.respondedAt           = new Date();
  this.teacherDepositPaise   = teacherDepositPaise;
  this.teacherDepositPaid    = true;
  this.teacherMessage        = teacherMessage;
  this.studentEnrollDeadline = new Date(Date.now() + STUDENT_ENROLL_DEADLINE_MS);
  return this.save();
};

enrollmentQuerySchema.methods.reject = async function (reason = '', teacherMessage = null) {
  if (this.status !== QUERY_STATUS.PENDING) {
    throw new Error(`Cannot reject query in status: ${this.status}`);
  }
  this.status          = QUERY_STATUS.REJECTED;
  this.respondedAt     = new Date();
  this.rejectionReason = reason;
  this.teacherMessage  = teacherMessage;
  return this.save();
};

enrollmentQuerySchema.methods.expire = async function () {
  this.status = QUERY_STATUS.EXPIRED;
  return this.save();
};

enrollmentQuerySchema.methods.lapse = async function () {
  this.status = QUERY_STATUS.LAPSED;
  return this.save();
};

enrollmentQuerySchema.methods.markEnrolled = async function (enrollmentId) {
  this.status       = QUERY_STATUS.ENROLLED;
  this.enrollmentId = enrollmentId;
  return this.save();
};

// ── Static methods ─────────────────────────────────────────────────────────────
enrollmentQuerySchema.statics.overdueForTeacher = function () {
  return this.find({
    status:                  QUERY_STATUS.PENDING,
    teacherResponseDeadline: { $lt: new Date() },
  }).lean();
};

enrollmentQuerySchema.statics.overdueForStudent = function () {
  return this.find({
    status:                QUERY_STATUS.ACCEPTED,
    studentEnrollDeadline: { $lt: new Date() },
    enrollmentId:          null,
  }).lean();
};

enrollmentQuerySchema.statics.findActiveQuery = function (studentId, classroomId) {
  return this.findOne({
    studentId,
    classroomId,
    status: { $in: [QUERY_STATUS.PENDING, QUERY_STATUS.ACCEPTED] },
  });
};

/**
 * Teacher query tab counts.
 * Maps internal statuses to UI tab names:
 *   active   = pending (waiting for teacher response)
 *   accepted = accepted (student yet to enroll)
 *   enrolled = enrolled
 *   rejected = rejected
 *   expired  = expired (teacher didn't respond in 24h)
 *   refunded = lapsed  (student didn't enroll in 24h → teacher got 4% back)
 */
enrollmentQuerySchema.statics.teacherQueryCounts = async function (teacherId) {
  const counts = await this.aggregate([
    { $match: { teacherId: new mongoose.Types.ObjectId(teacherId), isArchivedByTeacher: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const archivedCount = await this.countDocuments({ teacherId, isArchivedByTeacher: true });

  const map = { active: 0, accepted: 0, enrolled: 0, rejected: 0, expired: 0, refunded: 0, archived: archivedCount };
  counts.forEach(({ _id, count }) => {
    const label = _id === 'pending' ? 'active' : _id === 'lapsed' ? 'refunded' : _id;
    if (label in map) map[label] = count;
  });
  return map;
};

/**
 * Student query tab counts.
 *   active   = pending
 *   accepted = accepted (yet to enroll)
 *   enrolled = enrolled
 *   rejected = rejected by teacher OR teacher didn't respond in 24h (status: expired)
 *   expired  = lapsed — accepted by teacher but student didn't enroll in 24h
 */
enrollmentQuerySchema.statics.studentQueryCounts = async function (studentId) {
  const counts = await this.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId), isArchivedByStudent: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const archivedCount = await this.countDocuments({ studentId, isArchivedByStudent: true });

  const map = { active: 0, accepted: 0, enrolled: 0, rejected: 0, expired: 0, archived: archivedCount };
  counts.forEach(({ _id, count }) => {
    // NOTE: internal status "expired" (teacher no-response) maps to student tab "rejected";
    // internal status "lapsed" (student didn't enroll in time) maps to student tab "expired".
    const label =
      _id === 'pending' ? 'active' :
      _id === 'lapsed'  ? 'expired' :
      _id === 'expired' ? 'rejected' :
      _id;
    if (label in map) map[label] = count;
  });
  return map;
};

export const EnrollmentQuery = mongoose.model('EnrollmentQuery', enrollmentQuerySchema);