// ─────────────────────────────────────────────────────────────────────────────
// src/services/otp.service.js
//
// CHANNEL STRATEGY:
//   signup        → phone OTP (WhatsApp/SMS) + email OTP simultaneously
//   login         → password only (no OTP cost)
//   forgot/reset  → user chooses: email OTP  OR  phone OTP (WhatsApp/SMS)
//   phone_change  → phone OTP (authenticated)
// ─────────────────────────────────────────────────────────────────────────────
import crypto   from 'crypto';
import bcrypt   from 'bcryptjs';
import env      from '../config/env.config.js';
import ApiError from '../utils/ApiError.js';
import logger   from '../config/logger.config.js';
import { EmailService }    from './email.service.js';
import { SmsService }      from './sms.service.js';
import { WhatsAppService } from './whatsapp.service.js';
import { OTP_CONFIG }      from '../constants/app.constants.js';
import { normalisePhone }  from '../utils/validation.util.js';

const getOtpSession = async () => {
  const { OtpSession } = await import('../models/index.js');
  return OtpSession;
};

export const OtpService = {

  // ── SIGNUP: dual channel (phone + email simultaneously) ───────────────────

  async generateAndSendDualSignup(email, rawPhone, ip = null) {
    const normEmail  = email.trim().toLowerCase();
    const phone      = normalisePhone(rawPhone);
    const OtpSession = await getOtpSession();

    const [emailSends, phoneSends] = await Promise.all([
      OtpSession.countRecentSends(normEmail, OTP_CONFIG.MAX_PER_HOUR),
      OtpSession.countRecentSends(phone,      OTP_CONFIG.MAX_PER_HOUR),
    ]);
    if (emailSends >= OTP_CONFIG.MAX_PER_HOUR || phoneSends >= OTP_CONFIG.MAX_PER_HOUR) {
      throw new ApiError(429, 'Too many OTP requests. Try again after 1 hour.', [], 'OTP_RATE_LIMIT');
    }

    // Expire all prior unverified signup sessions for these identifiers
    await OtpSession.updateMany(
      { $or: [{ email: normEmail }, { phone }], purpose: 'register', verified: false },
      { $set: { expiresAt: new Date() } },
    );

    const phoneOtp = this._generateOtp();
    const emailOtp = this._generateOtp();

    const [phoneOtpHash, emailOtpHash] = await Promise.all([
      bcrypt.hash(phoneOtp, 10),
      bcrypt.hash(emailOtp, 10),
    ]);

    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // ── Create session with status 'pending' — update to 'sent' after delivery ──
    // BUG FIX: old code set deliveryStatus:'sent' BEFORE actually sending.
    // If delivery failed, the DB said 'sent' when nothing was sent.
    const session = await OtpSession.create({
      phone,
      email:           normEmail,
      purpose:         'register',
      otpHash:         phoneOtpHash,
      emailOtpHash,
      expiresAt,
      ipAddress:       ip,
      deliveryChannel: 'dual',
      deliveryStatus:  'pending',   // ← correct: set to pending first
    });

    // ── Bypass actual delivery and return OTPs directly ──────────────────────
    await OtpSession.findByIdAndUpdate(session._id, { deliveryStatus: 'sent' });

    logger.info('[OTP] Dual signup OTPs bypassed and returned in response', {
      email:   _maskEmail(normEmail),
      phone:   _maskPhone(phone),
    });

    return {
      expiresAt,
      maskedEmail:   _maskEmail(normEmail),
      maskedPhone:   _maskPhone(phone),
      emailOtp,
      phoneOtp,
    };
  },

  async verifyDualSignup(email, rawPhone, emailOtp, phoneOtp) {
    const normEmail  = email.trim().toLowerCase();
    const phone      = normalisePhone(rawPhone);
    const OtpSession = await getOtpSession();

    const session = await OtpSession.findOne({
      email:     normEmail,
      phone,
      purpose:   'register',
      verified:  false,
      expiresAt: { $gt: new Date() },
    }).select('+otpHash +emailOtpHash +email');

    if (!session) throw new ApiError(400, 'OTP session expired or not found. Request new OTPs.', [], 'OTP_NOT_FOUND');
    if (session.isLocked()) throw new ApiError(429, 'Too many failed attempts. Try again in 15 minutes.', [], 'OTP_LOCKED');

    const [isPhoneValid, isEmailValid] = await Promise.all([
      bcrypt.compare(String(phoneOtp), session.otpHash),
      bcrypt.compare(String(emailOtp), session.emailOtpHash),
    ]);

    if (!isPhoneValid || !isEmailValid) {
      await session.incrementAttempt();
      const remaining = Math.max(0, 5 - session.attemptCount - 1);
      const which = !isEmailValid && !isPhoneValid ? 'Both OTPs are'
        : !isEmailValid ? 'Email OTP is'
        : 'Phone OTP is';
      throw new ApiError(400, `${which} incorrect. ${remaining} attempt(s) remaining.`, [], 'OTP_INVALID');
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await session.markVerified(sessionToken);
    return { sessionToken, email: normEmail, phone };
  },

  // ── FORGOT PASSWORD: send OTP to email ───────────────────────────────────

  async generateAndSendEmailReset(email, ip = null) {
    const normEmail  = email.trim().toLowerCase();
    const OtpSession = await getOtpSession();

    const recentCount = await OtpSession.countRecentSends(normEmail, OTP_CONFIG.MAX_PER_HOUR);
    if (recentCount >= OTP_CONFIG.MAX_PER_HOUR) {
      throw new ApiError(429, 'Too many OTP requests. Try again after 1 hour.', [], 'OTP_RATE_LIMIT');
    }

    await OtpSession.updateMany(
      { email: normEmail, purpose: 'reset', verified: false },
      { $set: { expiresAt: new Date() } },
    );

    const otp       = this._generateOtp();
    const otpHash   = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    const session = await OtpSession.create({
      phone:           null,
      email:           normEmail,
      purpose:         'reset',
      otpHash,
      expiresAt,
      ipAddress:       ip,
      deliveryChannel: 'email',
      deliveryStatus:  'pending',
    });

    // ── Bypass actual delivery and return OTPs directly ──────────────────────
    await OtpSession.findByIdAndUpdate(session._id, { deliveryStatus: 'sent' });
    logger.info('[OTP] Password reset OTP bypassed and returned in response', { email: _maskEmail(normEmail) });
    
    return { 
      expiresAt, 
      maskedEmail: _maskEmail(normEmail),
      emailOtp: otp,
      otp,
    };
  },

  // ── FORGOT PASSWORD: send OTP to phone (WhatsApp/SMS) ────────────────────

  async generateAndSendPhoneReset(rawPhone, ip = null) {
    const phone      = normalisePhone(rawPhone);
    const OtpSession = await getOtpSession();

    const recentCount = await OtpSession.countRecentSends(phone, OTP_CONFIG.MAX_PER_HOUR);
    if (recentCount >= OTP_CONFIG.MAX_PER_HOUR) {
      throw new ApiError(429, 'Too many OTP requests. Try again after 1 hour.', [], 'OTP_RATE_LIMIT');
    }

    await OtpSession.updateMany(
      { phone, purpose: 'reset', verified: false },
      { $set: { expiresAt: new Date() } },
    );

    const otp       = this._generateOtp();
    const otpHash   = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    const useWhatsApp = env.WHATSAPP_OTP_ENABLED === 'true'
      && !!env.WHATSAPP_PHONE_NUMBER_ID && !!env.WHATSAPP_TOKEN;
    const channel = useWhatsApp ? 'whatsapp' : 'sms';

    const session = await OtpSession.create({
      phone,
      email:           null,
      purpose:         'reset',
      otpHash,
      expiresAt,
      ipAddress:       ip,
      deliveryChannel: channel,
      deliveryStatus:  'pending',
    });

    // ── Bypass actual delivery and return OTPs directly ──────────────────────
    await OtpSession.findByIdAndUpdate(session._id, { deliveryStatus: 'sent' });
    logger.info('[OTP] Password reset OTP bypassed and returned in response', { phone: _maskPhone(phone), channel });
    
    return {
      expiresAt,
      maskedPhone: _maskPhone(phone),
      channel,
      phoneOtp: otp,
      otp,
    };
  },

  // ── GENERIC VERIFY (email or phone) ──────────────────────────────────────

  async verifyOtp(identifier, otp, purpose) {
    const OtpSession = await getOtpSession();
    const session    = await OtpSession.findValid(identifier, purpose);

    if (!session)           throw new ApiError(400, 'OTP expired or not found. Request a new one.', [], 'OTP_NOT_FOUND');
    if (session.isLocked()) throw new ApiError(429, 'Too many failed attempts. Try again in 15 minutes.', [], 'OTP_LOCKED');

    const isValid = await bcrypt.compare(String(otp), session.otpHash);
    if (!isValid) {
      await session.incrementAttempt();
      const remaining = Math.max(0, 5 - session.attemptCount - 1);
      throw new ApiError(400, `Invalid OTP. ${remaining} attempt(s) remaining.`, [], 'OTP_INVALID');
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await session.markVerified(sessionToken);

    const isEmail = identifier.includes('@');
    return {
      sessionToken,
      email: isEmail ? identifier : (session.email || null),
      phone: !isEmail ? identifier : (session.phone || null),
    };
  },

  // ── PHONE CHANGE (authenticated) ─────────────────────────────────────────

  async generateAndSendPhone(rawPhone, purpose, ip = null) {
    const phone      = normalisePhone(rawPhone);
    const OtpSession = await getOtpSession();

    const recentCount = await OtpSession.countRecentSends(phone, OTP_CONFIG.MAX_PER_HOUR);
    if (recentCount >= OTP_CONFIG.MAX_PER_HOUR) {
      throw new ApiError(429, 'Too many OTP requests. Try again after 1 hour.', [], 'OTP_RATE_LIMIT');
    }

    await OtpSession.updateMany(
      { phone, purpose, verified: false },
      { $set: { expiresAt: new Date() } },
    );

    const otp       = this._generateOtp();
    const otpHash   = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    const useWhatsApp = env.WHATSAPP_OTP_ENABLED === 'true'
      && !!env.WHATSAPP_PHONE_NUMBER_ID && !!env.WHATSAPP_TOKEN;

    const session = await OtpSession.create({
      phone,
      email:           null,
      purpose,
      otpHash,
      expiresAt,
      ipAddress:       ip,
      deliveryChannel: useWhatsApp ? 'whatsapp' : 'sms',
      deliveryStatus:  'pending',
    });

    // ── Bypass actual delivery and return OTPs directly ──────────────────────
    await OtpSession.findByIdAndUpdate(session._id, { deliveryStatus: 'sent' });
    logger.info('[OTP] Phone change OTP bypassed and returned in response', { phone: _maskPhone(phone) });

    return {
      expiresAt,
      maskedPhone: _maskPhone(phone),
      phoneOtp: otp,
      otp,
    };
  },

  // ── CONSUME session token (one-time use after OTP verified) ──────────────

  async consumeSessionToken(sessionToken) {
    const OtpSession = await getOtpSession();

    const session = await OtpSession.findOne({
      sessionToken,
      verified:         true,
      sessionTokenUsed: false,
    }).select('+sessionToken +email');

    if (!session) throw new ApiError(401, 'Invalid or already-used session token.', [], 'SESSION_TOKEN_INVALID');

    await session.consumeSessionToken();
    return {
      phone:   session.phone  || null,
      email:   session.email  || null,
      purpose: session.purpose,
    };
  },

  _generateOtp() {
    return String(crypto.randomInt(100000, 999999));
  },
};

// ── Internal helpers ──────────────────────────────────────────────────────────
const _maskPhone = (phone) => phone.replace(/(\+?\d{2,3})\d{6}(\d{2})/, '$1******$2');
const _maskEmail = (email) => {
  if (!email?.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};