// src/models/Notification.model.js
import mongoose         from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { jsonTransform, toObjectOptions } from '../utils/schema.util.js';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'query_accepted', 'query_rejected', 'query_expired', 'query_enrolled',
        'announcement', 'doubt_answered', 'assignment_published', 'assignment_graded',
        'payment_receipt', 'kyc_approved', 'kyc_rejected',
        'upcoming_class', 'class_rescheduled', 'extra_class_approved',
        'classroom_completed', 'early_end_poll', 'early_end_approved',
        'report_resolved', 'system',
      ],
      required: true,
      index:    true,
    },
    title:   { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    // Optional deep-link data for frontend routing
    data: {
      classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
      queryId:     { type: Schema.Types.ObjectId, ref: 'EnrollmentQuery', default: null },
      doubtId:     { type: Schema.Types.ObjectId, ref: 'Doubt', default: null },
      paymentId:   { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
      url:         { type: String, default: null },
    },
    isRead:    { type: Boolean, default: false, index: true },
    readAt:    { type: Date,    default: null },
  },
  {
    timestamps: true,
    toJSON:     jsonTransform,
    toObject:   toObjectOptions,
  },
);

notificationSchema.plugin(mongoosePaginate);
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

// ── Static: create and dispatch ───────────────────────────────────────────────
notificationSchema.statics.dispatch = async function (userId, type, title, message, data = {}) {
  try {
    return await this.create({ userId, type, title, message, data });
  } catch (err) {
    // Never crash the main flow if notification creation fails
    const logger = (await import('../config/logger.config.js')).default;
    logger.error('Notification dispatch failed', { userId, type, error: err.message });
    return null;
  }
};

notificationSchema.statics.unreadCount = function (userId) {
  return this.countDocuments({ userId, isRead: false });
};

export const Notification = mongoose.model('Notification', notificationSchema);