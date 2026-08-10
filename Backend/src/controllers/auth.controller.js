// ─────────────────────────────────────────────────────────────────────────────
// src/controllers/auth.controller.js
//
// SIGNUP:          phone OTP + email OTP (dual) → verify both → complete (auto-login)
//                  OR: Google OAuth → complete profile
// LOGIN:           email + password
//                  OR: Google OAuth
// FORGOT PASSWORD: choose email OTP or phone OTP → verify → reset password → auto-login
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import { User, TeacherProfile, StudentWallet } from '../models/index.js';
import { OtpService }    from '../services/otp.service.js';
import { TokenService }  from '../services/token.service.js';
import { GoogleService } from '../services/google.service.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie.util.js';
import { asyncHandler }  from '../utils/AsyncHandler.js';
import ApiError          from '../utils/ApiError.js';
import ApiResponse       from '../utils/ApiResponse.js';
import { ROLES }         from '../constants/enums.js';
import { AGE_LIMITS }    from '../constants/app.constants.js';
import { normalisePhone, isStrongPassword } from '../utils/validation.util.js';
import logger            from '../config/logger.config.js';

// ── Internal helpers ──────────────────────────────────────────────────────────

const calcAge = (dob) =>
  (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const issueTokens = (res, user, rememberMe = false) => {
  const tokens = TokenService.generateTokenPair(user, rememberMe);
  setAuthCookies(res, tokens, rememberMe);
  return tokens;
};

// Strip sensitive fields before sending profile in response
const safeProfile = (user) => {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.passwordHash;
  delete u.mfaSecret;
  delete u.fcmTokens;
  delete u.parentGuardian?.consentTokenHash;
  return u;
};

// ══════════════════════════════════════════════════════════════════════════════
// SIGNUP
// Flow: send-otp → verify-otp → complete
// Both phone (WhatsApp/SMS) + email OTPs are sent simultaneously.
// ══════════════════════════════════════════════════════════════════════════════

export const signupSendOtp = asyncHandler(async (req, res) => {
  const { email, phone, role } = req.body;

  if (!email || !phone || !role) throw ApiError.badRequest('email, phone and role are required');
  if (!isValidEmail(email))      throw ApiError.badRequest('Invalid email address');
  if (!Object.values(ROLES).includes(role)) throw ApiError.badRequest('Invalid role');
  if (role === ROLES.ADMIN)      throw ApiError.forbidden('Cannot self-register as admin');

  const normEmail = email.trim().toLowerCase();
  const normPhone = normalisePhone(phone);

  const conflict = await User.findOne({
    $or: [{ email: normEmail }, { phone: normPhone }],
    deletedAt: null,
  }).lean();

  if (conflict) {
    if (conflict.email === normEmail) throw new ApiError(409, 'Email already registered', [], 'EMAIL_EXISTS');
    throw new ApiError(409, 'Phone number already registered', [], 'PHONE_EXISTS');
  }

  res.status(200).json(new ApiResponse(200, { email: normEmail, phone: normPhone, sessionToken: 'demo_session' },
    'OTP verification disabled for demo. Proceed directly to complete registration.'));
});

export const signupVerifyOtp = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  res.status(200).json(new ApiResponse(200, { sessionToken: 'demo_session', email, phone }, 'OTP verification skipped for demo.'));
});

