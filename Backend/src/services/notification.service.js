// ─────────────────────────────────────────────────────────────────────────────
// src/services/notification.service.js
// Domain-level notification dispatcher.
// Persists to Notification collection + sends SMS/push in parallel.
// ─────────────────────────────────────────────────────────────────────────────
import logger       from '../config/logger.config.js';
import { SmsService } from './sms.service.js';
import { paiseToRupees } from '../utils/finance.util.js';

const pushStub = async (fcmTokens, { title, body }) => {
  if (!fcmTokens?.length) return;
  logger.info('[PUSH STUB]', { title, tokenCount: fcmTokens.length, body });
  // TODO: Firebase Admin SDK
};

// Lazy-load Notification model to avoid circular import at boot
const dispatch = async (userId, type, title, message, data = {}) => {
  if (!userId) return;
  try {
    const { Notification } = await import('../models/index.js');
    await Notification.dispatch(userId, type, title, message, data);
  } catch (err) {
    logger.error('[Notification] dispatch failed', { userId, type, error: err.message });
  }
};

export const NotificationService = {
  // ── Primitives ──────────────────────────────────────────────────────────────
  async sendSms(phone, message) { return SmsService.send(phone, message); },
  async sendPush(fcmTokens, payload) { return pushStub(fcmTokens, payload); },

  // ── Auth ────────────────────────────────────────────────────────────────────
  async notifyTeacherApproved(teacher) {
    await Promise.allSettled([
      this.sendSms(teacher.phone, `Congratulations! Your TrueEd teacher account has been approved. You can now create classrooms.`),
      dispatch(teacher._id, 'kyc_approved', 'Account Approved!', 'Your TrueEd teacher account has been approved. Start creating classrooms.'),
    ]);
  },

  async notifyTeacherRejected(teacher, reason = '') {
    await Promise.allSettled([
      this.sendSms(teacher.phone, `Your TrueEd teacher application was rejected. ${reason ? `Reason: ${reason}.` : ''} Contact support for help.`),
      dispatch(teacher._id, 'kyc_rejected', 'Application Rejected', `Your teacher application was rejected. ${reason ? `Reason: ${reason}` : 'Contact support for details.'}`),
    ]);
  },

  // ── Query flow ──────────────────────────────────────────────────────────────
  async notifyTeacherNewQuery(teacher, student, classroom) {
    await Promise.allSettled([
      this.sendSms(teacher.phone, `New enrollment request from ${student.name} for "${classroom.title}". Log in to respond.`),
      dispatch(teacher._id, 'query_enrolled', 'New Enrollment Request', `${student.name} wants to join your classroom "${classroom.title}". You have 24 hours to respond.`, { classroomId: classroom._id }),
    ]);
  },

  async notifyStudentQueryAccepted(student, classroom) {
    await Promise.allSettled([
      this.sendSms(student.phone, `Your request for "${classroom.title}" was accepted! You have 24 hours to enroll by paying the fees.`),
      dispatch(student._id, 'query_accepted', 'Query Accepted!', `Your enrollment request for "${classroom.title}" was accepted. Enroll within 24 hours.`, { classroomId: classroom._id }),
    ]);
  },

  async notifyStudentQueryRejected(student, classroom) {
    await Promise.allSettled([
      this.sendSms(student.phone, `Your request for "${classroom.title}" was rejected. 1 token has been refunded to your wallet.`),
      dispatch(student._id, 'query_rejected', 'Query Rejected', `Your enrollment request for "${classroom.title}" was rejected. 1 token has been refunded.`, { classroomId: classroom._id }),
    ]);
  },

  async notifyStudentQueryExpired(student, classroom) {
    await Promise.allSettled([
      this.sendSms(student.phone, `Your request for "${classroom.title}" expired (no teacher response in 24 hours). 1 token refunded.`),
      dispatch(student._id, 'query_expired', 'Request Expired', `Your enrollment request for "${classroom.title}" expired as the teacher didn't respond in 24 hours. 1 token refunded.`, { classroomId: classroom._id }),
    ]);
  },

  // ── Enrollment ──────────────────────────────────────────────────────────────
  async notifyEnrollmentConfirmed(student, teacher, classroom) {
    await Promise.allSettled([
      this.sendSms(student.phone, `Enrollment confirmed for "${classroom.title}"! Check your dashboard for the schedule.`),
      dispatch(student._id, 'query_enrolled', 'Enrollment Confirmed!', `You are now enrolled in "${classroom.title}". Check your dashboard for schedule.`, { classroomId: classroom._id }),
      this.sendSms(teacher.phone, `${student.name} has enrolled in your classroom "${classroom.title}".`),
    ]);
  },

  // ── Announcements ────────────────────────────────────────────────────────────
  async notifyAnnouncement(students, classroom, announcementTitle) {
    const msg = `New announcement in "${classroom.title}": ${announcementTitle}`;
    await Promise.allSettled([
      ...students.map((s) => this.sendSms(s.phone, msg)),
      ...students.map((s) => dispatch(s._id, 'announcement', 'New Announcement', msg, { classroomId: classroom._id })),
    ]);
  },

  async notifyDoubtAnswered(student, classroom, topic) {
    await Promise.allSettled([
      this.sendSms(student.phone, `Your doubt on "${topic}" in "${classroom.title}" has been answered.`),
      dispatch(student._id, 'doubt_answered', 'Doubt Answered', `Your doubt on "${topic}" in "${classroom.title}" has been answered.`, { classroomId: classroom._id }),
    ]);
  },

  async notifyClassReminder(students, classroom, scheduledAt) {
    const time = new Date(scheduledAt).toLocaleString('en-IN');
    const msg  = `Reminder: Class for "${classroom.title}" starts at ${time}.`;
    await Promise.allSettled([
      ...students.map((s) => this.sendSms(s.phone, msg)),
      ...students.map((s) => dispatch(s._id, 'upcoming_class', 'Class Reminder', msg, { classroomId: classroom._id })),
    ]);
  },

  async notifyExtraClassApproved(teacher, classroom) {
    await Promise.allSettled([
      this.sendSms(teacher.phone, `Your extra class request for "${classroom.title}" has been approved by admin.`),
      dispatch(teacher._id, 'extra_class_approved', 'Extra Class Approved', `Your extra class request for "${classroom.title}" has been approved.`, { classroomId: classroom._id }),
    ]);
  },

  async notifyExtraClassRejected(teacher, classroom) {
    await Promise.allSettled([
      this.sendSms(teacher.phone, `Your extra class request for "${classroom.title}" was rejected by admin.`),
      dispatch(teacher._id, 'extra_class_approved', 'Extra Class Rejected', `Your extra class request for "${classroom.title}" was rejected by admin.`, { classroomId: classroom._id }),
    ]);
  },

  async notifyEarlyEndVoteStarted(students, classroom) {
    const msg = `Vote to end "${classroom.title}" early is now open. Log in to cast your vote.`;
    await Promise.allSettled([
      ...students.map((s) => this.sendSms(s.phone, msg)),
      ...students.map((s) => dispatch(s._id, 'early_end_poll', 'Early Completion Vote', msg, { classroomId: classroom._id })),
    ]);
  },

  async notifyCourseCompleted(students, teacher, classroom) {
    const studentMsg = `"${classroom.title}" has been marked as completed. Thank you for learning!`;
    await Promise.allSettled([
      ...students.map((s) => this.sendSms(s.phone, studentMsg)),
      ...students.map((s) => dispatch(s._id, 'classroom_completed', 'Course Completed!', studentMsg, { classroomId: classroom._id })),
      this.sendSms(teacher.phone, `Your classroom "${classroom.title}" has been marked as completed.`),
      dispatch(teacher._id, 'classroom_completed', 'Classroom Completed', `Your classroom "${classroom.title}" has been completed successfully.`, { classroomId: classroom._id }),
    ]);
  },

  async notifyTeacherDepositCharged(teacher, amountPaise, classroom) {
    const msg = `₹${paiseToRupees(amountPaise)} (5% deposit) deducted from your TrueEd wallet for accepting a student in "${classroom.title}".`;
    await Promise.allSettled([
      this.sendSms(teacher.phone, msg),
      dispatch(teacher._id, 'payment_receipt', 'Deposit Deducted', msg, { classroomId: classroom._id }),
    ]);
  },

  async notifyTeacherDepositRefunded(teacher, amountPaise) {
    const msg = `₹${paiseToRupees(amountPaise)} deposit refunded to your wallet as the student did not enroll.`;
    await Promise.allSettled([
      this.sendSms(teacher.phone, msg),
      dispatch(teacher._id, 'payment_receipt', 'Deposit Refunded', msg),
    ]);
  },

  async notifyAdminReport(adminPhones, reportType, reportId) {
    const msg = `New report (${reportType}) filed on TrueEd. Report ID: ${reportId}. Review in admin panel.`;
    await Promise.allSettled(adminPhones.map((p) => this.sendSms(p, msg)));
  },

  async notifyAssignmentPublished(students, classroom, assignmentTitle) {
    const msg = `New assignment in "${classroom.title}": ${assignmentTitle}. Check your dashboard.`;
    await Promise.allSettled([
      ...students.map((s) => dispatch(s._id, 'assignment_published', 'New Assignment', msg, { classroomId: classroom._id })),
    ]);
  },

  async notifyAssignmentGraded(student, classroom, grade) {
    const msg = `Your assignment in "${classroom.title}" has been graded. Score: ${grade}.`;
    await Promise.allSettled([
      this.sendSms(student.phone, msg),
      dispatch(student._id, 'assignment_graded', 'Assignment Graded', msg, { classroomId: classroom._id }),
    ]);
  },
};