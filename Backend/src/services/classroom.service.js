// ─────────────────────────────────────────────────────────────────────────────
// src/services/classroom.service.js
// Domain logic for classroom creation, schedule validation, and GMeet.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";
import { GMEET_BASE_URL, QUERY_LIMITS } from "../constants/app.constants.js";
import { CLASSROOM_MODE } from "../constants/enums.js";

export const ClassroomService = {
  /**
   * Validate schedule slots for consistency.
   * Each slot: { dayOfWeek (0-6), startTime "HH:MM", durationMinutes }
   */
  validateScheduleSlots(slots) {
    if (!Array.isArray(slots) || slots.length === 0) {
      throw ApiError.badRequest("At least one schedule slot is required.", "SCHEDULE_EMPTY");
    }

    for (const slot of slots) {
      const { dayOfWeek, startTime, durationMinutes } = slot;

      if (dayOfWeek < 0 || dayOfWeek > 6) {
        throw ApiError.badRequest(`Invalid dayOfWeek: ${dayOfWeek}. Must be 0-6.`, "INVALID_SLOT");
      }

      if (!/^\d{2}:\d{2}$/.test(startTime)) {
        throw ApiError.badRequest(`Invalid startTime format: ${startTime}. Use HH:MM.`, "INVALID_SLOT");
      }

      if (!durationMinutes || durationMinutes < 0) {
        throw ApiError.badRequest(
          "Each class must have a valid duration.",
          "INVALID_DURATION"
        );
      }
    }
  },

  /**
   * Validate that a teacher isn't reducing committed hours or extending duration.
   * Current rule: can change slot times but not reduce totalPlannedHours or extend endDate.
   */
  validateScheduleUpdate(existingClassroom, update) {
    if (
      update.totalPlannedHours !== undefined &&
      update.totalPlannedHours < existingClassroom.totalPlannedHours
    ) {
      throw ApiError.badRequest(
        "You cannot reduce the total planned hours of an active classroom.",
        "HOURS_REDUCTION_FORBIDDEN"
      );
    }

    if (
      update.endDate !== undefined &&
      new Date(update.endDate) > new Date(existingClassroom.endDate)
    ) {
      throw ApiError.badRequest(
        "You cannot extend the course end date.",
        "DATE_EXTENSION_FORBIDDEN"
      );
    }
  },

  /**
   * Check if a classroom has completed more than 50% of planned hours.
   */
  isAfterMidpoint(completedHours, totalPlannedHours) {
    if (!totalPlannedHours) return false;
    return completedHours / totalPlannedHours >= 0.5;
  },

  /**
   * Compute hours conducted after midpoint, for Case 3 settlement.
   * Returns { classesAfterMidpoint, classesConductedAfterMidpoint }.
   */
  computePostMidpointStats(schedule, completedSessionIds, totalPlannedHours) {
    const midpointHours = totalPlannedHours / 2;
    // Simple heuristic: half the scheduled sessions = midpoint
    const totalSlots = schedule.length;
    const midpointSlot = Math.ceil(totalSlots / 2);
    const classesAfterMidpoint    = totalSlots - midpointSlot;
    const completedAfterMidpoint  = Math.max(0, completedSessionIds.length - midpointSlot);

    return { classesAfterMidpoint, completedAfterMidpoint };
  },

  /**
   * Generate a Google Meet link for a classroom session.
   * Real integration requires Google Calendar API / Meet API.
   * For MVP, we generate a deterministic link code per classroom.
   */
  generateMeetLink(classroomId) {
    // Produce a deterministic 10-char code from classroomId
    const hash = crypto
      .createHash("sha256")
      .update(classroomId.toString())
      .digest("hex")
      .slice(0, 10);
    const code = `${hash.slice(0, 3)}-${hash.slice(3, 7)}-${hash.slice(7)}`;
    return `${GMEET_BASE_URL}${code}`;
  },

  /**
   * Validate offline classroom submission (must have photos/address).
   */
  validateOfflineFields(body) {
    if (body.mode === CLASSROOM_MODE.OFFLINE || body.mode === CLASSROOM_MODE.HYBRID) {
      if (!body.offlineAddress?.trim()) {
        throw ApiError.badRequest(
          "Offline/Hybrid classrooms must include an address.",
          "OFFLINE_ADDRESS_REQUIRED"
        );
      }
    }
  },

  /**
   * Check if early-end vote threshold has been met (≥70% of enrolled students voted YES).
   */
  isEarlyEndApproved(yesVotes, totalEnrolled) {
    if (!totalEnrolled) return false;
    return (yesVotes / totalEnrolled) * 100 >= QUERY_LIMITS.EARLY_END_VOTE_THRESHOLD;
  },
};
