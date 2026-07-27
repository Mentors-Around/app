// src/controllers/classroom.controller.js
import mongoose from 'mongoose';
import {
  Classroom, TeacherProfile, Enrollment, Poll, EnrollmentQuery, Review,
} from '../models/index.js';
import { ClassroomService }  from '../services/classroom.service.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { asyncHandler }      from '../utils/AsyncHandler.js';
import ApiError              from '../utils/ApiError.js';
import ApiResponse           from '../utils/ApiResponse.js';
import {
  CLASSROOM_STATUS, CLASSROOM_MODE, CLASSROOM_TYPE, SKILL_LEVEL, POLL_TYPE,
} from '../constants/enums.js';
import logger from '../config/logger.config.js';

// ── POST / — Create classroom ─────────────────────────────────────────────────
export const createClassroom = asyncHandler(async (req, res) => {
  const {
    title, subject, stream, description, tags,
    feesPaise, totalHoursPlanned, startDate, endDate,
    schedule, maxStudents, mode, offlineFacility,
    // New fields
    classroomType = CLASSROOM_TYPE.ACADEMIC,
    skillLevel    = null,
    // Academic-specific (required for academic, optional for hobby)
    academicLevel, minimumQualification, prerequisites = [],
    // Hobby-specific
    minimumAge,
    // Live Class
    meetingPlatform, meetingId, meetingPassword,
  } = req.body;

  if (!title || !subject || !feesPaise || !totalHoursPlanned || !startDate || !endDate || !schedule || !maxStudents) {
    throw ApiError.badRequest('title, subject, feesPaise, totalHoursPlanned, startDate, endDate, schedule, maxStudents are required');
  }

  // Validate classroomType
  if (!Object.values(CLASSROOM_TYPE).includes(classroomType)) {
    throw ApiError.badRequest(`classroomType must be one of: ${Object.values(CLASSROOM_TYPE).join(', ')}`);
  }

  // Academic classrooms require academicLevel
  if (classroomType === CLASSROOM_TYPE.ACADEMIC && !academicLevel) {
    throw ApiError.badRequest('academicLevel is required for academic classrooms (e.g. "Class 10", "JEE Advanced")');
  }

  // Validate skillLevel if provided
  if (skillLevel && !Object.values(SKILL_LEVEL).includes(skillLevel)) {
    throw ApiError.badRequest(`skillLevel must be one of: ${Object.values(SKILL_LEVEL).join(', ')}`);
  }

  // Validate minimumAge for hobby
  if (minimumAge !== undefined && minimumAge !== null && (isNaN(minimumAge) || minimumAge < 0)) {
    throw ApiError.badRequest('minimumAge must be a non-negative number');
  }

  ClassroomService.validateScheduleSlots(schedule);

  if (mode === CLASSROOM_MODE.OFFLINE || mode === CLASSROOM_MODE.HYBRID) {
    ClassroomService.validateOfflineFields({ mode, offlineAddress: offlineFacility?.address });
  }

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (end <= start) throw ApiError.badRequest('End date must be after start date');
  if (start < new Date()) throw ApiError.badRequest('Start date cannot be in the past');

  const normalizedSchedule = schedule.map((slot) => ({
    day:             slot.day ?? slot.dayOfWeek,
    startTime:       slot.startTime,
    endTime:         slot.endTime || slot.startTime,
    durationMinutes: slot.durationMinutes,
  }));

  const tempId    = new mongoose.Types.ObjectId();
  const gmeetLink = mode !== CLASSROOM_MODE.OFFLINE
    ? ClassroomService.generateMeetLink(tempId.toString())
    : null;

  const classroom = await Classroom.create({
    _id:                  tempId,
    teacherId:            req.user._id,
    title:                title.trim(),
    subject:              subject.trim(),
    stream:               stream?.trim() || null,
    description:          description?.trim() || '',
    tags:                 tags || [],
    feesPaise:            Math.round(Number(feesPaise)),
    totalHoursPlanned:    Number(totalHoursPlanned),
    startDate:            start,
    endDate:              end,
    schedule:             normalizedSchedule,
    maxStudents:          Number(maxStudents),
    mode:                 mode || CLASSROOM_MODE.ONLINE,
    offlineFacility:      (mode === CLASSROOM_MODE.OFFLINE || mode === CLASSROOM_MODE.HYBRID) ? offlineFacility : null,
    gmeetLink,
    meetingPlatform:      meetingPlatform || 'Google Meet',
    meetingId:            meetingId || null,
    meetingPassword:      meetingPassword || null,
    status:               CLASSROOM_STATUS.ACTIVE,
    // New fields
    classroomType,
    skillLevel:           skillLevel || null,
    academicLevel:        classroomType === CLASSROOM_TYPE.ACADEMIC ? (academicLevel?.trim() || null) : null,
    minimumQualification: minimumQualification?.trim() || null,
    prerequisites:        Array.isArray(prerequisites) ? prerequisites.filter(Boolean) : [],
    minimumAge:           classroomType === CLASSROOM_TYPE.HOBBY && minimumAge ? Number(minimumAge) : null,
  });

  await TeacherProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $inc: { 'stats.totalClassrooms': 1, 'stats.activeClassrooms': 1 } },
  );

  logger.info('Classroom created', { classroomId: classroom._id, teacherId: req.user._id, classroomType });
  res.status(201).json(new ApiResponse(201, classroom, 'Classroom created'));
});

