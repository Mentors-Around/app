// ─────────────────────────────────────────────────────────────────────────────
// src/models/Payment.model.js
// Refactored to support tight compound indices for teacher deposit settlement.
// ─────────────────────────────────────────────────────────────────────────────
import mongoose                  from 'mongoose';
import mongoosePaginate          from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongooseLeanVirtuals      from 'mongoose-lean-virtuals';
import { PAYMENT_STATUS, PAYMENT_PURPOSE, ESCROW_STATUS } from '../constants/enums.js';
import {
  jsonTransform,
  toObjectOptions,
  moneyField,
  enumField,
  defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

const webhookEventSchema = new Schema(
  {
    event:      { type: String, required: true },
    receivedAt: { type: Date,   default: Date.now },
    payload:    { type: Schema.Types.Mixed },
    processed:  { type: Boolean, default: false },
  },
  { _id: true },
);

const refundLogSchema = new Schema(
  {
    razorpayRefundId: { type: String, required: true },
    amountPaise:      moneyField({ required: true }),
    reason:           { type: String, trim: true },
    status:           { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    initiatedAt:      { type: Date, default: Date.now },
    settledAt:        { type: Date, default: null },
  },
  { _id: true },
);

const paymentSchema = new Schema(
  {
    purpose: enumField(PAYMENT_PURPOSE, PAYMENT_PURPOSE.ENROLLMENT_FEE),
    payerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    classroomId: {
      type:    Schema.Types.ObjectId,
      ref:     'Classroom',
      default: null,
      index:   true,
    },
    enrollmentId: {
      type:    Schema.Types.ObjectId,
      ref:     'Enrollment',
      default: null,
      index:   true,
    },
    queryId: {
      type:    Schema.Types.ObjectId,
      ref:     'EnrollmentQuery',
      default: null,
      index:   true,
    },
    teacherId: {
      type:    Schema.Types.ObjectId,
      ref:     'User',
      default: null,
      index:   true,
    },
    razorpayOrderId: {
      type:   String,
      trim:   true,
      unique: true,
      sparse: true,
      index:  true,
    },
    razorpayPaymentId: {
      type:   String,
      trim:   true,
      unique: true,
      sparse: true,
      index:  true,
    },
    razorpaySignature: {
      type:   String,
      trim:   true,
      select: false,
    },
    status:       enumField(PAYMENT_STATUS, PAYMENT_STATUS.CREATED),
    escrowStatus: {
      type:    String,
      enum:    Object.values(ESCROW_STATUS),
      default: null,
    },
    totalAmountPaise:    { ...moneyField({ required: true }) },
    refundedAmountPaise: { ...moneyField() },
    tokensBought:        { type: Number, default: null },
    platformFeePaise:    { ...moneyField() },
    teacherPayoutPaise:  { ...moneyField() },
    studentRefundPaise:  { ...moneyField() },
    currency:            { type: String, default: 'INR', uppercase: true },
    gateway:             { type: String, default: 'razorpay', enum: ['razorpay', 'manual', 'wallet', 'mock'] },
    method:              { type: String, trim: true, default: null },
    idempotencyKey: {
      type:   String,
      trim:   true,
      unique: true,
      sparse: true,
      select: false,
    },
    escrowHeldAt:        { type: Date, default: null },
    escrowReleasedAt:    { type: Date, default: null },
    escrowReleaseReason: { type: String, trim: true, default: null },
    capturedAt:          { type: Date, default: null },
    failedAt:            { type: Date, default: null },
    webhookEvents:       { type: [webhookEventSchema], default: [] },
    refunds:             { type: [refundLogSchema],    default: [] },
    failureCode:         { type: String, default: null },
    failureMessage: { type: String, default: null },
    payoutId:            { type: Schema.Types.ObjectId, ref: 'Payout', default: null },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

paymentSchema.plugin(mongoosePaginate);
paymentSchema.plugin(mongooseAggregatePaginate);
paymentSchema.plugin(mongooseLeanVirtuals);

// Core single indices
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ purpose: 1, status: 1 });
paymentSchema.index({ payerId: 1, purpose: 1, status: 1, createdAt: -1 });
paymentSchema.index({ escrowStatus: 1, escrowHeldAt: 1 });
paymentSchema.index({ teacherId: 1, escrowStatus: 1 }, { sparse: true });

// ── CRITICAL RESOLUTION FOR ISSUE D: COMPOUND INDEX ──────────────────────────
// Yeh webhook aur query acceptance flows ko atomic transaction ki tarah bind karega
paymentSchema.index({ queryId: 1, purpose: 1, status: 1 }, { sparse: true });

// ── Virtuals ───────────────────────────────────────────────────────────────────
paymentSchema.virtual('totalAmountRupees').get(function () {
  return this.totalAmountPaise / 100;
});
paymentSchema.virtual('isCaptured').get(function () {
  return this.status === PAYMENT_STATUS.CAPTURED;
});
paymentSchema.virtual('remainingPaise').get(function () {
  return this.totalAmountPaise - this.refundedAmountPaise;
});

// ── Instance methods ──────────────────────────────────────────────────────────
paymentSchema.methods.capture = async function ({ razorpayPaymentId, razorpaySignature, method }) {
  this.status            = PAYMENT_STATUS.CAPTURED;
  this.razorpayPaymentId = razorpayPaymentId;
  this.razorpaySignature = razorpaySignature;
  this.method            = method || null;
  this.capturedAt        = new Date();
  if (this.purpose === 'enrollment_fee') {
    this.escrowStatus = ESCROW_STATUS.HOLDING;
    this.escrowHeldAt = new Date();
  }
  return this.save();
};

paymentSchema.methods.releaseEscrow = async function (reason = 'course_completed') {
  if (this.escrowStatus !== ESCROW_STATUS.HOLDING) {
    throw new Error('Cannot release escrow: not in HOLDING state');
  }
  this.escrowStatus        = ESCROW_STATUS.RELEASED;
  this.escrowReleasedAt    = new Date();
  this.escrowReleaseReason = reason;
  return this.save();
};

paymentSchema.methods.logWebhookEvent = function (event, payload) {
  this.webhookEvents.push({ event, payload, processed: false });
  return this.save();
};

paymentSchema.methods.addRefund = async function ({ razorpayRefundId, amountPaise, reason }) {
  this.refunds.push({ razorpayRefundId, amountPaise, reason });
  this.refundedAmountPaise += amountPaise;
  const isFull = this.refundedAmountPaise >= this.totalAmountPaise;
  this.status       = isFull ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED;
  this.escrowStatus = isFull ? ESCROW_STATUS.REFUNDED   : ESCROW_STATUS.PARTIAL_REFUND;
  return this.save();
};

export const Payment = mongoose.model('Payment', paymentSchema);