export const signupComplete = asyncHandler(async (req, res) => {
  const { sessionToken, name, role, dateOfBirth, password, ...teacherFields } = req.body;

  if (!name || !role || !password) {
    throw ApiError.badRequest('name, role and password are required');
  }

  if (!isStrongPassword(password)) {
    throw ApiError.badRequest(
      'Password must be at least 8 characters and include at least one letter and one number',
      'WEAK_PASSWORD',
    );
  }

  let email, phone;
  if (req.body.email && req.body.phone) {
    email = req.body.email.trim().toLowerCase();
    phone = normalisePhone(req.body.phone);
  } else if (sessionToken) {
    try {
      const verified = await OtpService.consumeSessionToken(sessionToken);
      email = verified.email;
      phone = verified.phone;
    } catch (e) {
      email = req.body.email ? req.body.email.trim().toLowerCase() : undefined;
      phone = req.body.phone ? normalisePhone(req.body.phone) : undefined;
    }
  }

  if (!email || !phone) {
    throw ApiError.badRequest('email and phone are required for account creation');
  }

  const dobDate = dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01');

  // Race-condition guard
  const conflict = await User.findOne({ $or: [{ email }, { phone }], deletedAt: null }).lean();
  if (conflict) throw new ApiError(409, 'Account already exists with these credentials', [], 'IDENTITY_CONFLICT');

  const age     = calcAge(dobDate);
  const isMinor = age < AGE_LIMITS.MINOR_THRESHOLD;

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    if (role === ROLES.STUDENT) {
      const [user] = await User.create([{
        phone,
        email,
        name:            name.trim(),
        role:            ROLES.STUDENT,
        dateOfBirth:     dobDate,
        isMinor,
        passwordHash:    password,         // pre('save') hook bcrypt-hashes this
        isPhoneVerified: false,            // Captured & stored, not verified
        isEmailVerified: false,            // Captured & stored, not verified
        isActive:        true,
      }], { session: dbSession });

      await StudentWallet.create(
        [{ studentId: user._id, tokenBalance: 0, cashBalancePaise: 0 }],
        { session: dbSession },
      );

      await dbSession.commitTransaction();

      // Signup auto-logs in
      const tokens = issueTokens(res, user);
      logger.info('Student registered and auto-logged in', { userId: user._id });
      return res.status(201).json(new ApiResponse(201, {
        user:        safeProfile(user),
        accessToken: tokens.accessToken,
      }, 'Account created. Welcome to TrueEd!'));
    }

    if (role === ROLES.TEACHER) {
      if (age < AGE_LIMITS.MIN_TEACHER_AGE) {
        throw new ApiError(403, 'Teachers must be at least 18 years old', [], 'AGE_RESTRICTION');
      }

      const [user] = await User.create([{
        phone,
        email,
        name:                  name.trim(),
        role:                  ROLES.TEACHER,
        dateOfBirth:           dobDate,
        isMinor:               false,
        passwordHash:          password,
        isPhoneVerified:       false,            // Captured & stored, not verified
        isEmailVerified:       false,            // Captured & stored, not verified
        isActive:              true,
        isVerificationPending: false,            // KYC bypassed for demo
        kycStatus:             'approved',         // KYC approved by default for demo
      }], { session: dbSession });

      const subjects = (teacherFields.subjects && teacherFields.subjects.length > 0) ? teacherFields.subjects : ['General'];
      const expMatch = String(teacherFields.experience || '').match(/\d+/);
      const experienceYears = expMatch ? parseInt(expMatch[0], 10) : 0;
      const education = teacherFields.qualification ? [{ degree: teacherFields.qualification.trim(), institution: 'Not Specified', year: new Date().getFullYear() }] : [];

      await TeacherProfile.create([{
        userId:             user._id,
        verificationStatus: 'approved',            // KYC approved by default for demo
        subjects,
        experienceYears,
        education,
        teachingMode:       teacherFields.teachingMode || 'Online',
        bio:                teacherFields.bio          || '',
        city:               teacherFields.city         || '',
        state:              teacherFields.state        || '',
      }], { session: dbSession });

      await dbSession.commitTransaction();

      const tokens = issueTokens(res, user);
      logger.info('Teacher registered, auto-logged in', { userId: user._id });
      return res.status(201).json(new ApiResponse(201, {
        user:                 safeProfile(user),
        accessToken:          tokens.accessToken,
        registrationComplete: true,
        kycPending:           false,
        userId:               user._id,
      }, 'Teacher account created. Welcome to TrueEd!'));
    }

    throw ApiError.badRequest('Invalid role');

  } catch (err) {
    await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// Primary: email + password
// Secondary: Google OAuth
// No OTP login — avoids phone delivery cost on every login
// ══════════════════════════════════════════════════════════════════════════════

export const loginWithPassword = asyncHandler(async (req, res) => {
  const { email, username, identifier, password, rememberMe = false } = req.body;
  const loginId = (identifier || email || username || '').trim().toLowerCase();
  if (!loginId || !password) throw ApiError.badRequest('Identifier and password are required');

  const normPhone = normalisePhone(loginId);

  // Support login via email, username, or phone
  const user = await User.findOne({
    $or: [
      { email: loginId },
      { username: loginId },
      { phone: normPhone },
      { phone: loginId }
    ],
    deletedAt: null,
  }).select('+passwordHash');

  if (!user)          throw ApiError.unauthorized('Invalid credentials');
  if (user.isBanned)  throw ApiError.forbidden('Account suspended. Contact support.');
  if (!user.isActive) throw ApiError.unauthorized('Invalid credentials');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  const tokens = issueTokens(res, user, rememberMe);
  await user.touchActivity();

  // Re-read the user so we return the freshly-updated streakDays / lastActiveAt
  const freshUser = await User.findById(user._id)
    .select('-fcmTokens -passwordHash -mfaSecret')
    .lean({ virtuals: true });

  logger.info('User logged in via password', { userId: user._id, role: user.role });
  res.status(200).json(new ApiResponse(200, {
    user:        freshUser ? { ...freshUser } : safeProfile(user),
    accessToken: tokens.accessToken,
    kycPending:  false,
  }, 'Login successful'));
});

// ══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// User chooses channel: email OTP or phone OTP (WhatsApp/SMS)
// ══════════════════════════════════════════════════════════════════════════════

export const forgotPasswordSendOtp = asyncHandler(async (req, res) => {
  const { channel, email, phone } = req.body;

  if (!channel || !['email', 'phone'].includes(channel)) {
    throw ApiError.badRequest('channel must be "email" or "phone"');
  }

  if (channel === 'email') {
    if (!email)             throw ApiError.badRequest('email is required for email channel');
    if (!isValidEmail(email)) throw ApiError.badRequest('Invalid email address');

    const normEmail = email.trim().toLowerCase();

    // Security: confirm account exists. If not, still return 200 to prevent email enumeration.
    const user = await User.findOne({ email: normEmail, deletedAt: null }).lean();
    if (!user) {
      // Respond identically whether user exists or not — no enumeration leak
      return res.status(200).json(new ApiResponse(200,
        { maskedEmail: `${normEmail.slice(0, 2)}***@${normEmail.split('@')[1]}` },
        'If an account exists with this email, an OTP has been sent.'));
    }
    if (user.isBanned) throw ApiError.forbidden('Account suspended. Contact support.');

    const result = await OtpService.generateAndSendEmailReset(normEmail, req.ip);
    return res.status(200).json(new ApiResponse(200, result,
      'Password reset OTP sent to your email.'));
  }

  // channel === 'phone'
  if (!phone) throw ApiError.badRequest('phone is required for phone channel');

  const normPhone = normalisePhone(phone);
  const user = await User.findOne({ phone: normPhone, deletedAt: null }).lean();
  if (!user) {
    return res.status(200).json(new ApiResponse(200,
      { maskedPhone: `****${normPhone.slice(-4)}` },
      'If an account exists with this phone, an OTP has been sent.'));
  }
  if (user.isBanned) throw ApiError.forbidden('Account suspended. Contact support.');

  const result = await OtpService.generateAndSendPhoneReset(normPhone, req.ip);
  res.status(200).json(new ApiResponse(200, result,
    'Password reset OTP sent to your phone.'));
});

export const forgotPasswordVerifyOtp = asyncHandler(async (req, res) => {
  const { channel, email, phone, otp } = req.body;

  if (!channel || !['email', 'phone'].includes(channel)) {
    throw ApiError.badRequest('channel must be "email" or "phone"');
  }
  if (!otp) throw ApiError.badRequest('otp is required');

  const identifier = channel === 'email'
    ? email?.trim().toLowerCase()
    : normalisePhone(phone);

  if (!identifier) throw ApiError.badRequest(`${channel} is required`);

  const result = await OtpService.verifyOtp(identifier, otp, 'reset');
  res.status(200).json(new ApiResponse(200,
    { sessionToken: result.sessionToken },
    'OTP verified. Set your new password.'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { sessionToken, email: bodyEmail, phone: bodyPhone, newPassword } = req.body;
  if (!newPassword) {
    throw ApiError.badRequest('newPassword is required');
  }

  if (!isStrongPassword(newPassword)) {
    throw ApiError.badRequest(
      'Password must be at least 8 characters and include at least one letter and one number',
      'WEAK_PASSWORD',
    );
  }

  let email = bodyEmail ? bodyEmail.trim().toLowerCase() : null;
  let phone = bodyPhone ? normalisePhone(bodyPhone) : null;

  if (!email && !phone && sessionToken) {
    try {
      const verified = await OtpService.consumeSessionToken(sessionToken);
      email = verified.email;
      phone = verified.phone;
    } catch (e) {
      // fallback
    }
  }

  if (!email && !phone) {
    throw ApiError.badRequest('email or phone is required to reset password');
  }

  // Find user by whichever identifier was provided
  const query = email ? { email, deletedAt: null } : { phone, deletedAt: null };
  const user  = await User.findOne(query).select('+passwordHash');
  if (!user) throw ApiError.notFound('Account not found');
  if (user.isBanned) throw ApiError.forbidden('Account suspended');

  user.passwordHash = newPassword; // pre('save') hook hashes it
  await user.save();

  // Auto-login after reset
  const tokens = issueTokens(res, user);
  await user.touchActivity();

  logger.info('Password reset and auto-login', { userId: user._id });
  res.status(200).json(new ApiResponse(200, {
    user:        safeProfile(user),
    accessToken: tokens.accessToken,
  }, 'Password reset successful. You are now logged in.'));
});

// ══════════════════════════════════════════════════════════════════════════════
// PHONE LINKING (authenticated — adds/updates phone on existing account)
// ══════════════════════════════════════════════════════════════════════════════

export const sendPhoneOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone)    throw ApiError.badRequest('phone is required');
  if (!req.user) throw ApiError.unauthorized('Login required');

  const normPhone = normalisePhone(phone);

  const conflict = await User.findOne({ phone: normPhone, deletedAt: null, _id: { $ne: req.user._id } }).lean();
  if (conflict) throw new ApiError(409, 'Phone number already in use by another account', [], 'PHONE_EXISTS');

  const result = await OtpService.generateAndSendPhone(normPhone, 'phone_change', req.ip);
  res.status(200).json(new ApiResponse(200, result, 'OTP sent to phone'));
});

export const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) throw ApiError.badRequest('phone and otp are required');
  if (!req.user)      throw ApiError.unauthorized('Login required');

  const normPhone = normalisePhone(phone);
  const { sessionToken } = await OtpService.verifyOtp(normPhone, otp, 'phone_change');
  const { phone: verifiedPhone } = await OtpService.consumeSessionToken(sessionToken);

  const conflict = await User.findOne({ phone: verifiedPhone, deletedAt: null, _id: { $ne: req.user._id } }).lean();
  if (conflict) throw new ApiError(409, 'Phone number already in use by another account', [], 'PHONE_EXISTS');

  await User.findByIdAndUpdate(req.user._id, { phone: verifiedPhone, isPhoneVerified: true });

  res.status(200).json(new ApiResponse(200, null, 'Phone number verified and linked to your account'));
});

