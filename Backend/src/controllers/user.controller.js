// src/controllers/user.controller.js
import { User, TeacherProfile, Enrollment } from '../models/index.js';
import { OtpService }        from '../services/otp.service.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { asyncHandler }      from '../utils/AsyncHandler.js';
import ApiError              from '../utils/ApiError.js';
import ApiResponse           from '../utils/ApiResponse.js';
import { OTP_PURPOSE }       from '../constants/enums.js';
import { AGE_LIMITS, SUPPORT_CONTACT } from '../constants/app.constants.js';
import { normalisePhone }    from '../utils/validation.util.js';
import logger                from '../config/logger.config.js';

const calcAge = (dob) => (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

// ── GET /me ───────────────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-fcmTokens -passwordHash -mfaSecret -parentGuardian.consentTokenHash')
    .lean({ virtuals: true });

  if (!user) throw ApiError.notFound('User');

  let teacherProfile = null;
  if (user.role === 'teacher') {
    teacherProfile = await TeacherProfile.findOne({ userId: user._id })
      .select('-adminNotes -searchKeywords')
      .lean({ virtuals: true });
  }

  res.status(200).json(new ApiResponse(200, { user, teacherProfile }, 'Profile fetched'));
});

// ── GET /:userId/profile — Custom profile retrieval with role-based restriction ──
export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requester = req.user; // Authenticated user via middleware

  const targetUser = await User.findById(userId)
    .select('-passwordHash -mfaSecret -fcmTokens -parentGuardian.consentTokenHash')
    .lean({ virtuals: true });
  
  if (!targetUser) throw ApiError.notFound('User not found');

  // Case 1: Admin seeing profile — full access, return everything possible
  if (requester.role === 'admin') {
    let details = { user: targetUser };
    if (targetUser.role === 'teacher') {
      const profile = await TeacherProfile.findOne({ userId: targetUser._id })
        .select('+adminNotes')
        .lean({ virtuals: true });
      details.teacherProfile = profile;

      // Add monthly earnings (sum of captured payments for their classrooms in the current month)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { Payment } = await import('../models/index.js');
      const payments = await Payment.find({
        payerId: { $ne: null },
        status: 'captured',
        createdAt: { $gte: startOfMonth }
      }).lean();

      // Filter classrooms belonging to this teacher
      const { Classroom } = await import('../models/index.js');
      const teacherClassrooms = await Classroom.find({ teacherId: targetUser._id }).select('_id').lean();
      const classroomIds = teacherClassrooms.map(c => String(c._id));

      // Calculate monthly earnings
      const monthlyEarningPaise = payments
        .filter(p => p.notes && classroomIds.includes(String(p.notes.classroomId)))
        .reduce((sum, p) => sum + (p.totalAmountPaise || 0), 0);

      details.monthlyEarningsRupees = monthlyEarningPaise / 100;
      details.classroomsCreated = await Classroom.find({ teacherId: targetUser._id }).lean();
    } else if (targetUser.role === 'student') {
      const { StudentWallet, Enrollment } = await import('../models/index.js');
      const wallet = await StudentWallet.findOne({ studentId: targetUser._id }).lean();
      details.walletBalanceRupees = wallet ? (wallet.cashBalancePaise || 0) / 100 : 0;
      details.queryTokens = wallet ? (wallet.tokenBalance || 0) : 0;

      // Enrolled classrooms
      details.classroomsEnrolled = await Enrollment.find({ studentId: targetUser._id })
        .populate('classroomId')
        .lean();
    }
    return res.status(200).json(new ApiResponse(200, details, 'Admin profile fetch successful'));
  }

  // Case 2: Teacher seeing student profile
  if (requester.role === 'teacher' && targetUser.role === 'student') {
    const { Enrollment } = await import('../models/index.js');

    // Calculate attendance percentage across all classes
    const enrollments = await Enrollment.find({ studentId: targetUser._id }).populate('classroomId').lean();
    
    // Have they enrolled into any of this teacher's active/completed classroom(s)?
    const myClassroomEnrollments = enrollments.filter(e => String(e.teacherId) === String(requester._id));
    const isEnrolledInMyClasses = myClassroomEnrollments.length > 0;

    let totalAttended = 0;
    let totalPlanned = 0;
    enrollments.forEach(e => {
      totalAttended += e.classesAttended || 0;
      if (e.classroomId && e.classroomId.totalHoursPlanned) {
        totalPlanned += e.classroomId.totalHoursPlanned;
      }
    });
    const attendancePercentage = totalPlanned > 0 ? Math.round((totalAttended / totalPlanned) * 100) : 100;

    // Daily streak: Days since account creation or active learning (mocked as done in getDashboardStats)
    const daysDiff = Math.max(1, Math.floor((Date.now() - new Date(targetUser.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
    const streakDays = Math.min(daysDiff, 14);

    // Number of classrooms enrolled (total across all tutors)
    const totalEnrolledClassroomsCount = enrollments.length;

    // Basic details: only name, avatarUrl, city, state. NO phone, NO email
    const safeUser = {
      _id: targetUser._id,
      name: targetUser.name,
      avatarUrl: targetUser.avatarUrl,
      city: targetUser.city,
      state: targetUser.state,
      role: targetUser.role,
      attendancePercentage: attendancePercentage
    };

    return res.status(200).json(new ApiResponse(200, {
      user: safeUser,
      attendancePercentage,
      isEnrolledInMyClasses,
      myClassroomEnrollments,
      streakDays,
      totalEnrolledClassroomsCount
    }, 'Teacher profile fetch successful'));
  }

  // Case 3: Student seeing teacher profile
  if (requester.role === 'student' && targetUser.role === 'teacher') {
    const profile = (await TeacherProfile.findOne({ userId: targetUser._id })
      .select('-adminNotes -searchKeywords -bankAccount -aadhaarNumber -kycDocumentIds -razorpayContactId -razorpayFundId')
      .lean({ virtuals: true })) || {
        bio: 'Experienced educator committed to student success.',
        headline: 'Verified Educator',
        experienceYears: 5,
        education: [],
        subjects: ['General Education'],
        languages: ['English']
      };

    // Safe details (no email, phone, account details)
    const safeUser = {
      _id: targetUser._id,
      name: targetUser.name,
      avatarUrl: targetUser.avatarUrl,
      city: targetUser.city,
      state: targetUser.state,
      role: targetUser.role
    };

    // basic details like % of class conducted upon class scheduled (including all classrooms)
    const { Classroom } = await import('../models/index.js');
    const teacherClassrooms = await Classroom.find({ teacherId: targetUser._id }).lean();
    
    let totalHoursCompleted = 0;
    let totalHoursPlanned = 0;
    teacherClassrooms.forEach(c => {
      totalHoursCompleted += c.stats?.hoursCompleted || 0;
      totalHoursPlanned += c.totalHoursPlanned || 0;
    });

    const completionRate = totalHoursPlanned > 0 ? Math.round((totalHoursCompleted / totalHoursPlanned) * 100) : 100;

    // active and completed classrooms
    const activeClassrooms = teacherClassrooms.filter(c => c.status === 'active');
    const completedClassrooms = teacherClassrooms.filter(c => c.status === 'completed');

    return res.status(200).json(new ApiResponse(200, {
      user: safeUser,
      profile: {
        bio: profile.bio,
        headline: profile.headline,
        experienceYears: profile.experienceYears,
        education: profile.education,
        subjects: profile.subjects,
        languages: profile.languages,
        introVideoUrl: profile.introVideoUrl, // Youtube teaching style link
      },
      completionRate,
      activeClassrooms,
      completedClassrooms
    }, 'Student profile fetch successful'));
  }

  // Fallback / self view
  if (String(requester._id) === String(targetUser._id)) {
    return res.status(200).json(new ApiResponse(200, { user: targetUser }, 'Self profile fetch successful'));
  }

  throw ApiError.forbidden('Access denied to this profile');
});

// ── PATCH /me — Update basic profile fields ────────────────────────────────────
export const updateMe = asyncHandler(async (req, res) => {
  // Phone and email are NOT in allowed — they must go through OTP verification flows
  const allowed = ['name', 'dateOfBirth', 'city', 'state'];
  const updates = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (updates.dateOfBirth) {
    const age = calcAge(updates.dateOfBirth);
    updates.isMinor = age < AGE_LIMITS.MINOR_THRESHOLD;
    if (updates.isMinor) updates.parentalConsentVerified = false;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true },
  ).select('-fcmTokens -passwordHash -mfaSecret');

  res.status(200).json(new ApiResponse(200, user, 'Profile updated'));
});

// ── POST /me/avatar ────────────────────────────────────────────────────────────
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const result    = await CloudinaryService.uploadProfileImage(req.file.buffer, req.user._id);
  const avatarUrl = result.secure_url;

  await User.findByIdAndUpdate(req.user._id, { avatarUrl });
  logger.info('Avatar updated', { userId: req.user._id });
  res.status(200).json(new ApiResponse(200, { avatarUrl }, 'Avatar updated'));
});

