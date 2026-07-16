// ─────────────────────────────────────────────────────────────────────────────
// src/models/TeacherProfile.model.js
// ─────────────────────────────────────────────────────────────────────────────
import mongoose                  from 'mongoose';
import mongoosePaginate          from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongooseLeanVirtuals      from 'mongoose-lean-virtuals';
import { VERIFICATION_STATUS }   from '../constants/enums.js';
import {
  jsonTransform,
  toObjectOptions,
  geoPointSchema,
  urlValidator,
  defaultPaginateOptions,
  enumField,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

// ── Bank account sub-doc (for payout) ─────────────────────────────────────────
const bankAccountSchema = new Schema(
  {
    accountHolderName: { type: String, trim: true },
    accountNumber:     { type: String, trim: true, select: false }, // encrypted at app layer
    accountLast4:      { type: String, trim: true },
    ifsc:              { type: String, trim: true, uppercase: true },
    bankName:          { type: String, trim: true },
    upiId:             { type: String, trim: true, default: null },
    razorpayContactId: { type: String, trim: true, select: false },
    razorpayFundId:    { type: String, trim: true, select: false },
    isVerified:        { type: Boolean, default: false },
  },
  { _id: false },
);

// ── Stats sub-doc ─────────────────────────────────────────────────────────────
const teacherStatsSchema = new Schema(
  {
    totalClassrooms:    { type: Number, default: 0, min: 0 },
    activeClassrooms:   { type: Number, default: 0, min: 0 },
    completedClassrooms:{ type: Number, default: 0, min: 0 },
    totalStudents:      { type: Number, default: 0, min: 0 },
    totalEarningsPaise: { type: Number, default: 0, min: 0 },
    pendingPayoutPaise: { type: Number, default: 0, min: 0 },
    withdrawnPaise:     { type: Number, default: 0, min: 0 },
    avgRating:          { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:        { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

// ── Main TeacherProfile schema ─────────────────────────────────────────────────
const teacherProfileSchema = new Schema(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },
    bio: {
      type:      String,
      trim:      true,
      maxlength: [1200, 'Bio cannot exceed 1200 characters'],
      default:   '',
    },
    headline: {
      type:      String,
      trim:      true,
      maxlength: [160, 'Headline cannot exceed 160 characters'],
      default:   '',
    },
    experienceYears: {
      type:    Number,
      min:     [0, 'Experience cannot be negative'],
      max:     [60, 'Experience exceeds reasonable value'],
      default: 0,
    },
    education: [
      {
        institution: { type: String, trim: true },
        degree:      { type: String, trim: true },
        year: {
          type: Number,
          min:  1950,
          validate: {
            validator: (v) => v <= new Date().getFullYear(),
            message:   'Education year cannot be in the future',
          },
        },
      },
    ],
    subjects: {
      type:     [String],
      required: [true, 'At least one subject is required'],
      validate: {
        validator: (v) => v.length > 0 && v.length <= 15,
        message:   'Subjects must be between 1 and 15',
      },
    },
    languages: {
      type:    [String],
      default: ['Hindi', 'English'],
    },
    // KYC / Verification
    verificationStatus: enumField(VERIFICATION_STATUS, VERIFICATION_STATUS.PENDING),
    verifiedAt:         { type: Date, default: null },
    rejectionReason:    { type: String, trim: true, default: null },
    kycDocumentIds:     [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    // Aadhaar + bank submitted for admin verification
    aadhaarNumber: { type: String, trim: true, select: false }, // encrypted at app layer
    // Bank account for payouts
    bankAccount:   { type: bankAccountSchema, default: null },
    // Wallet: amount earned but not yet withdrawn (in paise)
    walletPaise:   { type: Number, default: 0, min: 0 },
    // Location (for offline classrooms)
    location: {
      type:  geoPointSchema,
      default: null,
    },
    city:    { type: String, trim: true, lowercase: true, default: null, index: true },
    state:   { type: String, trim: true, lowercase: true, default: null },
    country: { type: String, trim: true, lowercase: true, default: 'india' },
    // Media
    introVideoUrl: {
      type:     String,
      trim:     true,
      validate: urlValidator,
      default:  null,
    },
    portfolioUrls: {
      type:    [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((u) => /^https?:\/\/.+/.test(u)),
        message:   'All portfolio links must be valid URLs',
      },
    },
    // Search optimisation
    searchKeywords: { type: [String], default: [], select: false },
    // Denormalised stats
    stats: { type: teacherStatsSchema, default: () => ({}) },
    // Admin flags
    isFeatured:    { type: Boolean, default: false, index: true },
    featuredUntil: { type: Date,    default: null },
    adminNotes:    { type: String,  trim: true, default: null, select: false },
    isAvailableForNewClassrooms: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

teacherProfileSchema.plugin(mongoosePaginate);
teacherProfileSchema.plugin(mongooseAggregatePaginate);
teacherProfileSchema.plugin(mongooseLeanVirtuals);

// ── Indexes ───────────────────────────────────────────────────────────────────
teacherProfileSchema.index(
  { searchKeywords: 'text', headline: 'text', bio: 'text' },
  { name: 'teacher_text_search', weights: { searchKeywords: 10, headline: 5, bio: 1 } },
);
teacherProfileSchema.index({ verificationStatus: 1, 'stats.avgRating': -1 });
teacherProfileSchema.index({ verificationStatus: 1, city: 1 });
teacherProfileSchema.index({ isFeatured: 1, featuredUntil: 1 }, { sparse: true });
teacherProfileSchema.index({ location: '2dsphere' }, { sparse: true });

// ── Virtuals ───────────────────────────────────────────────────────────────────
teacherProfileSchema.virtual('isVerified').get(function () {
  return this.verificationStatus === VERIFICATION_STATUS.APPROVED;
});
teacherProfileSchema.virtual('walletRupees').get(function () {
  return this.walletPaise / 100;
});

// ── Pre-save: build search keywords ───────────────────────────────────────────
teacherProfileSchema.pre('save', async function () {
  if (
    this.isModified('subjects') ||
    this.isModified('languages') ||
    this.isModified('city')
  ) {
    const kw = [...this.subjects, ...this.languages, this.city]
      .filter(Boolean)
      .map((s) => s.toLowerCase().trim());
    this.searchKeywords = [...new Set(kw)];
  }
});

// ── Static methods ─────────────────────────────────────────────────────────────
teacherProfileSchema.statics.pendingVerification = function (options = {}) {
  return this.paginate(
    { verificationStatus: VERIFICATION_STATUS.PENDING },
    {
      ...defaultPaginateOptions,
      sort:     { createdAt: 1 },
      populate: { path: 'userId', select: 'name phone email' },
      ...options,
    },
  );
};

teacherProfileSchema.statics.topEarners = function (limit = 10) {
  return this.aggregate([
    { $match: { verificationStatus: VERIFICATION_STATUS.APPROVED } },
    { $sort:  { 'stats.totalEarningsPaise': -1 } },
    { $limit: limit },
    {
      $lookup: {
        from:      'users',
        localField: 'userId',
        foreignField: '_id',
        as:        'user',
        pipeline:  [{ $project: { name: 1, phone: 1, avatarUrl: 1 } }],
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        userId:              1,
        user:                1,
        totalEarningsRupees: { $divide: ['$stats.totalEarningsPaise', 100] },
        completedClassrooms: '$stats.completedClassrooms',
        avgRating:           '$stats.avgRating',
      },
    },
  ]);
};

teacherProfileSchema.query.approved = function () {
  return this.where({ verificationStatus: VERIFICATION_STATUS.APPROVED });
};

export const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);