// ─────────────────────────────────────────────────────────────────────────────
// src/models/TestAttempt.model.js
// A student's attempt at a Test — stores answers, auto-computed score & weak areas.
// ─────────────────────────────────────────────────────────────────────────────
import mongoose             from 'mongoose';
import mongoosePaginate     from 'mongoose-paginate-v2';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { TEST_ATTEMPT_STATUS } from '../constants/enums.js';
import {
  jsonTransform, toObjectOptions, enumField, defaultPaginateOptions,
} from '../utils/schema.util.js';

const { Schema } = mongoose;

const answerSchema = new Schema(
  {
    questionId:        { type: Schema.Types.ObjectId, required: true },
    selectedIndex:      { type: Number, default: null },
    correctAnswerIndex: { type: Number, required: true },
    isCorrect:          { type: Boolean, required: true },
    topic:              { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const testAttemptSchema = new Schema(
  {
    testId: {
      type:     Schema.Types.ObjectId,
      ref:      'Test',
      required: true,
      index:    true,
    },
    classroomId: {
      type:     Schema.Types.ObjectId,
      ref:      'Classroom',
      required: true,
      index:    true,
    },
    studentId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    status:      enumField(TEST_ATTEMPT_STATUS, TEST_ATTEMPT_STATUS.IN_PROGRESS),
    startedAt:   { type: Date, default: () => new Date() },
    submittedAt: { type: Date, default: null },
    answers:     { type: [answerSchema], default: [] },
    score:       { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, required: true, min: 1 },
    weakTopics:  { type: [String], default: [] },
    percentileInCity: { type: Number, default: null }, // computed lazily, best-effort
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

testAttemptSchema.plugin(mongoosePaginate);
testAttemptSchema.plugin(mongooseLeanVirtuals);

// One attempt per student per test — tests are meant to be taken once.
testAttemptSchema.index({ testId: 1, studentId: 1 }, { unique: true });
testAttemptSchema.index({ studentId: 1, createdAt: -1 });
testAttemptSchema.index({ classroomId: 1, testId: 1 });

// ── Instance methods ──────────────────────────────────────────────────────────
/**
 * Grade the attempt against the source Test's answer key and persist.
 * `submittedAnswers` = [{ questionId, selectedIndex }]
 */
testAttemptSchema.methods.gradeAndSubmit = async function (test, submittedAnswers, isAutoSubmit = false) {
  const answerMap = new Map(submittedAnswers.map((a) => [String(a.questionId), a.selectedIndex]));
  const wrongTopics = new Set();
  let score = 0;

  const answers = test.questions.map((q) => {
    const selectedIndex = answerMap.has(String(q._id)) ? answerMap.get(String(q._id)) : null;
    const isCorrect = selectedIndex !== null && selectedIndex === q.correctAnswerIndex;
    if (isCorrect) score += 1;
    else if (q.topic) wrongTopics.add(q.topic);

    return {
      questionId:         q._id,
      selectedIndex,
      correctAnswerIndex: q.correctAnswerIndex,
      isCorrect,
      topic:              q.topic || '',
    };
  });

  this.answers        = answers;
  this.score           = score;
  this.totalQuestions  = test.questions.length;
  this.weakTopics      = Array.from(wrongTopics);
  this.status          = isAutoSubmit ? TEST_ATTEMPT_STATUS.AUTO_SUBMITTED : TEST_ATTEMPT_STATUS.SUBMITTED;
  this.submittedAt     = new Date();
  return this.save();
};

export const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);