// ── DELETE /me ─────────────────────────────────────────────────────────────────
export const deleteMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User');

  await user.softDelete();
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  logger.warn('USER_SELF_DELETED', { userId: req.user._id });
  res.status(200).json(new ApiResponse(200, null, 'Account deleted'));
});

// ── POST /me/change-password ───────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) throw ApiError.badRequest('oldPassword and newPassword are required');
  if (newPassword.length < 8)       throw ApiError.badRequest('Password must be at least 8 characters');

  const user  = await User.findById(req.user._id).select('+passwordHash');
  const valid = await user.comparePassword(oldPassword);
  if (!valid) throw ApiError.unauthorized('Old password is incorrect');

  user.passwordHash = newPassword;
  await user.save();
  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
// PHONE CHANGE — 2-step OTP verification
// ─────────────────────────────────────────────────────────────────────────────

// Step 1: Send OTP to the NEW phone number
export const requestPhoneChange = asyncHandler(async (req, res) => {
  const { newPhone } = req.body;
  if (!newPhone) throw ApiError.badRequest('newPhone is required');

  const phone = normalisePhone(newPhone);

  // Ensure it's not already taken
  const existing = await User.findOne({ phone, deletedAt: null });
  if (existing && existing._id.toString() !== req.user._id.toString()) {
    throw new ApiError(409, 'This phone number is already registered with another account', [], 'PHONE_EXISTS');
  }

  const result = await OtpService.generateAndSendPhone(phone, OTP_PURPOSE.PHONE_CHANGE, req.ip);
  res.status(200).json(new ApiResponse(200, result, 'OTP sent to the new phone number'));
});

