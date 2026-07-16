// ─────────────────────────────────────────────────────────────────────────────
// src/models/Document.model.js
// Teacher KYC documents (Aadhaar, bank passbook, degree, etc.)
// ─────────────────────────────────────────────────────────────────────────────
import mongoose             from 'mongoose';
import mongoosePaginate     from 'mongoose-paginate-v2';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { DOCUMENT_TYPE, DOCUMENT_STATUS } from '../constants/enums.js';
import {
  jsonTransform,
  toObjectOptions,
  urlValidator,
  enumField,
  auditSchema,
  defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

const documentSchema = new Schema(
  {
    teacherId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Teacher ID is required'],
      index:    true,
    },
    type:   enumField(DOCUMENT_TYPE, DOCUMENT_TYPE.AADHAAR),
    status: enumField(DOCUMENT_STATUS, DOCUMENT_STATUS.UPLOADED),
    // Storage
    fileUrl: {
      type:     String,
      required: [true, 'File URL is required'],
      trim:     true,
      validate: urlValidator,
    },
    s3Key: {
      type:   String,
      trim:   true,
      select: false,  // never expose raw storage key
    },
    mimeType: {
      type: String,
      trim: true,
      enum: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    },
    fileSizeBytes: {
      type: Number,
      min:  [0, 'File size cannot be negative'],
    },
    expiresAt: { type: Date,    default: null },
    isActive:  { type: Boolean, default: true, index: true },
    audit:   { type: auditSchema, default: () => ({}) },
    version: { type: Number, default: 1, min: 1 },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

documentSchema.plugin(mongoosePaginate);
documentSchema.plugin(mongooseLeanVirtuals);

documentSchema.index({ teacherId: 1, type: 1, isActive: 1 });
documentSchema.index({ status: 1, createdAt: -1 });
documentSchema.index({ teacherId: 1, status: 1 });
documentSchema.index({ expiresAt: 1 }, { sparse: true });

// ── Virtuals ──────────────────────────────────────────────────────────────────
documentSchema.virtual('isExpired').get(function () {
  return this.expiresAt ? this.expiresAt < new Date() : false;
});
documentSchema.virtual('isApproved').get(function () {
  return this.status === DOCUMENT_STATUS.APPROVED;
});

// ── Instance methods ──────────────────────────────────────────────────────────
documentSchema.methods.approve = async function (adminId, note = '') {
  this.status              = DOCUMENT_STATUS.APPROVED;
  this.isActive            = true;
  this.audit.reviewedBy    = adminId;
  this.audit.reviewedAt    = new Date();
  this.audit.reviewNote    = note;
  this.audit.adminAction   = 'approved';
  return this.save();
};

documentSchema.methods.reject = async function (adminId, reason) {
  if (!reason) throw new Error('Rejection reason is required');
  this.status            = DOCUMENT_STATUS.REJECTED;
  this.audit.reviewedBy  = adminId;
  this.audit.reviewedAt  = new Date();
  this.audit.reviewNote  = reason;
  this.audit.adminAction = 'rejected';
  return this.save();
};

// ── Static methods ─────────────────────────────────────────────────────────────
documentSchema.statics.getActiveByTeacher = function (teacherId) {
  return this.find({ teacherId, isActive: true }).sort({ type: 1, createdAt: -1 }).lean();
};

documentSchema.statics.isKycComplete = async function (teacherId) {
  const required = [DOCUMENT_TYPE.AADHAAR];
  const approved = await this.find({
    teacherId,
    type:     { $in: required },
    status:   DOCUMENT_STATUS.APPROVED,
    isActive: true,
  }).select('type').lean();
  const approvedTypes = approved.map((d) => d.type);
  return required.every((t) => approvedTypes.includes(t));
};

documentSchema.statics.pendingReviewQueue = function (options = {}) {
  return this.paginate(
    { status: DOCUMENT_STATUS.UPLOADED },
    {
      ...defaultPaginateOptions,
      sort:     { createdAt: 1 },
      populate: { path: 'teacherId', select: 'name phone email' },
      ...options,
    },
  );
};

// ── Pre-save: deactivate previous versions ────────────────────────────────────
documentSchema.pre('save', async function () {
  if (this.isNew) {
    await this.constructor.updateMany(
      { teacherId: this.teacherId, type: this.type, _id: { $ne: this._id }, isActive: true },
      { $set: { isActive: false } },
      { session: this.$session() }
    );
  }
});

documentSchema.query.approved = function () { return this.where({ status: DOCUMENT_STATUS.APPROVED }); };
documentSchema.query.active   = function () { return this.where({ isActive: true }); };

export const Document = mongoose.model('Document', documentSchema);