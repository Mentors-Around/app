// src/controllers/notification.controller.js
import mongoose    from 'mongoose';
import { asyncHandler } from '../utils/AsyncHandler.js';
import ApiError         from '../utils/ApiError.js';
import ApiResponse      from '../utils/ApiResponse.js';

const getNotificationModel = async () => {
  const { Notification } = await import('../models/index.js');
  return Notification;
};

// ── GET /notifications — list (paginated, grouped) ────────────────────────────
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const Notification = await getNotificationModel();

  const filter = { userId: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const result = await Notification.paginate(filter, {
    page:  Number(page),
    limit: Math.min(Number(limit), 50),
    sort:  { createdAt: -1 },
    lean:  true,
  });

  const unreadCount = await Notification.unreadCount(req.user._id);
  res.status(200).json(new ApiResponse(200, { ...result, unreadCount }, 'Notifications'));
});

// ── GET /notifications/unread-count ──────────────────────────────────────────
export const getUnreadCount = asyncHandler(async (req, res) => {
  const Notification = await getNotificationModel();
  const count = await Notification.unreadCount(req.user._id);
  res.status(200).json(new ApiResponse(200, { unreadCount: count }, 'Unread count'));
});

// ── PATCH /notifications/:id/read ─────────────────────────────────────────────
export const markAsRead = asyncHandler(async (req, res) => {
  const Notification = await getNotificationModel();
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true },
  );
  if (!n) throw ApiError.notFound('Notification');
  res.status(200).json(new ApiResponse(200, null, 'Marked as read'));
});

// ── PATCH /notifications/read-all ─────────────────────────────────────────────
export const markAllAsRead = asyncHandler(async (req, res) => {
  const Notification = await getNotificationModel();
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

// ── DELETE /notifications/:id ─────────────────────────────────────────────────
export const deleteNotification = asyncHandler(async (req, res) => {
  const Notification = await getNotificationModel();
  await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.status(200).json(new ApiResponse(200, null, 'Notification deleted'));
});

// ── DELETE /notifications — clear all ────────────────────────────────────────
export const clearAllNotifications = asyncHandler(async (req, res) => {
  const Notification = await getNotificationModel();
  await Notification.deleteMany({ userId: req.user._id });
  res.status(200).json(new ApiResponse(200, null, 'All notifications cleared'));
});