// ── PATCH /:classroomId — Update classroom ─────────────────────────────────────
export const updateClassroom = asyncHandler(async (req, res) => {
  const classroom = req.resource;

  const {
    title, description, tags, schedule,
    totalHoursPlanned, endDate, maxStudents, offlineFacility,
    skillLevel, minimumQualification, prerequisites, minimumAge,
    academicLevel,
    // ── Live class settings ───────────────────────────────────────────────────
    gmeetLink, meetingPlatform, accessTimeMinutes, meetingId, meetingPassword, sessions,
  } = req.body;

  ClassroomService.validateScheduleUpdate(classroom, { totalPlannedHours: totalHoursPlanned, endDate });

  if (!classroom.canScheduleUpdate()) {
    throw ApiError.badRequest(`Cannot update classroom in status: ${classroom.status}`);
  }

  if (schedule) ClassroomService.validateScheduleSlots(schedule);

  if (skillLevel && !Object.values(SKILL_LEVEL).includes(skillLevel)) {
    throw ApiError.badRequest(`skillLevel must be one of: ${Object.values(SKILL_LEVEL).join(', ')}`);
  }

  const updates = {};
  if (title !== undefined)                updates.title                = title.trim();
  if (description !== undefined)          updates.description          = description.trim();
  if (tags !== undefined)                 updates.tags                 = tags;
  if (schedule !== undefined)             updates.schedule             = schedule;
  if (offlineFacility !== undefined)      updates.offlineFacility      = offlineFacility;
  if (maxStudents !== undefined)          updates.maxStudents          = Number(maxStudents);
  if (skillLevel !== undefined)           updates.skillLevel           = skillLevel || null;
  if (minimumQualification !== undefined) updates.minimumQualification = minimumQualification?.trim() || null;
  if (prerequisites !== undefined)        updates.prerequisites        = prerequisites;
  if (minimumAge !== undefined)           updates.minimumAge           = minimumAge ? Number(minimumAge) : null;
  if (academicLevel !== undefined)        updates.academicLevel        = academicLevel?.trim() || null;
  // Live class link — only meaningful for online/hybrid classrooms
  if (gmeetLink !== undefined)            updates.gmeetLink            = gmeetLink?.trim() || null;
  if (meetingPlatform !== undefined)      updates.meetingPlatform      = meetingPlatform?.trim() || null;
  if (accessTimeMinutes !== undefined)    updates.accessTimeMinutes    = Number(accessTimeMinutes) || 15;
  if (meetingId !== undefined)            updates.meetingId            = meetingId?.trim() || null;
  if (meetingPassword !== undefined)      updates.meetingPassword      = meetingPassword?.trim() || null;
  if (sessions !== undefined)             updates.sessions             = sessions;

  const updated = await Classroom.findByIdAndUpdate(
    classroom._id,
    { $set: updates },
    { new: true, runValidators: true },
  );

  res.status(200).json(new ApiResponse(200, updated, 'Classroom updated'));
});

