// ─────────────────────────────────────────────────────────────────────────────
// src/constants/app.constants.js
// ─────────────────────────────────────────────────────────────────────────────

export const DB_NAME = 'trueed';

// ── Platform financial constants (amounts in PAISE) ───────────────────────────
export const PLATFORM_FEE = Object.freeze({
  TOKEN_PRICE_PAISE:                  1900,   // ₹19 per purchase
  TOKENS_PER_PURCHASE:                3,
  TEACHER_DEPOSIT_PERCENT:            4,      // 4% taken upfront from teacher on query accept
  PLATFORM_CUT_TOTAL_PERCENT:         10,     // 10% total platform commission (4% upfront + 6% at completion)
  CASE1_DURATION_DAYS_THRESHOLD:      15,     // > 15 days threshold for Case 1
  CASE1_MID_TEACHER_PAYOUT_PERCENT:   40,     // 40% paid to teacher at 50% course duration
  CASE1_FINAL_TEACHER_PAYOUT_PERCENT: 54,     // 54% paid to teacher at 100% course duration (Total 94%)
  CASE1_EARLY_LEAVE_TEACHER_PERCENT:  40,     // 40% to teacher if teacher leaves after 50%
  CASE1_EARLY_LEAVE_STUDENT_PERCENT:  50,     // 50% refund to student if teacher leaves after 50%
  CASE1_EARLY_LEAVE_PLATFORM_PERCENT: 14,     // 14% total to platform if teacher leaves after 50% (4% upfront + 10%)
  CASE2_FINAL_TEACHER_PAYOUT_PERCENT: 94,     // 94% paid to teacher at 100% course completion for <= 15 days
});

// ── Token / Query flow ────────────────────────────────────────────────────────
// Updated: 24-hour deadlines as per product spec change
export const QUERY_LIMITS = Object.freeze({
  PENDING_EXPIRE_HOURS:         24,   // teacher must respond within 24 hours (was 5 days)
  ACCEPTED_ENROLL_WINDOW_HOURS: 24,   // student must enroll within 24 hours of acceptance (was 5 days)
  TEACHER_DEPOSIT_REFUND_HOURS: 24,   // teacher gets 4% back if student doesn't enroll in 24h
  EARLY_END_VOTE_THRESHOLD:     70,   // % of enrolled students needed to approve early end
  MIN_HOURS_BEFORE_EARLY_END:   50,   // teacher must have completed ≥50% hours
});

// ── Pagination ────────────────────────────────────────────────────────────────
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     100,
  SEARCH_LIMIT:  20,
});

// ── File upload limits ────────────────────────────────────────────────────────
export const UPLOAD_LIMITS = Object.freeze({
  PROFILE_IMAGE_MB:    5,
  MATERIAL_MB:         10,
  KYC_DOCUMENT_MB:     10,
  CLASSROOM_PHOTO_MB:  10,
  CLASSROOM_VIDEO_MB:  50,
  MAX_FILES_PER_BATCH: 10,
});

// ── Cloudinary folders ────────────────────────────────────────────────────────
export const CLOUDINARY_FOLDERS = Object.freeze({
  PROFILE_IMAGES:   'trueed/profiles',
  KYC_DOCUMENTS:    'trueed/kyc',
  CLASSROOM_MEDIA:  'trueed/classrooms',
  MATERIALS:        'trueed/materials',
  ASSIGNMENT_FILES: 'trueed/assignments',
  SUBMISSION_FILES: 'trueed/submissions',
});

// ── OTP / Session ─────────────────────────────────────────────────────────────
export const OTP_CONFIG = Object.freeze({
  LENGTH:         6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS:   5,
  LOCK_MINUTES:   15,
  MAX_PER_HOUR:   5,
});

// ── JWT ───────────────────────────────────────────────────────────────────────
export const JWT_CONFIG = Object.freeze({
  ACCESS_EXPIRY:  '15m',
  REFRESH_EXPIRY: '7d',
  ALGORITHM:      'HS256',
});

// ── Rate limits ───────────────────────────────────────────────────────────────
export const RATE_LIMITS = Object.freeze({
  GLOBAL_WINDOW_MS:  15 * 60 * 1000,
  GLOBAL_MAX:        100,
  AUTH_WINDOW_MS:    15 * 60 * 1000,
  AUTH_MAX:          10,
  OTP_WINDOW_MS:     60 * 60 * 1000,
  OTP_MAX:           5,
  SEARCH_WINDOW_MS:  60 * 1000,
  SEARCH_MAX:        30,
  PAYMENT_WINDOW_MS: 60 * 1000,
  PAYMENT_MAX:       20,
});

// ── Age / KYC ─────────────────────────────────────────────────────────────────
export const AGE_LIMITS = Object.freeze({
  MINOR_THRESHOLD: 18,
  MIN_TEACHER_AGE: 18,
});

// ── Google Meet ───────────────────────────────────────────────────────────────
export const GMEET_BASE_URL = 'https://meet.google.com/';

// ── Help & Support ────────────────────────────────────────────────────────────
// Update these when we have dedicated support infrastructure
export const SUPPORT_CONTACT = Object.freeze({
  EMAIL: 'trued.alex@gmail.com',
  PHONE: '+919905893153',
  HOURS: 'Mon–Sat, 10 AM – 7 PM IST',
});

// ── PII Detection ─────────────────────────────────────────────────────────────
// Used by pii.util.js to block personal info in user-generated messages
export const PII_PATTERNS = Object.freeze({
  // Indian mobile numbers (all formats)
  PHONE: /(\+91|0091|91)?[\s\-.]?([6-9]\d{9})\b/,
  // Generic 10+ digit numbers (catches numbers without country codes)
  GENERIC_PHONE: /\b[6-9]\d{9}\b|\b\d{10,12}\b/,
  // Email addresses
  EMAIL: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // WhatsApp / Telegram handles
  WHATSAPP_HINT: /whatsapp|telegram|wa\.me/i,
  // Social handles
  SOCIAL: /@[a-zA-Z0-9_.]{3,}/,
});