// ══════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ══════════════════════════════════════════════════════════════════════════════

export const googleAuthUrl = asyncHandler(async (req, res) => {
  const { state = '' } = req.query;
  const url = GoogleService.buildAuthUrl(state);
  res.redirect(url);
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!code) throw ApiError.badRequest('Missing Google auth code');

  const { profile } = await GoogleService.getProfileFromCode(code);

  let user = await User.findOne({
    $or: [{ googleId: profile.sub }, { email: profile.email }],
    deletedAt: null,
  });

  // Existing user — link googleId if missing, then login
  if (user) {
    if (user.isBanned) throw ApiError.forbidden('Account suspended');
    if (!user.googleId) {
      user.googleId  = profile.sub;
      user.avatarUrl = user.avatarUrl || profile.picture;
      await user.save();
    }
    const tokens = issueTokens(res, user);
    await user.touchActivity();
    return res.redirect(`${process.env.FRONTEND_URL}/login?token=${tokens.accessToken}`);
  }

  // New Google user — redirect frontend to collect role, password, DOB
  const encodedProfile = Buffer.from(JSON.stringify({
    googleId: profile.sub,
    email:    profile.email,
    name:     profile.name,
    avatar:   profile.picture,
  })).toString('base64');

  res.redirect(`${process.env.FRONTEND_URL}/auth/complete-profile?g=${encodedProfile}&state=${state}`);
});

