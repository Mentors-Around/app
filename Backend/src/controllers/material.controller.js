// src/controllers/material.controller.js
import { Material, Enrollment, Classroom } from '../models/index.js';
import { CloudinaryService }   from '../services/cloudinary.service.js';
import { NotificationService } from '../services/notification.service.js';
import { EmailService }        from '../services/email.service.js';
import { asyncHandler }        from '../utils/AsyncHandler.js';
import ApiError               from '../utils/ApiError.js';
import ApiResponse            from '../utils/ApiResponse.js';
import { MATERIAL_TYPE, ENROLLMENT_STATUS } from '../constants/enums.js';
import { CLOUDINARY_FOLDERS } from '../constants/app.constants.js';
import logger                 from '../config/logger.config.js';

// ── POST /classrooms/:classroomId/materials ───────────────────────────────────
export const uploadMaterial = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { title, description = '', type = MATERIAL_TYPE.PDF, linkUrl } = req.body;

  if (!title?.trim()) throw ApiError.badRequest('title is required');

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');
  if (classroom.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the classroom teacher can upload materials');
  }

  let fileUrl = linkUrl?.trim() || null;
  let mimeType = null;
  let fileSizeBytes = null;

  if (req.files && req.files.length > 0) {
    const uploadResults = await Promise.all(
      req.files.map((f) =>
        CloudinaryService.uploadMaterial(f.buffer, classroomId, f.originalname)
      )
    );

    // Create a Material doc per file
    const materials = await Material.insertMany(
      uploadResults.map((result, i) => ({
        classroomId,
        teacherId:   req.user._id,
        title:       req.files.length > 1 ? `${title.trim()} (${i + 1})` : title.trim(),
        description: description.trim(),
        type:        req.files[i].mimetype.includes('pdf') ? MATERIAL_TYPE.PDF : MATERIAL_TYPE.PPT,
        fileUrl:     result.secure_url,
        cloudinaryPublicId: result.public_id,
        mimeType:    req.files[i].mimetype,
        fileSizeBytes: req.files[i].size,
      }))
    );

    // Non-blocking: SMS + email notifications to enrolled students
    const { User } = await import('../models/index.js');
    Enrollment.find({ classroomId, status: ENROLLMENT_STATUS.ACTIVE })
      .select('studentId').lean()
      .then(async (enrollments) => {
        const students = await User.find({
          _id: { $in: enrollments.map((e) => e.studentId) },
        }).select('phone email name').lean();
        NotificationService.notifyNewMaterial(students, { title: classroom.title }, title.trim()).catch(() => {});
        // Email each enrolled student
        students.forEach((student) => {
          if (student.email) {
            EmailService.sendClassroomNotification(student.email, {
              studentName:    student.name || 'Student',
              classroomTitle: classroom.title,
              eventType:      'material',
              eventTitle:     title.trim(),
              eventBody:      description?.trim() || '',
            });
          }
        });
      });

    logger.info('Materials uploaded', { classroomId, count: materials.length });
    return res.status(201).json(new ApiResponse(201, materials, 'Materials uploaded'));
  }

  // Link-type material (no file upload)
  if (type === MATERIAL_TYPE.LINK) {
    if (!fileUrl) throw ApiError.badRequest('linkUrl is required for link-type material');
    const material = await Material.create({
      classroomId,
      teacherId:   req.user._id,
      title:       title.trim(),
      description: description.trim(),
      type:        MATERIAL_TYPE.LINK,
      fileUrl,
    });
    return res.status(201).json(new ApiResponse(201, material, 'Material added'));
  }

  throw ApiError.badRequest('No files uploaded and no linkUrl provided');
});

// ── GET /classrooms/:classroomId/materials ────────────────────────────────────
export const getClassroomMaterials = asyncHandler(async (req, res) => {
  const { classroomId }      = req.params;
  const { page = 1, limit = 20, type } = req.query;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');

  const isTeacher = req.user?.role === 'teacher' && classroom.teacherId.toString() === req.user._id.toString();

  if (!isTeacher) {
    const enrolled = await Enrollment.findOne({ studentId: req.user._id, classroomId, status: ENROLLMENT_STATUS.ACTIVE }).lean();
    if (!enrolled) throw ApiError.forbidden('You must be enrolled to access materials');
  }

  const filter = { classroomId };
  if (type) filter.type = type;

  const result = await Material.paginate(filter, {
    page: Number(page), limit: Math.min(Number(limit), 50),
    sort: { createdAt: -1 },
  });

  res.status(200).json(new ApiResponse(200, result, 'Materials'));
});

// ── DELETE /classrooms/:classroomId/materials/:materialId ─────────────────────
export const deleteMaterial = asyncHandler(async (req, res) => {
  const { classroomId, materialId } = req.params;

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw ApiError.notFound('Classroom');
  if (classroom.teacherId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the classroom teacher can delete materials');
  }

  const material = await Material.findOne({ _id: materialId, classroomId });
  if (!material) throw ApiError.notFound('Material');

  // Remove from Cloudinary if stored there
  if (material.cloudinaryPublicId) {
    CloudinaryService.delete(material.cloudinaryPublicId, 'raw').catch(() => {});
  }

  await material.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Material deleted'));
});