// ── GET /search — Marketplace search ──────────────────────────────────────────
export const searchClassrooms = asyncHandler(async (req, res) => {
  const {
    query, subject, mode, classroomType, skillLevel,
    minFee, maxFee, minRating, sort, page = 1,
  } = req.query;

  const result = await Classroom.search({
    query,
    subject,
    mode,
    classroomType,
    skillLevel,
    minFee:    minFee    ? Number(minFee)    : undefined,
    maxFee:    maxFee    ? Number(maxFee)    : undefined,
    minRating: minRating ? Number(minRating) : 0,
    sort,
    page:      Number(page),
    limit:     20,
  });

  // If there's a text search query, also search for matching teachers/tutors and students
  let matchedTeachers = [];
  let matchedStudents = [];
  if (query) {
    const { User, TeacherProfile } = await import('../models/index.js');
    const matchedUsers = await User.find({
      role: 'teacher',
      isActive: true,
      deletedAt: null,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } }
      ]
    }).select('_id name username avatarUrl city state').limit(5).lean();

    const teacherUserIds = matchedUsers.map(u => u._id);
    const profiles = await TeacherProfile.find({
      userId: { $in: teacherUserIds },
      verificationStatus: 'approved'
    }).select('userId subjects stats bio experienceYears headline').lean();

    const profileMap = new Map(profiles.map(p => [String(p.userId), p]));
    matchedTeachers = matchedUsers
      .map(u => {
        const p = profileMap.get(String(u._id));
        if (!p) return null;
        return {
          _id: u._id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatarUrl,
          city: u.city,
          state: u.state,
          profile: {
            bio: p.bio,
            experienceYears: p.experienceYears,
            headline: p.headline,
            subjects: p.subjects,
            stats: p.stats
          }
        };
      })
      .filter(Boolean);

    matchedStudents = await User.find({
      role: 'student',
      isActive: true,
      deletedAt: null,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('_id name username avatarUrl').limit(5).lean();
  }

  // Add teachers and students to the API response
  const responseData = {
    ...result,
    teachers: matchedTeachers,
    students: matchedStudents
  };

  res.status(200).json(new ApiResponse(200, responseData, 'Search results'));
});

// ── GET /discover — Personalised feed for logged-in students ──────────────────
export const discoverClassrooms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  let result;
  if (req.user?._id) {
    result = await Classroom.discoverForStudent(req.user._id, {
      page:  Number(page),
      limit: Math.min(Number(limit), 20),
    });
  } else {
    result = await Classroom.search({
      page:  Number(page),
      limit: Math.min(Number(limit), 20),
    });
  }

  res.status(200).json(new ApiResponse(200, result, 'Discover classrooms'));
});

// ── GET /:classroomId — Full classroom detail (public) ────────────────────────
export const getClassroomDetail = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  const [classroom, reviews, ratingBreakdown] = await Promise.all([
    Classroom.findById(classroomId)
      .populate('teacherId', 'name avatarUrl city state')
      .lean({ virtuals: true }),
    Review.publicClassroomReviews(classroomId, { limit: 5 }),
    Review.ratingBreakdown(classroomId),
  ]);

  if (!classroom) throw ApiError.notFound('Classroom');

  // Hide GMeet link from unauthenticated / non-enrolled users
  let enrollmentStatus = null;
  let studentProgress  = null;

  const isClassroomTeacher = req.user && classroom.teacherId?._id?.toString() === req.user._id?.toString();

  if (isClassroomTeacher) {
    // Teacher views their own classroom — full access, no data hidden
    enrollmentStatus = 'teacher_owner';
  } else if (req.user?.role === 'student') {
    const enrollment = await Enrollment.findOne({
      studentId:   req.user._id,
      classroomId,
      status:      'active',
    }).lean();

    if (enrollment) {
      enrollmentStatus = 'enrolled';
      // Surface student progress for the "my learning" detail view
      studentProgress = {
        classesAttended:      enrollment.classesAttended || 0,
        assignmentsCompleted: enrollment.assignmentsCompleted || 0,
      };
    } else {
      // Not enrolled — hide meeting link
      classroom.gmeetLink = undefined;
      classroom.schedule?.forEach((s) => { s.gmeetLink = undefined; });
    }
  } else if (!req.user) {
    classroom.gmeetLink = undefined;
    classroom.schedule?.forEach((s) => { s.gmeetLink = undefined; });
  }

  res.status(200).json(new ApiResponse(200, {
    classroom, reviews, ratingBreakdown, enrollmentStatus, studentProgress,
  }, 'Classroom detail'));
});