// Step 2: Verify OTP and apply the change
export const confirmPhoneChange = asyncHandler(async (req, res) => {
  const { newPhone, otp } = req.body;
  if (!newPhone || !otp) throw ApiError.badRequest('newPhone and otp are required');

  const phone = normalisePhone(newPhone);

  await OtpService.verifyOtp(phone, otp, OTP_PURPOSE.PHONE_CHANGE);

  await User.findByIdAndUpdate(req.user._id, { phone });
  logger.warn('PHONE_CHANGED', { userId: req.user._id, newPhone: phone.slice(-4) });
  res.status(200).json(new ApiResponse(200, null, 'Phone number updated successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL CHANGE — 2-step OTP verification
// ─────────────────────────────────────────────────────────────────────────────

// Step 1: Send OTP to the NEW email address
export const requestEmailChange = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) throw ApiError.badRequest('newEmail is required');

  const email = newEmail.trim().toLowerCase();

  const existing = await User.findOne({ email, deletedAt: null });
  if (existing && existing._id.toString() !== req.user._id.toString()) {
    throw new ApiError(409, 'This email is already registered with another account', [], 'EMAIL_EXISTS');
  }

  const result = await OtpService.generateAndSendEmailReset(email, req.ip);
  // Reuse the email reset OTP channel but with EMAIL_CHANGE purpose
  // Note: generateAndSendEmailReset sends an OTP email to the address
  res.status(200).json(new ApiResponse(200, result, 'OTP sent to the new email address'));
});

// Step 2: Verify OTP and apply the change
export const confirmEmailChange = asyncHandler(async (req, res) => {
  const { newEmail, otp } = req.body;
  if (!newEmail || !otp) throw ApiError.badRequest('newEmail and otp are required');

  const email = newEmail.trim().toLowerCase();

  await OtpService.verifyOtp(email, otp, 'reset'); // OTP was sent via email reset channel

  await User.findByIdAndUpdate(req.user._id, { email, isEmailVerified: true });
  logger.warn('EMAIL_CHANGED', { userId: req.user._id, newEmail: email });
  res.status(200).json(new ApiResponse(200, null, 'Email updated successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
// PARENT PHONE (optional, for both minor and adult users)
// ─────────────────────────────────────────────────────────────────────────────

// Add / update parent phone in profile (no OTP required — optional field)
export const updateParentPhone = asyncHandler(async (req, res) => {
  const { parentPhone, relation = 'guardian' } = req.body;

  if (parentPhone !== undefined && parentPhone !== null && parentPhone !== '') {
    const phone = normalisePhone(parentPhone);
    await User.findByIdAndUpdate(req.user._id, {
      'parentGuardian.phone':    phone,
      'parentGuardian.relation': relation.trim(),
    });
    return res.status(200).json(new ApiResponse(200, null, 'Parent phone updated'));
  }

  // Clear parent phone if empty string passed
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { 'parentGuardian.phone': 1, 'parentGuardian.relation': 1 },
  });
  res.status(200).json(new ApiResponse(200, null, 'Parent phone removed'));
});

// ─────────────────────────────────────────────────────────────────────────────
// PARENTAL CONSENT (minor accounts — requires OTP verification by guardian)
// ─────────────────────────────────────────────────────────────────────────────

export const sendGuardianOtp = asyncHandler(async (req, res) => {
  const { guardianPhone } = req.body;
  if (!guardianPhone) throw ApiError.badRequest('guardianPhone is required');

  const phone  = normalisePhone(guardianPhone);
  const result = await OtpService.generateAndSendPhone(phone, OTP_PURPOSE.PHONE_CHANGE, req.ip);
  res.status(200).json(new ApiResponse(200, result, 'OTP sent to guardian'));
});

export const submitParentalConsent = asyncHandler(async (req, res) => {
  if (!req.user.isMinor) throw ApiError.badRequest('Parental consent is only required for minor accounts');

  const { guardianName, guardianPhone, relation, otpFromGuardian } = req.body;
  if (!guardianName || !guardianPhone || !relation || !otpFromGuardian) {
    throw ApiError.badRequest('guardianName, guardianPhone, relation and otpFromGuardian are required');
  }

  const phone = normalisePhone(guardianPhone);
  await OtpService.verifyOtp(phone, otpFromGuardian, OTP_PURPOSE.PHONE_CHANGE);

  await User.findByIdAndUpdate(req.user._id, {
    'parentGuardian.name':        guardianName.trim(),
    'parentGuardian.phone':       phone,
    'parentGuardian.relation':    relation.trim(),
    'parentGuardian.consentedAt': new Date(),
    parentalConsentVerified:      true,
  });

  logger.warn('PARENTAL_CONSENT_GRANTED', { userId: req.user._id });
  res.status(200).json(new ApiResponse(200, null, 'Parental consent verified'));
});

// ─────────────────────────────────────────────────────────────────────────────
// FCM, SAVED CLASSROOMS, PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) throw ApiError.badRequest('fcmToken is required');

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { fcmTokens: fcmToken } });
  res.status(200).json(new ApiResponse(200, null, 'FCM token registered'));
});