export const googleComplete = asyncHandler(async (req, res) => {
  const { googleData, role, password, dateOfBirth, name } = req.body;
  if (!googleData || !role || !password || !dateOfBirth) {
    throw ApiError.badRequest('googleData, role, password and dateOfBirth are required');
  }

  if (!isStrongPassword(password)) {
    throw ApiError.badRequest(
      'Password must be at least 8 characters and include at least one letter and one number',
      'WEAK_PASSWORD',
    );
  }

  let profile;
  try {
    profile = JSON.parse(Buffer.from(googleData, 'base64').toString('utf8'));
  } catch {
    throw ApiError.badRequest('Invalid googleData payload');
  }

  if (!profile.googleId || !profile.email) throw ApiError.badRequest('Incomplete Google profile data');

  const conflict = await User.findOne({
    $or: [{ googleId: profile.googleId }, { email: profile.email }],
    deletedAt: null,
  }).lean();
  if (conflict) throw new ApiError(409, 'An account already exists. Please login.', [], 'ACCOUNT_EXISTS');

  const age     = calcAge(dateOfBirth);
  const isMinor = age < AGE_LIMITS.MINOR_THRESHOLD;

  if (role === ROLES.TEACHER && age < AGE_LIMITS.MIN_TEACHER_AGE) {
    throw new ApiError(403, 'Teachers must be at least 18 years old', [], 'AGE_RESTRICTION');
  }
  if (!Object.values(ROLES).includes(role) || role === ROLES.ADMIN) {
    throw ApiError.badRequest('Invalid role');
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const userData = {
      name:            (name || profile.name).trim(),
      email:           profile.email,
      googleId:        profile.googleId,
      avatarUrl:       profile.avatar || null,
      role,
      dateOfBirth:     new Date(dateOfBirth),
      isMinor,
      passwordHash:    password,
      phone:           null,          // phone optional — user can add later
      isPhoneVerified: false,
      isEmailVerified: true,           // Google has verified the email
      isActive:        true,
    };

    if (role === ROLES.TEACHER) {
      userData.isVerificationPending = true;
      userData.kycStatus = 'pending';
    }

    const [user] = await User.create([userData], { session: dbSession });

    if (role === ROLES.STUDENT) {
      await StudentWallet.create([{ studentId: user._id }], { session: dbSession });
      await dbSession.commitTransaction();

      const tokens = issueTokens(res, user);
      logger.info('Student registered via Google and auto-logged in', { userId: user._id });
      return res.status(201).json(new ApiResponse(201, {
        user: safeProfile(user), accessToken: tokens.accessToken,
      }, 'Account created. Welcome to TrueEd!'));
    }

    // Teacher
    await TeacherProfile.create([{
      userId: user._id, verificationStatus: 'pending', subjects: ['General'],
    }], { session: dbSession });
    await dbSession.commitTransaction();

    logger.info('Teacher registered via Google, pending KYC', { userId: user._id });
    return res.status(201).json(new ApiResponse(201, {
      registrationComplete: true, userId: user._id,
    }, 'Teacher account created. Complete KYC to proceed.'));

  } catch (err) {
    await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token not found');

  const decoded = TokenService.verifyRefreshToken(token);
  const user    = await User.findById(decoded._id)
    .select('_id role isActive isBanned isVerificationPending').lean();

  if (!user || !user.isActive || user.isBanned) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Session invalid. Please login again.');
  }

  const tokens = issueTokens(res, user, decoded.rememberMe);
  res.status(200).json(new ApiResponse(200, { accessToken: tokens.accessToken }, 'Token refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});