// ── POST /:classroomId/early-end ────────────────────────────────────────────────
export const requestEarlyEnd = asyncHandler(async (req, res) => {
  const classroom = req.resource;

  if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
    throw ApiError.badRequest(`Cannot request early end for classroom in status: ${classroom.status}`);
  }

  const isAfterMidpoint = ClassroomService.isAfterMidpoint(
    classroom.stats.hoursCompleted,
    classroom.totalHoursPlanned,
  );
  if (!isAfterMidpoint) {
    throw new ApiError(400, 'Cannot request early end before completing 50% of planned hours', [], 'MIDPOINT_NOT_REACHED');
  }

  const enrolledStudents = await Enrollment.countDocuments({ classroomId: classroom._id, status: 'active' });
  if (enrolledStudents === 0) throw ApiError.badRequest('No enrolled students to vote');

  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const poll = await Poll.create({
    classroomId:   classroom._id,
    teacherId:     req.user._id,
    type:          POLL_TYPE.EARLY_END,
    question:      'Do you approve ending this course early?',
    options:       [{ text: 'Yes, I approve' }, { text: 'No, continue' }],
    expiresAt,
  });

  await Classroom.findByIdAndUpdate(classroom._id, {
    status:              CLASSROOM_STATUS.COMPLETION_PENDING,
    earlyEndRequestedAt: new Date(),
    earlyEndPollId:      poll._id,
  });

  logger.info('Early end requested', { classroomId: classroom._id, pollId: poll._id });
  res.status(201).json(new ApiResponse(201, { poll }, 'Early-end vote initiated'));
});

// ── POST /:classroomId/media ────────────────────────────────────────────────────
export const uploadClassroomMedia = asyncHandler(async (req, res) => {
  const classroom = req.resource;
  if (classroom.mode !== CLASSROOM_MODE.OFFLINE) {
    throw ApiError.badRequest('Media upload is only for offline classrooms');
  }
  if (!req.files) throw ApiError.badRequest('No files uploaded');

  const photos = req.files.photos || [];
  const videos = req.files.videos || [];

  const [uploadedPhotos, uploadedVideos] = await Promise.all([
    Promise.all(photos.map((f, i) => CloudinaryService.uploadClassroomMedia(f.buffer, classroom._id, `photo_${i}`))),
    Promise.all(videos.map((f, i) => CloudinaryService.uploadClassroomMedia(f.buffer, classroom._id, `video_${i}`))),
  ]);

  const photoUrls = uploadedPhotos.map((r) => r.secure_url);
  const videoUrls = uploadedVideos.map((r) => r.secure_url);

  await Classroom.findByIdAndUpdate(classroom._id, {
    $push: {
      'offlineFacility.photoUrls': { $each: photoUrls },
      'offlineFacility.videoUrls': { $each: videoUrls },
    },
  });

  res.status(200).json(new ApiResponse(200, { photoUrls, videoUrls }, 'Media uploaded'));
});

// ── POST /:classroomId/vote-early-end ──────────────────────────────────────────
export const voteEarlyEnd = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { approve }     = req.body;

  if (typeof approve !== 'boolean') throw ApiError.badRequest('approve must be a boolean');

  const enrollment = await Enrollment.findOne({ studentId: req.user._id, classroomId, status: 'active' });
  if (!enrollment) throw ApiError.forbidden('You are not enrolled in this classroom');

  if (enrollment.earlyEndVote !== null && enrollment.earlyEndVote !== undefined) {
    throw new ApiError(409, 'You have already voted', [], 'ALREADY_VOTED');
  }

  await enrollment.castEarlyEndVote(approve);

  const summary  = await Enrollment.earlyEndVoteSummary(classroomId);
  const approved = ClassroomService.isEarlyEndApproved(summary.approveCount, summary.total);

  if (approved) {
    await Classroom.findByIdAndUpdate(classroomId, {
      status:             CLASSROOM_STATUS.COMPLETED,
      completedAt:        new Date(),
      completionCase:     'case_1',
      earlyEndApprovedAt: new Date(),
    });
    const classroom = await Classroom.findById(classroomId).select('earlyEndPollId');
    if (classroom?.earlyEndPollId) {
      const poll = await Poll.findById(classroom.earlyEndPollId);
      if (poll?.close) await poll.close();
    }
  }

  res.status(200).json(new ApiResponse(200, { voteSummary: summary, earlyEndApproved: approved }, 'Vote recorded'));
});

