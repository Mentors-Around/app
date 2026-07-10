// ─────────────────────────────────────────────────────────────────────────────
// src/models/Test.model.js
// Monthly subject test — MCQ, timed, scoped to a classroom, auto-graded.
// ─────────────────────────────────────────────────────────────────────────────
import mongoose             from 'mongoose';
import mongoosePaginate     from 'mongoose-paginate-v2';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { TEST_STATUS }      from '../constants/enums.js';
import {
  jsonTransform, toObjectOptions, enumField, defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

// ── Question sub-doc ──────────────────────────────────────────────────────────
// `topic` tags the question for weak-area analysis (e.g. "Area and Perimeter").
const questionSchema = new Schema(
  {
    text: {
      type:      String,
      required:  [true, 'Question text is required'],
      trim:      true,
      maxlength: [1000, 'Question cannot exceed 1000 characters'],
    },
    options: {
      type:     [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6,
        message:   'A question must have between 2 and 6 options',
      },
    },
    correctAnswerIndex: {
      type:     Number,
      required: [true, 'Correct answer index is required'],
      min:      0,
    },
    topic: {
      type:      String,
      trim:      true,
      maxlength: [120, 'Topic cannot exceed 120 characters'],
      default:   '',
    },
  },
  { _id: true },
);

const testSchema = new Schema(
  {
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
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subject: {
      type:      String,
      trim:      true,
      maxlength: [120, 'Subject cannot exceed 120 characters'],
      default:   '',
    },
    // Which calendar month this monthly test covers, e.g. "2026-07"
    monthKey: {
      type:     String,
      trim:     true,
      required: [true, 'monthKey is required (format: YYYY-MM)'],
      validate: {
        validator: (v) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v),
        message:   'monthKey must be in YYYY-MM format',
      },
      index: true,
    },
    questions: {
      type:     [questionSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1 && arr.length <= 50,
        message:   'A test must have between 1 and 50 questions',
      },
    },
    durationMinutes: {
      type:    Number,
      default: 30,
      min:     [1, 'Duration must be at least 1 minute'],
      max:     [180, 'Duration cannot exceed 180 minutes'],
    },
    availableFrom: { type: Date, default: null, index: true },
    availableTo:   { type: Date, default: null, index: true },
    status: enumField(TEST_STATUS, TEST_STATUS.DRAFT),
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

testSchema.plugin(mongoosePaginate);
testSchema.plugin(mongooseLeanVirtuals);

testSchema.index({ classroomId: 1, monthKey: 1 }, { unique: true });
testSchema.index({ classroomId: 1, status: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
testSchema.virtual('totalQuestions').get(function () {
  return this.questions?.length || 0;
});
testSchema.virtual('isCurrentlyOpen').get(function () {
  const now = new Date();
  if (this.status !== TEST_STATUS.PUBLISHED) return false;
  if (this.availableFrom && now < this.availableFrom) return false;
  if (this.availableTo && now > this.availableTo) return false;
  return true;
});

// Public/student-safe projection — never leaks correctAnswerIndex before submission.
testSchema.methods.toStudentView = function () {
  return {
    _id:             this._id,
    classroomId:     this.classroomId,
    title:           this.title,
    subject:         this.subject,
    monthKey:        this.monthKey,
    durationMinutes: this.durationMinutes,
    availableFrom:   this.availableFrom,
    availableTo:     this.availableTo,
    totalQuestions:  this.questions.length,
    questions:       this.questions.map((q) => ({
      _id:     q._id,
      text:    q.text,
      options: q.options,
      topic:   q.topic,
    })),
  };
};

export const Test = mongoose.model('Test', testSchema);
