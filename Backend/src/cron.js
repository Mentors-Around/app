// src/cron.js
import cron       from 'node-cron';
import mongoose   from 'mongoose';
import { EnrollmentQuery, TeacherProfile, Classroom, Enrollment, Poll, User } from './models/index.js';
import { WalletService }     from './services/wallet.service.js';
import { NotificationService } from './services/notification.service.js';
import { EscrowService }     from './services/escrow.service.js';
import { QUERY_STATUS, CLASSROOM_STATUS, POLL_STATUS, ENROLLMENT_STATUS } from './constants/enums.js';
import logger                from './config/logger.config.js';

async function runQueryExpiryJob() {
  logger.info('[CRON] Query expiry job started');
  const overdueQueries = await EnrollmentQuery.overdueForTeacher();
  if (!overdueQueries.length) return;

  for (const q of overdueQueries) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await EnrollmentQuery.findByIdAndUpdate(q._id, { status: QUERY_STATUS.EXPIRED }, { session });
      await WalletService.refundToken(
        q.studentId,
        q._id,
        'Token refunded: enrollment request auto-expired after 5 days without teacher response',
        session,
      );
      await session.commitTransaction();

      Promise.all([
        User.findById(q.studentId).select('phone'),
        Classroom.findById(q.classroomId).select('title'),
      ]).then(([student, classroom]) => {
        if (student && classroom) {
          NotificationService.notifyStudentQueryExpired(student, classroom).catch(() => {});
        }
      });
    } catch (err) {
      await session.abortTransaction();
      logger.error('[CRON] Failed to expire query', { queryId: q._id, error: err.message });
    } finally {
      session.endSession();
    }
  }
}

async function runAcceptedQueryLapseJob() {
  logger.info('[CRON] Accepted query lapse job started');
  const overdueAccepted = await EnrollmentQuery.overdueForStudent();
  if (!overdueAccepted.length) return;

  for (const q of overdueAccepted) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await EnrollmentQuery.findByIdAndUpdate(q._id, { status: QUERY_STATUS.LAPSED }, { session });

      if (q.teacherDepositPaise && q.teacherDepositPaid) {
        await TeacherProfile.findOneAndUpdate(
          { userId: q.teacherId },
          { $inc: { walletPaise: q.teacherDepositPaise } },
          { session },
        );
        User.findById(q.teacherId).select('phone').then((teacher) => {
          if (teacher) {
            NotificationService.notifyTeacherDepositRefunded(teacher, q.teacherDepositPaise).catch(() => {});
          }
        });
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      logger.error('[CRON] Failed to lapse query', { queryId: q._id, error: err.message });
    } finally {
      session.endSession();
    }
  }
}

// ── FIXED: Resolution Worker for Early End Cohorts ──────────────────────────
async function runPollExpiryJob() {
  const expiredPolls = await Poll.find({
    status:    POLL_STATUS.ACTIVE,
    expiresAt: { $lt: new Date() },
  }).lean();

  if (!expiredPolls.length) return;
  logger.info(`[CRON] Expiring ${expiredPolls.length} polls`);

  for (const poll of expiredPolls) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Poll.findByIdAndUpdate(poll._id, { status: POLL_STATUS.EXPIRED }, { session });

      if (poll.type === 'early_end') {
        const classroom = await Classroom.findOne({ earlyEndPollId: poll._id, status: CLASSROOM_STATUS.COMPLETION_PENDING }).session(session);
        
        if (classroom) {
          // Compute real vote distribution thresholds
          const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
          const yesVotes   = poll.options.find(o => o.text === 'Yes')?.votes || 0;
          const approvalRatio = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;

          if (approvalRatio >= 70) {
            // SUCCESSFUL PASS: Update states and trigger Case 1 settlements
            classroom.status = CLASSROOM_STATUS.COMPLETED;
            classroom.completedAt = new Date();
            classroom.completionCase = 'case_1';
            await classroom.save({ session });

            // Fetch active students to distribute funds locally
            const activeEnrollments = await Enrollment.find({ classroomId: classroom._id, status: ENROLLMENT_STATUS.ACTIVE }).session(session);
            const teacherUser = await User.findById(classroom.teacherId).session(session);

            for (const enrollment of activeEnrollments) {
              enrollment.status = ENROLLMENT_STATUS.COMPLETED;
              await enrollment.save({ session });
              const studentUser = await User.findById(enrollment.studentId).session(session);
              
              // Local internal wallet payout distribution (No Razorpay fee burned!)
              await EscrowService.settleCase1(enrollment, teacherUser, [studentUser]);
            }
            logger.info('[CRON] Early closure approved via 70% vote. Settled Case 1.', { classroomId: classroom._id });
          } else {
            // POLL FAILED: Revert classroom back to active state safely
            classroom.status = CLASSROOM_STATUS.ACTIVE;
            classroom.earlyEndRequestedAt = null;
            classroom.earlyEndPollId = null;
            await classroom.save({ session });
            logger.info('[CRON] Early closure failed. Reverted to active.', { classroomId: classroom._id });
          }
        }
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      logger.error('[CRON] Poll expiry transaction aborted', { pollId: poll._id, error: err.message });
    } finally {
      session.endSession();
    }
  }
}

