// ─────────────────────────────────────────────────────────────────────────────
// src/models/User.model.js
// Production-grade optimized model with explicit MFA, Passwords, and Trust Badges.
// ─────────────────────────────────────────────────────────────────────────────
import mongoose             from 'mongoose';
import mongoosePaginate     from 'mongoose-paginate-v2';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import bcrypt               from 'bcryptjs';
import { ROLES }            from '../constants/enums.js';
import { AGE_LIMITS }       from '../constants/app.constants.js';
import {
  jsonTransform,
  toObjectOptions,
  phoneValidator,
  urlValidator,
  defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    phone: {
      type:     String,
      required: false,       // optional — email is primary identifier
      unique:   true,
      sparse:   true,        // allows multiple null values with unique index
      trim:     true,
      default:  null,
      validate: {
        validator: (v) => !v || /^\+?[1-9]\d{9,14}$/.test(v),
        message:   (props) => `${props.value} is not a valid phone number`,
      },
    },
    role: {
      type:     String,
      enum:     { values: Object.values(ROLES), message: '{VALUE} is not a valid role' },
      required: [true, 'Role is required'],
      index:    true,
    },
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type:      String,
      trim:      true,
      lowercase: true,
      sparse:    true,
      unique:    true,
      validate: {
        validator: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message:   'Invalid email address',
      },
    },
    avatarUrl: {
      type:     String,
      trim:     true,
      validate: urlValidator,
      default:  null,
    },
    // ── Cyber Security: Password & MFA (FOUNDER REQUIREMENTS GATEWAY) ──────────
    passwordHash: {
      type:     String,
      select:   false, // Strict security encapsulation
      default:  null,
    },
    mfaEnabled: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    mfaSecret: {
      type:    String,
      select:  false, // Encrypted TOTP seed mapping
      default: null,
    },
    // ── Minor / Parental consent (Trust & Safety Child Guard) ────────────────
    dateOfBirth: {
      type:    Date,
      default: null,
    },
    isMinor: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    parentalConsentVerified: {
      type:    Boolean,
      default: false,
    },
    parentGuardian: {
      name:        { type: String, trim: true, default: null },
      phone:       { 
        type: String, 
        trim: true, 
        default: null, 
        validate: {
          validator: function(v) {
            // SAFE BYPASS: If the sub-document field is empty, skip validation gracefully
            if (v === null || v === undefined || v === '') return true;
            
            // DYNAMIC CALL: Evaluate using global project phoneValidator helper if string exists
            if (typeof phoneValidator === 'function') return phoneValidator(v);
            if (phoneValidator && typeof phoneValidator.validator === 'function') {
              return phoneValidator.validator(v);
            }
            // Standard E.164 pattern fallback check
            return /^\+?[1-9]\d{1,14}$/.test(v);
          },
          message: 'Guardian phone number must be a valid contact string'
        }
      },
      relation:    { type: String, trim: true, default: null },
      consentedAt: { type: Date, default: null },
      consentTokenHash: { type: String, trim: true, default: null, select: false },
    },
    // Google OAuth
    googleId: {
      type:   String,
      trim:   true,
      unique: true,
      sparse: true,
      index:  true,
    },
    // ── Location ──────────────────────────────────────────────────────────────
    city: {
      type:    String,
      trim:    true,
      default: null,
      index:   true,
    },
    state: {
      type:    String,
      trim:    true,
      default: null,
    },
    // ── Auth flags ─────────────────────────────────────────────────────────────
    isPhoneVerified: { type: Boolean, default: false },
    kycStatus: {
      type:    String,
      enum:    ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
      index:   true,
    },
    isVerificationPending: { type: Boolean, default: false },
    isActive:  { type: Boolean, default: true,  index: true },
    isBanned:  { type: Boolean, default: false, index: true },
    banReason: { type: String,  trim: true,     default: null },
    // ── Engagement ────────────────────────────────────────────────────────────
    lastActiveAt: { type: Date, default: null, index: true },
    fcmTokens: {
      type:    [String],
      default: [],
      select:  false,
    },
    // ── Student: saved classrooms ──────────────────────────────────────────────
    savedClassrooms: [
      { type: Schema.Types.ObjectId, ref: 'Classroom' },
    ],
    // ── Admin meta ────────────────────────────────────────────────────────────
    onboardedAt: { type: Date, default: null },
    deletedAt:   { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

// ── Plugins ───────────────────────────────────────────────────────────────────
mongoosePaginate.paginate.options = defaultPaginateOptions;
userSchema.plugin(mongoosePaginate);
userSchema.plugin(mongooseLeanVirtuals);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ isBanned: 1, role: 1 });
userSchema.index({ deletedAt: 1 }, { sparse: true });

// ── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual('isDeleted').get(function () {
  return this.deletedAt !== null;
});
userSchema.virtual('displayName').get(function () {
  return this.name || `User_${this._id.toString().slice(-6)}`;
});

// ── CRITICAL RESOLUTION FOR TRUST BADGE REQUIREMENT ──────────────────────────
userSchema.virtual('hasVerifiedTeacherBadge').get(function () {
  return this.role === ROLES.TEACHER && this.kycStatus === 'approved';
});

// ── Unified Atomic Hook Execution Pipeline ────────────────────────────────────
userSchema.pre('save', async function () {
  // 1. Assign chronological onboarding markers
  if (this.isNew) {
    this.onboardedAt = new Date();
  }

  // 2. Manage explicit termination states
  if ((this.isBanned || this.deletedAt) && this.isActive) {
    this.isActive = false;
  }

  // 3. Cryptographic Password Hashing Gateway
  if (this.isModified('passwordHash') && this.passwordHash && !this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }

  // 4. Minor Status Evaluation Engine
  if (this.isModified('dateOfBirth') && this.dateOfBirth) {
    const ageMs = Date.now() - this.dateOfBirth.getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    this.isMinor = ageYears < AGE_LIMITS.MINOR_THRESHOLD;
  }
});

// ── Instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  this.isActive  = false;
  return this.save();
};

userSchema.methods.ban = async function (reason) {
  this.isBanned  = true;
  this.banReason = reason || 'Policy violation';
  this.isActive  = false;
  return this.save();
};

userSchema.methods.touchActivity = function () {
  return this.constructor.updateOne({ _id: this._id }, { lastActiveAt: new Date() });
};

// ── Static methods ─────────────────────────────────────────────────────────────
userSchema.statics.findByPhone = function (phone) {
  return this.findOne({ phone: phone.trim(), deletedAt: null });
};

userSchema.statics.findActiveById = function (id) {
  return this.findOne({ _id: id, isActive: true, deletedAt: null });
};

userSchema.statics.listPaginated = function (filter = {}, options = {}) {
  const safeFilter = { deletedAt: null, ...filter };
  return this.paginate(safeFilter, {
    ...defaultPaginateOptions,
    sort:   options.sort  || { createdAt: -1 },
    page:   options.page  || 1,
    limit:  options.limit || 20,
    select: options.select || '-fcmTokens',
    ...options,
  });
};

// ── Query Helpers ──────────────────────────────────────────────────────────────
userSchema.query.active = function () {
  return this.where({ isActive: true, deletedAt: null });
};
userSchema.query.byRole = function (role) {
  return this.where({ role });
};

export const User = mongoose.model('User', userSchema);