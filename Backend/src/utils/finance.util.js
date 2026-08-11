// ─────────────────────────────────────────────────────────────────────────────
// src/utils/finance.util.js
// All payout / refund arithmetic lives here — single source of truth.
// All amounts are in PAISE (integer arithmetic — never floats for money).
// ─────────────────────────────────────────────────────────────────────────────
import { PLATFORM_FEE } from "../constants/app.constants.js";

/**
 * CASE 1: Classroom scheduled for MORE THAN 15 days (> 15 days)
 * 
 * Successful Completion:
 * - 50% course duration completion: Pay teacher 40% of total fees.
 * - 100% course completion: Pay teacher remaining 54% of total fees.
 * - Platform takes 4% upfront from teacher when accepting query token, plus 6% from payout = 10% total commission.
 */

export function calcCase1MidpointSplit(enrollmentFeePaise) {
  const teacherPayout = Math.round((enrollmentFeePaise * (PLATFORM_FEE.CASE1_MID_TEACHER_PAYOUT_PERCENT || 40)) / 100);
  return {
    case: "case_1_midpoint",
    teacherPayout,
    studentRefund: 0,
    platformCut: 0,
  };
}

export function calcCase1FinalSplit(enrollmentFeePaise) {
  const teacherPayout = Math.round((enrollmentFeePaise * (PLATFORM_FEE.CASE1_FINAL_TEACHER_PAYOUT_PERCENT || 54)) / 100);
  const platformCutFromFee = Math.round((enrollmentFeePaise * 6) / 100);
  const upfrontDeposit = calcTeacherDeposit(enrollmentFeePaise);
  
  return {
    case: "case_1_final",
    studentRefund: 0,
    teacherPayout,
    platformCut: platformCutFromFee + upfrontDeposit, // 6% + 4% = 10% total commission
    upfrontDeposit,
  };
}

/**
 * CASE 1 Full Split (Combined 40% + 54% = 94% teacher total)
 */
export function calcCase1Split(enrollmentFeePaise) {
  const teacherPayout = Math.round((enrollmentFeePaise * 94) / 100);
  const platformCutFromFee = Math.round((enrollmentFeePaise * 6) / 100);
  const upfrontDeposit = calcTeacherDeposit(enrollmentFeePaise);

  return {
    case: "case_1",
    studentRefund: 0,
    teacherPayout,
    platformCut: platformCutFromFee + upfrontDeposit, // 10% total
    upfrontDeposit,
  };
}

/**
 * CASE 1 Teacher Leaves / Cancellation Scenarios:
 * 
 * 1. Leaves BEFORE 50% duration (or before 15 days):
 *    - 100% refund to student
 *    - 0% to teacher
 *    - 4% kept by platform (from upfront teacher deposit)
 */
export function calcCase1EarlyLeaveBeforeMidpoint(enrollmentFeePaise) {
  const upfrontDeposit = calcTeacherDeposit(enrollmentFeePaise);
  return {
    case: "case_1_leave_before_midpoint",
    studentRefund: enrollmentFeePaise, // 100%
    teacherPayout: 0,
    platformCut: upfrontDeposit, // 4% kept
    upfrontDeposit,
  };
}

/**
 * 2. Leaves AFTER 50% duration:
 *    - 40% to teacher (paid at 50% mark)
 *    - 50% refund to student
 *    - 14% total to platform (4% upfront + 10% remaining)
 */
export function calcCase1EarlyLeaveAfterMidpoint(enrollmentFeePaise) {
  const teacherPayout = Math.round((enrollmentFeePaise * 40) / 100);
  const studentRefund = Math.round((enrollmentFeePaise * 50) / 100);
  const upfrontDeposit = calcTeacherDeposit(enrollmentFeePaise);
  const platformCutFromFee = Math.round((enrollmentFeePaise * 10) / 100);

  return {
    case: "case_1_leave_after_midpoint",
    studentRefund,
    teacherPayout,
    platformCut: platformCutFromFee + upfrontDeposit, // 14% total
    upfrontDeposit,
  };
}

/**
 * CASE 2: Classroom scheduled for LESS THAN OR EQUAL TO 15 days (≤ 15 days)
 * 
 * Successful Completion:
 * - 94% given to teacher after course completion.
 * - Platform takes 10% total (4% upfront + 6% at completion).
 */
export function calcCase2Split(enrollmentFeePaise) {
  const teacherPayout = Math.round((enrollmentFeePaise * 94) / 100);
  const platformCutFromFee = Math.round((enrollmentFeePaise * 6) / 100);
  const upfrontDeposit = calcTeacherDeposit(enrollmentFeePaise);

  return {
    case: "case_2",
    studentRefund: 0,
    teacherPayout,
    platformCut: platformCutFromFee + upfrontDeposit, // 10% total
    upfrontDeposit,
  };
}

/**
 * CASE 2 Early Leave / Cancellation:
 * - 100% refunded back to student.
 * - 4% kept by platform (upfront teacher deposit).
 * - 0% to teacher.
 */
export function calcCase2EarlyLeave(enrollmentFeePaise) {
  const upfrontDeposit = calcTeacherDeposit(enrollmentFeePaise);
  return {
    case: "case_2_early_leave",
    studentRefund: enrollmentFeePaise, // 100%
    teacherPayout: 0,
    platformCut: upfrontDeposit, // 4%
    upfrontDeposit,
  };
}

/**
 * Legacy Case 3 compatibility alias (maps to Case 1 Early Leave After Midpoint)
 */
export function calcCase3Split(enrollmentFeePaise) {
  return calcCase1EarlyLeaveAfterMidpoint(enrollmentFeePaise);
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
