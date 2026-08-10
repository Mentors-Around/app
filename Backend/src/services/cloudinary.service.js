import { Readable } from "stream";
import cloudinary from "../config/cloudinary.config.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.config.js";
import { CLOUDINARY_FOLDERS } from "../constants/app.constants.js";

export const CloudinaryService = {
  /**
   * Upload a file buffer to Cloudinary.
   * @param {Buffer} buffer
   * @param {Object} options  - folder, resource_type, public_id, transformation, etc.
   */
  async uploadBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: options.folder || CLOUDINARY_FOLDERS.MATERIALS,
          ...options,
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error", { error: error.message });
            reject(new ApiError(500, "File upload failed.", [], "UPLOAD_FAILED"));
          } else {
            resolve(result);
          }
        }
      );
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(stream);
    });
  },

  /**
   * Upload a profile image with automatic resizing.
   */
  async uploadProfileImage(buffer, userId) {
    return this.uploadBuffer(buffer, {
      folder: CLOUDINARY_FOLDERS.PROFILE_IMAGES,
      public_id: `profile_${userId}`,
      overwrite: true,
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });
  },

  /**
   * Upload a KYC document.
   */
  async uploadKYCDocument(buffer, userId, docType) {
    return this.uploadBuffer(buffer, {
      folder: CLOUDINARY_FOLDERS.KYC_DOCUMENTS,
      public_id: `kyc_${userId}_${docType}_${Date.now()}`,
    });
  },

  /**
   * Upload classroom media (images/videos for offline classrooms).
   */
  async uploadClassroomMedia(buffer, classroomId, index = 0) {
    return this.uploadBuffer(buffer, {
      folder: CLOUDINARY_FOLDERS.CLASSROOM_MEDIA,
      public_id: `classroom_${classroomId}_${index}_${Date.now()}`,
    });
  },

  /**
   * Upload course material (PDF/PPT).
   */
  async uploadMaterial(buffer, classroomId, fileName) {
    return this.uploadBuffer(buffer, {
      folder: CLOUDINARY_FOLDERS.MATERIALS,
      public_id: `material_${classroomId}_${Date.now()}`,
      use_filename: true,
      unique_filename: false,
    });
  },

  /**
   * Upload assignment submission.
   */
  async uploadSubmission(buffer, assignmentId, studentId) {
    return this.uploadBuffer(buffer, {
      folder: CLOUDINARY_FOLDERS.SUBMISSION_FILES,
      public_id: `sub_${assignmentId}_${studentId}_${Date.now()}`,
    });
  },

  /**
   * Delete an asset by public_id or URL.
   */
  async delete(publicIdOrUrl, resourceType = "image") {
    try {
      const publicId = this.extractPublicId(publicIdOrUrl);
      if (!publicId) return null;
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      logger.info("Cloudinary asset deleted", { publicId });
      return result;
    } catch (err) {
      logger.error("Cloudinary delete error", { error: err.message });
      return null;
    }
  },

  /**
   * Delete multiple assets in bulk.
   */
  async deleteMany(publicIds, resourceType = "image") {
    if (!publicIds?.length) return;
    try {
      return await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
    } catch (err) {
      logger.error("Cloudinary bulk delete error", { error: err.message });
      return null;
    }
  },

  /**
   * Extract public_id from a Cloudinary URL, preserving folder prefix.
   * e.g. https://res.cloudinary.com/demo/image/upload/v123/trueed/profiles/profile_abc.jpg
   *   → trueed/profiles/profile_abc
   */
  extractPublicId(url) {
    if (!url) return null;
    if (!url.includes("cloudinary.com")) return url; // already a public_id
    try {
      const uploadIdx = url.indexOf("/upload/");
      if (uploadIdx === -1) return null;
      const afterUpload = url.slice(uploadIdx + 8); // skip "/upload/"
      // Strip version prefix (v123456/)
      const withoutVersion = afterUpload.replace(/^v\d+\//, "");
      // Strip file extension
      return withoutVersion.replace(/\.[^/.]+$/, "");
    } catch {
      return null;
    }
  },
};