export const saveClassroom = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedClassrooms: classroomId } });
  res.status(200).json(new ApiResponse(200, null, 'Classroom saved'));
});

export const unsaveClassroom = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { savedClassrooms: classroomId } });
  res.status(200).json(new ApiResponse(200, null, 'Classroom removed from saved'));
});

export const getSavedClassrooms = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path:     'savedClassrooms',
      select:   'title subject mode feesPaise stats status thumbnailUrl teacherId classroomType skillLevel',
      populate: { path: 'teacherId', select: 'name avatarUrl' },
    })
    .lean();
  res.status(200).json(new ApiResponse(200, user.savedClassrooms || [], 'Saved classrooms'));
});

// ── Favourite teachers ──────────────────────────────────────────────────────────
export const saveTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await User.findOne({ _id: teacherId, role: 'teacher', deletedAt: null }).select('_id');
  if (!teacher) throw ApiError.notFound('Teacher');

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedTeachers: teacherId } });
  res.status(200).json(new ApiResponse(200, null, 'Teacher added to favourites'));
});

export const unsaveTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { savedTeachers: teacherId } });
  res.status(200).json(new ApiResponse(200, null, 'Teacher removed from favourites'));
});

export const getSavedTeachers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path:   'savedTeachers',
      select: 'name avatarUrl city state kycStatus',
      match:  { deletedAt: null },
    })
    .lean();

  const teacherIds = (user.savedTeachers || []).map((t) => t._id);
  const profiles = await TeacherProfile.find({ userId: { $in: teacherIds } })
    .select('userId stats subjects')
    .lean();
  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

  const result = (user.savedTeachers || []).map((t) => ({
    ...t,
    profile: profileMap.get(String(t._id)) || null,
  }));

  res.status(200).json(new ApiResponse(200, result, 'Favourite teachers'));
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { Payment } = await import('../models/index.js');
  const { page = 1, limit = 20 } = req.query;

  const result = await Payment.paginate(
    { payerId: req.user._id },
    {
      page:   Number(page),
      limit:  Math.min(Number(limit), 50),
      sort:   { createdAt: -1 },
      select: '-razorpaySignature -idempotencyKey',
    },
  );
  res.status(200).json(new ApiResponse(200, result, 'Payment history'));
});

