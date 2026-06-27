// ─────────────────────────────────────────────────────────────────────────────
// src/models/OtpSession.model.js
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import { OTP_PURPOSE } from '../constants/enums.js';
import { jsonTransform } from '../utils/schema.util.js';

const { Schema } = mongoose;

const otpSessionSchema = new Schema(
  {
    // phone is optional — null when channel is email-only
    phone: {
      type:     String,
      trim:     true,
      default:  null,
      validate: {
        validator: (v) => !v || /^\+?[1-9]\d{9,14}$/.test(v),
        message:   (props) => `${props.value} is not a valid phone number`,
      },
      index:    true,
    },
    // email is optional — null when channel is phone-only
    email: {
      type:      String,
      trim:      true,
      lowercase: true,
      default:   null,
      select:    false,
      index:     true,
    },
    purpose: {
      type:    String,
      enum:    Object.values(OTP_PURPOSE),
      default: OTP_PURPOSE.LOGIN,
      index:   true,
    },
    // Primary OTP hash — phone OTP in dual mode, single OTP in single-channel mode
    otpHash: {
      type:     String,
      required: true,
      select:   false,
    },
    // Secondary OTP hash — email OTP in dual signup mode only
    emailOtpHash: {
      type:    String,
      default: null,
      select:  false,
    },
    expiresAt: {
      type:     Date,
      required: true,
    },
    verified:     { type: Boolean, default: false },
    verifiedAt:   { type: Date,    default: null  },
    attemptCount: { type: Number,  default: 0, min: 0, max: 10 },
    lockedUntil:  { type: Date,    default: null },
    sessionToken: {
      type:   String,
      unique: true,
      sparse: true,
      select: false,
    },
    sessionTokenUsed: { type: Boolean, default: false },
    deliveryChannel: {
      type:    String,
      enum:    ['sms', 'whatsapp', 'email', 'dual'],
      default: 'email',
    },
    deliveryStatus: {
      type:    String,
      enum:    ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    ipAddress: { type: String, trim: true, default: null },
    userAgent: { type: String, trim: true, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   { virtuals: true, versionKey: false },
  },
);

// TTL — MongoDB auto-deletes expired OTP sessions
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSessionSchema.index({ phone: 1, purpose: 1, verified: 1 });
otpSessionSchema.index({ email: 1, purpose: 1, verified: 1 });

// ── Instance methods ──────────────────────────────────────────────────────────
otpSessionSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};
otpSessionSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};
otpSessionSchema.methods.incrementAttempt = async function () {
  this.attemptCount += 1;
  if (this.attemptCount >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  return this.save();
};
otpSessionSchema.methods.markVerified = async function (sessionToken) {
  this.verified     = true;
  this.verifiedAt   = new Date();
  this.sessionToken = sessionToken;
  return this.save();
};
otpSessionSchema.methods.consumeSessionToken = async function () {
  this.sessionTokenUsed = true;
  return this.save();
};

// ── Static methods ─────────────────────────────────────────────────────────────
otpSessionSchema.statics.findValid = function (identifier, purpose) {
  const isEmail = typeof identifier === 'string' && identifier.includes('@');
  const query   = isEmail
    ? { email: identifier, purpose, verified: false, expiresAt: { $gt: new Date() } }
    : { phone: identifier, purpose, verified: false, expiresAt: { $gt: new Date() } };
  return this.findOne(query)
    .select('+otpHash +emailOtpHash +email')
    .sort({ createdAt: -1 });
};

otpSessionSchema.statics.countRecentSends = function (identifier, windowMs = 3600000) {
  const isEmail = typeof identifier === 'string' && identifier.includes('@');
  const query   = isEmail
    ? { email: identifier, createdAt: { $gte: new Date(Date.now() - windowMs) } }
    : { phone: identifier, createdAt: { $gte: new Date(Date.now() - windowMs) } };
  return this.countDocuments(query);
};

export const OtpSession = mongoose.model('OtpSession', otpSessionSchema);