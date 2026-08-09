// src/controllers/announcement.controller.js
import { Announcement, Enrollment, Classroom } from '../models/index.js';
import { ENROLLMENT_STATUS }   from '../constants/enums.js';
import { NotificationService } from '../services/notification.service.js';
import { EmailService }        from '../services/email.service.js';
import { asyncHandler }        from '../utils/AsyncHandler.js';
import ApiError                from '../utils/ApiError.js';
import ApiResponse             from '../utils/ApiResponse.js';
import { blockAllPII }        from '../utils/pil.util.js';
import logger                  from '../config/logger.config.js';

// ── POST /classrooms/:classroomId/announcements ───────────────────────────────
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { title, body, attachmentUrls = [] } = req.body;

  if (!title?.trim()) throw ApiError.badRequest('title is required');
  if (!body?.trim())  throw ApiError.badRequest('body is required');

  // PII guard
  blockAllPII({ title, announcement: body });

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');
  if (classroom.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the classroom teacher can post announcements');
  }

  const announcement = await Announcement.create({
    classroomId,
    teacherId:      req.user._id,
    title:          title.trim(),
    body:           body.trim(),
    attachmentUrls,
  });

  // Non-blocking: SMS + email notification to enrolled students
  const { User } = await import('../models/index.js');
  Enrollment.find({ classroomId, status: ENROLLMENT_STATUS.ACTIVE })
    .select('studentId').lean()
    .then(async (enrollments) => {
      const students = await User.find({
        _id: { $in: enrollments.map((e) => e.studentId) },
      }).select('phone email name').lean();
      const excerpt = body.length > 80 ? `${body.slice(0, 77)}...` : body;
      // SMS / in-app
      NotificationService.notifyNewAnnouncement(students, { title: classroom.title }, excerpt).catch(() => {});
      // Email to each enrolled student who has an email address
      students.forEach((student) => {
        if (student.email) {
          EmailService.sendClassroomNotification(student.email, {
            studentName:    student.name || 'Student',
            classroomTitle: classroom.title,
            eventType:      'announcement',
            eventTitle:     title.trim(),
            eventBody:      excerpt,
          });
        }
      });
    });

  logger.info('Announcement created', { classroomId, announcementId: announcement._id });
  res.status(201).json(new ApiResponse(201, announcement, 'Announcement posted'));
});

// ── GET /classrooms/:classroomId/announcements ────────────────────────────────
export const getAnnouncements = asyncHandler(async (req, res) => {
  const { classroomId }   = req.params;
  const { page = 1, limit = 20 } = req.query;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  const isTeacher = req.user?.role === 'teacher' && classroom.teacherId.toString() === req.user._id.toString();

  if (!isTeacher) {
    const enrolled = await Enrollment.findOne({ studentId: req.user._id, classroomId, status: ENROLLMENT_STATUS.ACTIVE }).lean();
    if (!enrolled) throw ApiError.forbidden('You must be enrolled to view announcements');
  }

  const result = await Announcement.paginate(
    { classroomId },
    { page: Number(page), limit: Math.min(Number(limit), 50), sort: { createdAt: -1 } },
  );

  res.status(200).json(new ApiResponse(200, result, 'Announcements'));
});

// ── DELETE /classrooms/:classroomId/announcements/:announcementId ─────────────
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { classroomId, announcementId } = req.params;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');
  if (classroom.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the classroom teacher can delete announcements');
  }

  const announcement = await Announcement.findOne({ _id: announcementId, classroomId });
  if (!announcement) throw ApiError.notFound('Announcement');

  await announcement.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Announcement deleted'));
});