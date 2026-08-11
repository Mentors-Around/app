// ─────────────────────────────────────────────────────────────────────────────
// src/services/escrow.service.js
// Pure internal virtual wallet settlement bypassing Razorpay loop.
// ─────────────────────────────────────────────────────────────────────────────
import { TeacherProfile, StudentWallet, Payment, Payout } from "../models/index.js";
import logger from "../config/logger.config.js";
import { 
  calcCase1Split, 
  calcCase2Split, 
  calcCase3Split, 
  calcCase1MidpointSplit, 
  calcCase1FinalSplit,
  calcCase1EarlyLeaveBeforeMidpoint,
  calcCase1EarlyLeaveAfterMidpoint,
  calcCase2EarlyLeave,
  calcTeacherDeposit 
} from "../utils/finance.util.js";
import { NotificationService } from "./notification.service.js";
import { PAYOUT_STATUS } from "../constants/enums.js";

export const EscrowService = {
  async chargeTeacherDeposit(teacherId, enrollmentId, enrollmentFeePaise, session = null) {
    const deposit = calcTeacherDeposit(enrollmentFeePaise);

    const profile = await TeacherProfile.findOneAndUpdate(
      { userId: teacherId, walletPaise: { $gte: deposit } },
      { $inc: { walletPaise: -deposit } },
      { new: true, session }
    );

    if (!profile) {
      logger.warn("Teacher insufficient internal virtual balance for deposit", { teacherId, deposit });
      await Payment.create([{
        payerId: teacherId,
        enrollmentId,
        totalAmountPaise: deposit,
        purpose: "teacher_deposit",
        status: "created",
      }], { session });
      return { charged: false, depositPaise: deposit };
    }

    await Payment.create([{
      payerId: teacherId,
      enrollmentId,
      totalAmountPaise: deposit,
      purpose: "teacher_deposit",
      status: "captured",
    }], { session });

    return { charged: true, depositPaise: deposit };
  },

  /**
   * Settle Case 1 Midpoint (40% payout to teacher at 50% course duration)
   */
  async settleCase1Midpoint(enrollment, teacherUser) {
    const split = calcCase1MidpointSplit(enrollment.feesPaidPaise);

    await TeacherProfile.findOneAndUpdate(
      { userId: teacherUser._id },
      { $inc: { walletPaise: split.teacherPayout } }
    );

    await Payout.create({
      teacherId: teacherUser._id,
      classroomId: enrollment.classroomId,
      grossFeesCollectedPaise: enrollment.feesPaidPaise,
      teacherPayoutPaise: split.teacherPayout,
      status: PAYOUT_STATUS.COMPLETED,
    });

    await NotificationService.notifyPayoutReleased(teacherUser, split.teacherPayout);
    return split;
  },

  /**
   * Settle Case 1 Final (54% payout to teacher at 100% course completion)
   */
  async settleCase1Final(enrollment, teacherUser) {
    const split = calcCase1FinalSplit(enrollment.feesPaidPaise);

    await TeacherProfile.findOneAndUpdate(
      { userId: teacherUser._id },
      { $inc: { walletPaise: split.teacherPayout } }
    );

    await Payout.create({
      teacherId: teacherUser._id,
      classroomId: enrollment.classroomId,
      grossFeesCollectedPaise: enrollment.feesPaidPaise,
      teacherPayoutPaise: split.teacherPayout,
      status: PAYOUT_STATUS.COMPLETED,
    });

    await NotificationService.notifyPayoutReleased(teacherUser, split.teacherPayout);
    return split;
  },

  /**
   * Settle Case 1 Full (94% total payout to teacher upon completion)
   */
  async settleCase1(enrollment, teacherUser, studentUsers = []) {
    const split = calcCase1Split(enrollment.feesPaidPaise);

    await TeacherProfile.findOneAndUpdate(
      { userId: teacherUser._id },
      { $inc: { walletPaise: split.teacherPayout } }
    );

    await Payout.create({
      teacherId: teacherUser._id,
      classroomId: enrollment.classroomId,
      grossFeesCollectedPaise: enrollment.feesPaidPaise,
      teacherPayoutPaise: split.teacherPayout,
      status: PAYOUT_STATUS.COMPLETED,
    });

    await NotificationService.notifyPayoutReleased(teacherUser, split.teacherPayout);
    return split;
  },

  /**
   * Settle Case 2 (94% total payout to teacher after completion for ≤ 15 days)
   */
  async settleCase2(enrollment, teacherUser, studentUser) {
    const split = calcCase2Split(enrollment.feesPaidPaise);

    if (teacherUser) {
      await TeacherProfile.findOneAndUpdate(
        { userId: teacherUser._id },
        { $inc: { walletPaise: split.teacherPayout } }
      );

      await Payout.create({
        teacherId: teacherUser._id,
        classroomId: enrollment.classroomId,
        grossFeesCollectedPaise: enrollment.feesPaidPaise,
        teacherPayoutPaise: split.teacherPayout,
        status: PAYOUT_STATUS.COMPLETED,
      });

      await NotificationService.notifyPayoutReleased(teacherUser, split.teacherPayout);
    }

    return split;
  },

  /**
   * Settle Early Leave / Cancellation for Case 1
   */
  async settleCase1EarlyLeave(enrollment, teacherUser, studentUser, wasAfterMidpoint = false) {
    const split = wasAfterMidpoint
      ? calcCase1EarlyLeaveAfterMidpoint(enrollment.feesPaidPaise)
      : calcCase1EarlyLeaveBeforeMidpoint(enrollment.feesPaidPaise);

    if (split.studentRefund > 0 && studentUser) {
      await StudentWallet.findOneAndUpdate(
        { studentId: studentUser._id },
        { $inc: { cashBalancePaise: split.studentRefund } }
      );
      await NotificationService.notifyRefundInitiated(studentUser, split.studentRefund);
    }

    if (split.teacherPayout > 0 && teacherUser) {
      await TeacherProfile.findOneAndUpdate(
        { userId: teacherUser._id },
        { $inc: { walletPaise: split.teacherPayout } }
      );
      await NotificationService.notifyPayoutReleased(teacherUser, split.teacherPayout);
    }

    return split;
  },

  /**
   * Settle Early Leave / Cancellation for Case 2 (100% refund to student, 4% kept by platform)
   */
  async settleCase2EarlyLeave(enrollment, studentUser) {
    const split = calcCase2EarlyLeave(enrollment.feesPaidPaise);

    if (studentUser) {
      await StudentWallet.findOneAndUpdate(
        { studentId: studentUser._id },
        { $inc: { cashBalancePaise: split.studentRefund } }
      );
      await NotificationService.notifyRefundInitiated(studentUser, split.studentRefund);
    }

    return split;
  },

  /**
   * Legacy Case 3 compatibility alias
   */
  async settleCase3(enrollment, teacherUser, studentUser) {
    return this.settleCase1EarlyLeave(enrollment, teacherUser, studentUser, true);
  }
};