async function runClassroomOverdueJob() {
  const overdueClassrooms = await Classroom.overdueActive();
  if (!overdueClassrooms.length) return;

  for (const classroom of overdueClassrooms) {
    try {
      await Classroom.findByIdAndUpdate(classroom._id, {
        status:         CLASSROOM_STATUS.COMPLETED,
        completedAt:    new Date(),
        completionCase: 'case_1',
      });
      logger.info('[CRON] Classroom auto-completed (endDate passed)', { classroomId: classroom._id });
    } catch (err) {
      logger.error('[CRON] Classroom overdue closure error', { classroomId: classroom._id, error: err.message });
    }
  }
}

// ── Nightly streak reset: users who didn't log in today get streakDays = 0 ──────
async function runStreakResetJob() {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const result = await User.updateMany(
      {
        lastActiveDate: { $exists: true, $ne: null, $lt: todayStr },
        streakDays:     { $gt: 0 },
      },
      { $set: { streakDays: 0 } },
    );
    if (result.modifiedCount > 0) {
      logger.info(`[CRON] Streak reset: ${result.modifiedCount} users had streak cleared`);
    }
  } catch (err) {
    logger.error('[CRON] Streak reset error', { error: err.message });
  }
}

export function initCronJobs() {
  // ── Every hour: expire pending queries not responded to by teacher ──────────
  cron.schedule('0 * * * *', async () => {
    try { await runQueryExpiryJob(); }
    catch (err) { logger.error('[CRON] runQueryExpiryJob fatal', { error: err.message }); }
  });

  // ── Every 30 min: lapse accepted queries where student didn't pay ───────────
  cron.schedule('30 * * * *', async () => {
    try { await runAcceptedQueryLapseJob(); }
    catch (err) { logger.error('[CRON] runAcceptedQueryLapseJob fatal', { error: err.message }); }
  });

  // ── Every 15 min: expire early-end polls ────────────────────────────────────
  cron.schedule('15 * * * *', async () => {
    try { await runPollExpiryJob(); }
    catch (err) { logger.error('[CRON] runPollExpiryJob fatal', { error: err.message }); }
  });

  // ── Every 6 hours: auto-complete overdue classrooms ─────────────────────────
  cron.schedule('0 */6 * * *', async () => {
    try { await runClassroomOverdueJob(); }
    catch (err) { logger.error('[CRON] runClassroomOverdueJob fatal', { error: err.message }); }
  });

  // ── Midnight daily: reset streaks for inactive users ─────────────────────────
  cron.schedule('0 0 * * *', async () => {
    try { await runStreakResetJob(); }
    catch (err) { logger.error('[CRON] runStreakResetJob fatal', { error: err.message }); }
  });

  logger.info('✅ Cron jobs initialized successfully with settlement + streak support');
}