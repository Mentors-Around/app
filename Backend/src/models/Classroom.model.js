// src/models/Classroom.model.js
import mongoose                  from 'mongoose';
import mongoosePaginate          from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongooseLeanVirtuals      from 'mongoose-lean-virtuals';
import {
  CLASSROOM_STATUS, CLASSROOM_MODE, CLASSROOM_TYPE, SKILL_LEVEL,
} from '../constants/enums.js';
import {
  jsonTransform, toObjectOptions, moneyField, urlValidator,
  enumField, geoPointSchema, defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

// ── Schedule slot ─────────────────────────────────────────────────────────────
const scheduleSlotSchema = new Schema(
  {
    day:             { type: Number, required: true, min: 0, max: 6 },
    startTime:       { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    endTime:         { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    durationMinutes: { type: Number, required: true, min: 15 },
    conductedAt:     { type: Date,    default: null },
    isConducted:     { type: Boolean, default: false },
    gmeetLink:       { type: String,  trim: true, default: null },
  },
  { _id: true },
);

const sessionDetailSchema = new Schema(
  {
    id:          { type: Number },
    topic:       { type: String, required: true },
    date:        { type: String, required: true }, // e.g. YYYY-MM-DD
    startTime:   { type: String, required: true }, // e.g. HH:MM
    endTime:     { type: String, required: true },
    notes:       { type: String, default: '' },
    sessionType: { type: String, enum: ['online', 'offline'], default: 'online' },
    attendance:  [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'User' },
        present:   { type: Boolean, default: false },
        markedAt:  { type: Date, default: Date.now }
      }
    ]
  },
  { _id: true }
);

// ── Offline facility ──────────────────────────────────────────────────────────
const offlineFacilitySchema = new Schema(
  {
    address:     { type: String, trim: true },
    location:    { type: geoPointSchema, default: null },
    city:        { type: String, trim: true, lowercase: true },
    state:       { type: String, trim: true, lowercase: true },
    pincode:     { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    photoUrls: {
      type:    [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10 && arr.every((u) => /^https?:\/\/.+/.test(u)),
        message:   'Max 10 photos, all must be valid URLs',
      },
    },
    videoUrls: {
      type:    [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3 && arr.every((u) => /^https?:\/\/.+/.test(u)),
        message:   'Max 3 videos, all must be valid URLs',
      },
    },
    facilities: { type: [String], default: [] },
    capacity:   { type: Number, min: 1, default: null },
  },
  { _id: false },
);

// ── Stats ─────────────────────────────────────────────────────────────────────
const classroomStatsSchema = new Schema(
  {
    totalQueries:       { type: Number, default: 0, min: 0 },
    acceptedQueries:    { type: Number, default: 0, min: 0 },
    enrolledStudents:   { type: Number, default: 0, min: 0 },
    avgRating:          { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:        { type: Number, default: 0, min: 0 },
    hoursCompleted:     { type: Number, default: 0, min: 0 },
    totalEarningsPaise: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

// ── Main schema ───────────────────────────────────────────────────────────────
const classroomSchema = new Schema(
  {
    teacherId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Teacher ID is required'],
      index:    true,
    },

    // ── Core identity ──────────────────────────────────────────────────────────
    title: {
      type:      String,
      required:  [true, 'Classroom title is required'],
      trim:      true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    subject: {
      type:     String,
      required: [true, 'Subject is required'],
      trim:     true,
    },
    stream: {
      type:    String,
      trim:    true,
      default: null,
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
      default:   '',
    },
    tags: {
      type:    [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message:   'Max 20 tags allowed',
      },
    },
    thumbnailUrl: {
      type:     String,
      trim:     true,
      validate: urlValidator,
      default:  null,
    },

    // ── Classroom type: academic vs hobby ──────────────────────────────────────
    classroomType: {
      type:    String,
      enum:    Object.values(CLASSROOM_TYPE),
      default: CLASSROOM_TYPE.ACADEMIC,
      index:   true,
    },

    // ── Academic-specific fields ───────────────────────────────────────────────
    // Required for academic; ignored / optional for hobby
    academicLevel: {
      type:    String,
      trim:    true,
      default: null,
      // e.g. "Class 10", "Class 12", "JEE Advanced", "NEET", "UG"
    },
    minimumQualification: {
      type:    String,
      trim:    true,
      default: null,
      // e.g. "Class 10 pass", "Basic algebra"  — optional even for academic
    },
    prerequisites: {
      type:    [String],
      default: [],
      // e.g. ["Trigonometry", "Basic calculus"] — optional
    },

    // ── Hobby-specific fields ──────────────────────────────────────────────────
    minimumAge: {
      type:    Number,
      min:     [0, 'Minimum age cannot be negative'],
      default: null,
      // e.g. 10 (years) — optional
    },

    // ── Level (optional for both types) ───────────────────────────────────────
    skillLevel: {
      type:    String,
      enum:    [...Object.values(SKILL_LEVEL), null],
      default: null,
      // Shown in classroom description so students can filter before querying
    },

    // ── Course duration & scheduling ──────────────────────────────────────────
    totalHoursPlanned: {
      type:     Number,
      required: [true, 'Total planned hours is required'],
      min:      [1, 'At least 1 hour required'],
    },
    startDate: {
      type:     Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type:     Date,
      required: [true, 'End date is required'],
    },
    schedule: {
      type:    [scheduleSlotSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length > 0,
        message:   'At least one schedule slot is required',
      },
    },
    gmeetLink: {
      type:    String,
      trim:    true,
      default: null,
    },
    meetingPlatform: {
      type:    String,
      trim:    true,
      default: 'Google Meet',
    },
    accessTimeMinutes: {
      type:    Number,
      default: 15,
      min:     0,
      max:     120,
    },
    meetingId: {
      type:    String,
      trim:    true,
      default: null,
    },
    meetingPassword: {
      type:    String,
      trim:    true,
      default: null,
    },

    // ── Mode ──────────────────────────────────────────────────────────────────
    mode:            enumField(CLASSROOM_MODE, CLASSROOM_MODE.ONLINE),
    offlineFacility: { type: offlineFacilitySchema, default: null },
    sessions:        { type: [sessionDetailSchema], default: [] },

    // ── Pricing ───────────────────────────────────────────────────────────────
    feesPaise: {
      ...moneyField({ required: [true, 'Fees is required'] }),
      min: [100, 'Minimum fee is ₹1'],
    },

    // ── Capacity ──────────────────────────────────────────────────────────────
    maxStudents: {
      type:     Number,
      required: [true, 'Maximum students limit is required'],
      min:      [1, 'At least 1 student required'],
      max:      [500, 'Cannot exceed 500 students per classroom'],
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: enumField(CLASSROOM_STATUS, CLASSROOM_STATUS.DRAFT),

    // ── Early completion ──────────────────────────────────────────────────────
    earlyEndRequestedAt: { type: Date, default: null },
    earlyEndApprovedAt:  { type: Date, default: null },
    earlyEndPollId:      { type: Schema.Types.ObjectId, ref: 'Poll', default: null },

    // ── Completion ────────────────────────────────────────────────────────────
    completedAt:    { type: Date, default: null },
    completionCase: { type: String, enum: ['case_1', 'case_2', 'case_3'], default: null },

    // ── Stats ─────────────────────────────────────────────────────────────────
    stats: { type: classroomStatsSchema, default: () => ({}) },

    // ── Admin ─────────────────────────────────────────────────────────────────
    adminNotes:     { type: String, trim: true, default: null, select: false },
    searchKeywords: { type: [String], default: [], select: false },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

classroomSchema.plugin(mongoosePaginate);
classroomSchema.plugin(mongooseAggregatePaginate);
classroomSchema.plugin(mongooseLeanVirtuals);

// ── Indexes ───────────────────────────────────────────────────────────────────
classroomSchema.index(
  { searchKeywords: 'text', title: 'text', description: 'text' },
  { name: 'classroom_text_search', weights: { title: 10, searchKeywords: 8, description: 1 } },
);
classroomSchema.index({ teacherId: 1, status: 1 });
classroomSchema.index({ status: 1, 'stats.avgRating': -1 });
classroomSchema.index({ subject: 1, status: 1 });
classroomSchema.index({ classroomType: 1, status: 1 });      // NEW
classroomSchema.index({ skillLevel: 1, status: 1 });          // NEW
classroomSchema.index({ status: 1, feesPaise: 1 });
classroomSchema.index({ tags: 1, status: 1 });
classroomSchema.index({ status: 1, startDate: 1 });
classroomSchema.index({ 'offlineFacility.location': '2dsphere' }, { sparse: true });

// ── Virtuals ──────────────────────────────────────────────────────────────────
classroomSchema.virtual('feesRupees').get(function () {
  return this.feesPaise / 100;
});
classroomSchema.virtual('isFull').get(function () {
  return this.stats.enrolledStudents >= this.maxStudents;
});
classroomSchema.virtual('progressPercent').get(function () {
  if (!this.totalHoursPlanned) return 0;
  return Math.min(100, Math.round((this.stats.hoursCompleted / this.totalHoursPlanned) * 100));
});
classroomSchema.virtual('isPastHalfway').get(function () {
  return this.stats.hoursCompleted >= this.totalHoursPlanned / 2;
});

// ── Pre-save ──────────────────────────────────────────────────────────────────
classroomSchema.pre('save', async function () {
  if (
    this.isModified('title') || this.isModified('subject') ||
    this.isModified('stream') || this.isModified('tags') ||
    this.isModified('classroomType') || this.isModified('skillLevel') ||
    this.isModified('academicLevel')
  ) {
    const kw = [
      this.title, this.subject, this.stream,
      this.classroomType, this.skillLevel, this.academicLevel,
      ...this.tags, ...this.prerequisites,
    ]
      .filter(Boolean)
      .flatMap((s) => s.toLowerCase().trim().split(/\s+/));
    this.searchKeywords = [...new Set(kw)];
  }
  if (this.startDate && this.endDate && new Date(this.endDate).getTime() < new Date(this.startDate).getTime()) {
    throw new Error('End date must be on or after start date');
  }
});

// ── Instance methods ──────────────────────────────────────────────────────────
classroomSchema.methods.canAcceptStudents = function () {
  return (
    this.status === CLASSROOM_STATUS.ACTIVE &&
    this.stats.enrolledStudents < this.maxStudents
  );
};

classroomSchema.methods.canScheduleUpdate = function () {
  return [CLASSROOM_STATUS.ACTIVE, CLASSROOM_STATUS.DRAFT].includes(this.status);
};

// ── Static methods ─────────────────────────────────────────────────────────────
classroomSchema.statics.search = function ({
  query, subject, mode, classroomType, skillLevel,
  minFee, maxFee, minRating = 0,
  page = 1, limit = 20, sort = 'rating',
} = {}) {
  const filter = { status: CLASSROOM_STATUS.ACTIVE };

  if (subject)       filter.subject       = subject;
  if (mode)          filter.mode          = mode;
  if (classroomType) filter.classroomType = classroomType;
  if (skillLevel)    filter.skillLevel    = skillLevel;
  if (minRating > 0) filter['stats.avgRating'] = { $gte: minRating };
  if (minFee || maxFee) {
    filter.feesPaise = {};
    if (minFee) filter.feesPaise.$gte = minFee * 100;
    if (maxFee) filter.feesPaise.$lte = maxFee * 100;
  }
  if (query) filter.$text = { $search: query };

  const sortMap = {
    rating:     { 'stats.avgRating': -1 },
    price_asc:  { feesPaise: 1 },
    price_desc: { feesPaise: -1 },
    new:        { createdAt: -1 },
    popular:    { 'stats.enrolledStudents': -1 },
  };

  return this.paginate(filter, {
    ...defaultPaginateOptions,
    sort:       sortMap[sort] || sortMap.rating,
    page,
    limit:      Math.min(limit, 20),
    populate:   { path: 'teacherId', select: 'name avatarUrl' },
    lean:       true,
    leanWithId: true,
  });
};

/**
 * Personalised discover feed for a student.
 * Finds classrooms similar to their enrolled ones, excluding already queried/enrolled.
 */
classroomSchema.statics.discoverForStudent = async function (studentId, { page = 1, limit = 10 } = {}) {
  const [enrolledClassrooms, activeQueries] = await Promise.all([
    mongoose.model('Enrollment')
      .find({ studentId, status: { $in: ['active', 'completed'] } })
      .select('classroomId').lean(),
    mongoose.model('EnrollmentQuery')
      .find({ studentId, status: { $in: ['pending', 'accepted', 'enrolled'] } })
      .select('classroomId').lean(),
  ]);

  const excludeIds = [
    ...enrolledClassrooms.map((e) => e.classroomId),
    ...activeQueries.map((q) => q.classroomId),
  ];

  // Get subjects/streams from prior classrooms for relevance scoring
  const priorClassrooms = excludeIds.length
    ? await this.find({ _id: { $in: excludeIds } })
        .select('subject stream tags teacherId classroomType skillLevel').lean()
    : [];

  const subjects    = [...new Set(priorClassrooms.map((c) => c.subject))];
  const streams     = [...new Set(priorClassrooms.map((c) => c.stream).filter(Boolean))];
  const teacherIds  = [...new Set(priorClassrooms.map((c) => c.teacherId?.toString()))];
  const tags        = [...new Set(priorClassrooms.flatMap((c) => c.tags))];
  const types       = [...new Set(priorClassrooms.map((c) => c.classroomType).filter(Boolean))];

  const filter = {
    status: CLASSROOM_STATUS.ACTIVE,
    _id:    { $nin: excludeIds },
  };

  return this.paginate(filter, {
    page,
    limit:      Math.min(limit, 20),
    sort:       { 'stats.avgRating': -1, 'stats.enrolledStudents': -1 },
    populate:   { path: 'teacherId', select: 'name avatarUrl' },
    lean:       true,
    leanWithId: true,
  });
};

classroomSchema.statics.byTeacher = function (teacherId, options = {}) {
  return this.paginate({ teacherId }, { ...defaultPaginateOptions, sort: { createdAt: -1 }, ...options });
};

classroomSchema.statics.overdueActive = function () {
  return this.find({ status: CLASSROOM_STATUS.ACTIVE, endDate: { $lt: new Date() } }).lean();
};

classroomSchema.query.active = function () {
  return this.where({ status: CLASSROOM_STATUS.ACTIVE });
};

export const Classroom = mongoose.model('Classroom', classroomSchema);