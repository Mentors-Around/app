// ─────────────────────────────────────────────────────────────────────────────
// src/utils/finance.util.js
// All payout / refund arithmetic lives here — single source of truth.
// All amounts are in PAISE (integer arithmetic — never floats for money).
// ─────────────────────────────────────────────────────────────────────────────
import { PLATFORM_FEE } from "../constants/app.constants.js";

/**
 * CASE 1: Teacher completed the course fully OR got ≥70% early-end votes.
 * Pot = 100% student fee (held) + 4% teacher deposit = 104%
 * Platform takes 15%, teacher receives 89%.
 */
export function calcCase1Split(enrollmentFeePaise) {
  const pot = enrollmentFeePaise; // 100% from student
  const platformCut = Math.round((pot * PLATFORM_FEE.PLATFORM_CUT_CASE1_PERCENT) / 100);
  const teacherAmt = pot - platformCut;  // 85% of student fee; teacher already "lost" 4% deposit

  return {
    case: "case_1",
    studentRefund: 0,
    teacherPayout: teacherAmt,
    platformCut,
    // Teacher deposit (4%) is forfeited to platform as part of the 15%
    teacherDepositForfeited: Math.round((enrollmentFeePaise * PLATFORM_FEE.TEACHER_DEPOSIT_PERCENT) / 100),
  };
}

/**
 * CASE 2: Teacher left before completing 50% of planned class hours.
 * Students get 100% refund. Platform keeps the 4% teacher deposit.
 */
export function calcCase2Split(enrollmentFeePaise) {
  const teacherDeposit = Math.round(
    (enrollmentFeePaise * PLATFORM_FEE.TEACHER_DEPOSIT_PERCENT) / 100
  );
  return {
    case: "case_2",
    studentRefund: enrollmentFeePaise,
    teacherPayout: 0,
    platformCut: teacherDeposit, // keeps only the 4% deposit
    teacherDepositForfeited: teacherDeposit,
  };
}

/**
 * CASE 3: Teacher left after 50% but course isn't completed.
 *
 * Pot = 100% student fee + 4% teacher deposit = 104%
 * Platform cuts: 14%
 * Remaining: 90% of student fee
 *
 * Of the 90%:
 *   - Student always gets back 30% (fixed)
 *   - Remaining 20% is split pro-rata:
 *       teacher gets (extraClassesTaken / scheduledAfterMidpoint) × 20%
 *       student gets the rest of that 20%
 *
 * @param {number} enrollmentFeePaise
 * @param {number} classesAfterMidpoint   - total classes scheduled in 2nd half
 * @param {number} extraClassesConducted  - classes actually conducted in 2nd half
 */
export function calcCase3Split(enrollmentFeePaise, classesAfterMidpoint, extraClassesConducted) {
  if (classesAfterMidpoint <= 0) classesAfterMidpoint = 1; // guard div-by-zero

  const platformCut = Math.round((enrollmentFeePaise * PLATFORM_FEE.PLATFORM_CUT_CASE3_PERCENT) / 100);
  const teacherDeposit = Math.round((enrollmentFeePaise * PLATFORM_FEE.TEACHER_DEPOSIT_PERCENT) / 100);
  const remainder = enrollmentFeePaise - platformCut; // 86% of student fee

  const studentFixed = Math.round((enrollmentFeePaise * PLATFORM_FEE.STUDENT_FIXED_REFUND_CASE3_PERCENT) / 100); // 30%
  const proRataPot = remainder - studentFixed; // ~56% — split pro-rata

  const ratio = Math.min(extraClassesConducted / classesAfterMidpoint, 1);
  const teacherProRata = Math.round(proRataPot * ratio);
  const studentProRata = proRataPot - teacherProRata;

  const studentRefund = studentFixed + studentProRata;
  const teacherPayout = teacherProRata; // teacher already "lost" 4% deposit
  const actualPlatformCut = platformCut + teacherDeposit; // 14% + 4% = 18% of enrollment fee

  return {
    case: "case_3",
    studentRefund,
    teacherPayout,
    platformCut: actualPlatformCut,
    breakdown: {
      platformPercent: PLATFORM_FEE.PLATFORM_CUT_CASE3_PERCENT,
      studentFixed,
      studentProRata,
      teacherProRata,
      ratio: parseFloat(ratio.toFixed(4)),
    },
    teacherDepositForfeited: teacherDeposit,
  };
}

/**
 * Calculate 4% teacher deposit for a given enrollment fee.
 */
export function calcTeacherDeposit(enrollmentFeePaise) {
  return Math.round((enrollmentFeePaise * PLATFORM_FEE.TEACHER_DEPOSIT_PERCENT) / 100);
}

/**
 * Convert paise to rupees string for display.
 */
export function paiseToRupees(paise) {
  return (paise / 100).toFixed(2);
}

/**
 * Convert rupees to paise (safe integer).
 */
export function rupeesToPaise(rupees) {
  return Math.round(parseFloat(rupees) * 100);
}