// ── GET /:classroomId/students — Teacher views enrolled students ───────────────
export const getEnrolledStudents = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const result = await Enrollment.paginate(
    { classroomId, status: 'active' },
    {
      page:     Number(page),
      limit:    Math.min(Number(limit), 50),
      populate: { path: 'studentId', select: 'name phone avatarUrl isMinor' },
      select:   'studentId classesAttended assignmentsCompleted feesPaidPaise createdAt earlyEndVote',
    },
  );

  res.status(200).json(new ApiResponse(200, result, 'Enrolled students'));
});
// ── POST /:classroomId/report — Report from classroom context ─────────────────
// Both enrolled students AND the classroom teacher can file a report.
// Students report teachers; teachers report students.
export const reportFromClassroom = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { targetType, targetId, reportType, description, evidenceUrls = [] } = req.body;

  if (!targetType || !targetId || !reportType || !description?.trim()) {
    throw ApiError.badRequest('targetType, targetId, reportType and description are required');
  }

  // Validate reporter's connection to this classroom
  const classroom = await Classroom.findById(classroomId).select('teacherId status').lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  const isClassroomTeacher = classroom.teacherId.toString() === req.user._id.toString();

  if (!isClassroomTeacher) {
    // Must be an enrolled student
    const enrolled = await Enrollment.findOne({ studentId: req.user._id, classroomId }).lean();
    if (!enrolled) throw ApiError.forbidden('You must be enrolled or be the teacher to report from this classroom');
  }

  const { Report } = await import('../models/index.js');

  const report = await Report.create({
    reporterId:   req.user._id,
    reportType,
    targetType,
    targetId,
    classroomId,
    description:  description.trim(),
    evidenceUrls,
  });

  logger.warn('CLASSROOM_REPORT_FILED', {
    reportId:   report._id,
    reporterId: req.user._id,
    classroomId,
    targetType,
    targetId,
  });

  // Non-blocking admin alert
  const adminPhones = (process.env.ADMIN_ALERT_PHONES || '').split(',').filter(Boolean);
  if (adminPhones.length) {
    const { NotificationService } = await import('../services/notification.service.js');
    NotificationService.notifyAdminReport(adminPhones, reportType, report._id).catch(() => {});
  }

  res.status(201).json(new ApiResponse(201, { reportId: report._id }, 'Report submitted. Our team will review it.'));
});

// ── POST /:classroomId/join — Student joins class session (marks attendance) ──
export const joinClass = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  const classroom = await Classroom.findById(classroomId)
    .select('gmeetLink meetingPlatform meetingId meetingPassword offlineFacility mode status teacherId title schedule')
    .lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
    throw new ApiError(400, 'This classroom is not currently active', [], 'CLASSROOM_INACTIVE');
  }

  // Verify the requester is enrolled
  const enrollment = await Enrollment.findOne({
    studentId:   req.user._id,
    classroomId,
    status:      'active',
  });

  if (!enrollment) {
    throw ApiError.forbidden('You are not enrolled in this classroom');
  }

  // Increment classes attended (idempotent within the same calendar day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastAttended = enrollment.lastAttendedAt ? new Date(enrollment.lastAttendedAt) : null;
  if (lastAttended) lastAttended.setHours(0, 0, 0, 0);

  const alreadyMarkedToday = lastAttended && lastAttended.getTime() === today.getTime();

  if (!alreadyMarkedToday) {
    await Enrollment.findByIdAndUpdate(enrollment._id, {
      $inc: { classesAttended: 1 },
      lastAttendedAt: new Date(),
    });
    logger.info('Attendance marked', { classroomId, studentId: req.user._id });
  }

  const meetingLink = classroom.gmeetLink ||
    (classroom.schedule && classroom.schedule.find(s => s.isConducted === false)?.gmeetLink) ||
    null;

  res.status(200).json(new ApiResponse(200, {
    meetingLink,
    meetingPlatform: classroom.meetingPlatform || 'Google Meet',
    meetingId:       classroom.meetingId || null,
    meetingPassword: classroom.meetingPassword || null,
    mode:            classroom.mode,
    offlineAddress:  classroom.offlineFacility?.address || null,
    classroomTitle:  classroom.title,
    attendanceMarked: !alreadyMarkedToday,
  }, alreadyMarkedToday ? 'Attendance already recorded for today' : 'Attendance marked successfully'));
});