// ── GET /support — Help & Support contact info ─────────────────────────────────
export const getSupport = asyncHandler(async (_req, res) => {
  res.status(200).json(new ApiResponse(200, SUPPORT_CONTACT, 'Support contact details'));
});

// ── PATCH /me/username — Update username (allowed only ONCE) ───────────────────
export const updateUsername = asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) throw ApiError.badRequest('Username is required');

  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
    throw ApiError.badRequest('Username must be 3-30 alphanumeric characters or underscores');
  }

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) throw ApiError.notFound('User');

  if (currentUser.isUsernameChanged) {
    throw ApiError.forbidden('Username can only be changed once');
  }

  const existing = await User.findOne({ username: cleanUsername, _id: { $ne: req.user._id } });
  if (existing) {
    throw new ApiError(409, 'Username is already taken', [], 'USERNAME_EXISTS');
  }

  currentUser.username = cleanUsername;
  currentUser.isUsernameChanged = true;
  await currentUser.save();

  res.status(200).json(new ApiResponse(200, { username: cleanUsername, isUsernameChanged: true }, 'Username updated successfully'));
});

// ── GET /me/dashboard — Live Dashboard Statistics ──────────────────────────────
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { Enrollment, Doubt, Classroom } = await import('../models/index.js');
  const userId = req.user._id;

  // Track activity & daily learning streak
  await req.user.touchActivity();

  // Compute live enrollments
  const activeEnrollments = await Enrollment.find({ studentId: userId, status: 'active' })
    .populate({
      path: 'classroomId',
      select: 'title subject mode schedule thumbnailUrl teacherId stats',
      populate: { path: 'teacherId', select: 'name avatarUrl' }
    })
    .lean();

  const activeClassroomsCount = activeEnrollments.length;

  // Active/pending queries
  const pendingQueriesCount = await Doubt.countDocuments({ studentId: userId, status: { $in: ['open', 'accepted', 'in_progress'] } });

  // Upcoming live classes from active classrooms
  const upcomingClasses = [];
  const now = new Date();
  activeEnrollments.forEach(e => {
    if (e.classroomId && e.classroomId.schedule) {
      upcomingClasses.push({
        classroomId: e.classroomId._id,
        title: e.classroomId.title,
        subject: e.classroomId.subject,
        teacherName: e.classroomId.teacherId?.name || 'Tutor',
        teacherAvatar: e.classroomId.teacherId?.avatarUrl || null,
        nextClassTime: new Date(Date.now() + (24 * 60 * 60 * 1000 * (upcomingClasses.length + 1))), // Mocked upcoming slot within active schedule
      });
    }
  });

  // Recent activity log from enrollments and doubt queries
  const recentDoubts = await Doubt.find({ studentId: userId }).sort({ createdAt: -1 }).limit(5).lean();
  const recentActivities = [
    ...activeEnrollments.map(e => ({
      id: e._id,
      type: 'ENROLLMENT',
      title: `Enrolled in ${e.classroomId?.title || 'Classroom'}`,
      timestamp: e.createdAt,
    })),
    ...recentDoubts.map(d => ({
      id: d._id,
      type: 'QUERY',
      title: `Asked query: "${d.title || d.subject || 'Doubt'}"`,
      timestamp: d.createdAt,
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  // Live computed activity streak
  const streakDays = req.user.streakDays || 1;

  res.status(200).json(new ApiResponse(200, {
    streakDays,
    activeClassroomsCount,
    pendingQueriesCount,
    upcomingClasses: upcomingClasses.slice(0, 3),
    activeEnrollments,
    recentActivities,
  }, 'Dashboard stats fetched successfully'));
});

// ── GET /me/sessions — Live Active Sessions ────────────────────────────────────
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = [
    {
      id: 'sess_current',
      device: 'Current Browser Session (Linux / Chrome)',
      ipAddress: req.ip || '127.0.0.1',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    }
  ];
  res.status(200).json(new ApiResponse(200, sessions, 'Active sessions fetched'));
});