// ─────────────────────────────────────────────────────────────────────────────
// src/models/Review.model.js
//
// One review per enrollment (not per booking as before).
// Student can only review after classroom is completed.
// Reviews are per classroom AND per teacher (same document).
// ─────────────────────────────────────────────────────────────────────────────
import mongoose             from 'mongoose';
import mongoosePaginate     from 'mongoose-paginate-v2';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { jsonTransform, toObjectOptions, defaultPaginateOptions } from '../utils/schema.util.js';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    enrollmentId: {
      type:     Schema.Types.ObjectId,
      ref:      'Enrollment',
      required: [true, 'Enrollment ID is required'],
      unique:   true,  // one review per enrollment
      index:    true,
    },
    studentId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Student ID is required'],
      index:    true,
    },
    teacherId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Teacher ID is required'],
      index:    true,
    },
    classroomId: {
      type:     Schema.Types.ObjectId,
      ref:      'Classroom',
      required: [true, 'Classroom ID is required'],
      index:    true,
    },
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message:   'Rating must be a whole number',
      },
    },
    comment: {
      type:      String,
      trim:      true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default:   '',
    },
    replyText: {
      type:      String,
      trim:      true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters'],
      default:   null,
    },
    repliedAt: {
      type:    Date,
      default: null,
    },
    // Moderation
    isVisible:    { type: Boolean, default: true, index: true },
    adminNote:    { type: String,  trim: true, default: null, select: false },
    reportedAt:   { type: Date,    default: null },
    reportReason: { type: String,  trim: true, default: null },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

reviewSchema.plugin(mongoosePaginate);
reviewSchema.plugin(mongooseLeanVirtuals);

reviewSchema.index({ teacherId: 1, isVisible: 1, createdAt: -1 });
reviewSchema.index({ classroomId: 1, isVisible: 1, createdAt: -1 });
reviewSchema.index({ studentId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, teacherId: 1 });

// ── Virtuals ───────────────────────────────────────────────────────────────────
reviewSchema.virtual('ratingLabel').get(function () {
  const labels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
  return labels[this.rating] || 'Unknown';
});

// ── Static methods ─────────────────────────────────────────────────────────────
/**
 * Atomically update avgRating on both TeacherProfile and Classroom.
 * Called after review create/update.
 */
reviewSchema.statics.updateStats = async function (teacherId, classroomId) {
  const TeacherProfile = mongoose.model('TeacherProfile');
  const Classroom      = mongoose.model('Classroom');

  const [teacherStats] = await this.aggregate([
    { $match: { teacherId: new mongoose.Types.ObjectId(teacherId), isVisible: true } },
    {
      $group: {
        _id:         null,
        avgRating:   { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  await TeacherProfile.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(teacherId) },
    {
      $set: {
        'stats.avgRating':   teacherStats ? Math.round(teacherStats.avgRating * 10) / 10 : 0,
        'stats.reviewCount': teacherStats ? teacherStats.reviewCount : 0,
      },
    },
  );

  const [classroomStats] = await this.aggregate([
    { $match: { classroomId: new mongoose.Types.ObjectId(classroomId), isVisible: true } },
    {
      $group: {
        _id:         null,
        avgRating:   { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  await Classroom.findByIdAndUpdate(classroomId, {
    $set: {
      'stats.avgRating':   classroomStats ? Math.round(classroomStats.avgRating * 10) / 10 : 0,
      'stats.reviewCount': classroomStats ? classroomStats.reviewCount : 0,
    },
  });
};

reviewSchema.statics.publicClassroomReviews = function (classroomId, options = {}) {
  return this.paginate(
    { classroomId: new mongoose.Types.ObjectId(classroomId), isVisible: true },
    {
      ...defaultPaginateOptions,
      sort:     { createdAt: -1 },
      populate: { path: 'studentId', select: 'name avatarUrl' },
      select:   '-adminNote -reportReason',
      ...options,
    },
  );
};

reviewSchema.statics.ratingBreakdown = function (classroomId) {
  return this.aggregate([
    { $match: { classroomId: new mongoose.Types.ObjectId(classroomId), isVisible: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort:  { _id: -1 } },
  ]);
};

export const Review = mongoose.model('Review', reviewSchema);