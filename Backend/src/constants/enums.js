// ─────────────────────────────────────────────────────────────────────────────
// src/constants/enums.js
// Central registry for every enum used across models.
// ─────────────────────────────────────────────────────────────────────────────

export const ROLES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN:   'admin',
});

export const VERIFICATION_STATUS = Object.freeze({
  PENDING:   'pending',
  APPROVED:  'approved',
  REJECTED:  'rejected',
  SUSPENDED: 'suspended',
});

export const DOCUMENT_TYPE = Object.freeze({
  AADHAAR:       'aadhaar',
  PAN:           'pan',
  DEGREE:        'degree',
  CERTIFICATE:   'certificate',
  BANK_PASSBOOK: 'bank_passbook',
  SELFIE:        'selfie',
});

export const DOCUMENT_STATUS = Object.freeze({
  UPLOADED:     'uploaded',
  UNDER_REVIEW: 'under_review',
  APPROVED:     'approved',
  REJECTED:     'rejected',
});

export const ALLOWED_DOCUMENT_TYPES = Object.values(DOCUMENT_TYPE);

// ── Classroom ─────────────────────────────────────────────────────────────────
export const CLASSROOM_STATUS = Object.freeze({
  DRAFT:              'draft',           // being configured
  ACTIVE:             'active',          // accepting students / running
  PAUSED:             'paused',          // temporarily paused
  COMPLETION_PENDING: 'completion_pending', // early-end vote in progress
  COMPLETED:          'completed',       // officially done
  CANCELLED:          'cancelled',       // admin/teacher cancelled
});

export const CLASSROOM_MODE = Object.freeze({
  ONLINE:  'online',
  OFFLINE: 'offline',
});

// ── Enrollment Query (the "request to enroll" flow) ───────────────────────────
export const QUERY_STATUS = Object.freeze({
  PENDING:  'pending',   // waiting for teacher response
  ACCEPTED: 'accepted',  // teacher accepted — student can enroll
  REJECTED: 'rejected',  // teacher rejected — token refunded
  EXPIRED:  'expired',   // no response in 5 days — treated as rejected, token refunded
  ENROLLED: 'enrolled',  // student paid and enrolled after acceptance
  LAPSED:   'lapsed',    // accepted but student didn't enroll within 5 days
});

// ── Enrollment ────────────────────────────────────────────────────────────────
export const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE:    'active',
  COMPLETED: 'completed',
  DROPPED:   'dropped',   // student dropped
  EXPELLED:  'expelled',  // admin/teacher action
});

// ── Payment (enrollment fee) ──────────────────────────────────────────────────
export const PAYMENT_STATUS = Object.freeze({
  CREATED:             'created',
  AUTHORIZED:          'authorized',
  CAPTURED:            'captured',
  FAILED:              'failed',
  REFUNDED:            'refunded',
  PARTIALLY_REFUNDED:  'partially_refunded',
});

export const PAYMENT_PURPOSE = Object.freeze({
  TOKEN_PURCHASE: 'token_purchase',   // ₹19 for 3 tokens
  ENROLLMENT_FEE: 'enrollment_fee',   // classroom enrollment
  TEACHER_DEPOSIT:'teacher_deposit',  // 4% deposit when accepting query
});

export const ESCROW_STATUS = Object.freeze({
  HOLDING:        'holding',
  RELEASED:       'released',
  REFUNDED:       'refunded',
  PARTIAL_REFUND: 'partial_refund',
});

// ── Payout (teacher earnings) ─────────────────────────────────────────────────
export const PAYOUT_STATUS = Object.freeze({
  QUEUED:     'queued',
  PROCESSING: 'processing',
  COMPLETED:  'completed',
  FAILED:     'failed',
  ON_HOLD:    'on_hold',
});

export const PAYOUT_STAGE = Object.freeze({
  ESCROW_RELEASED:  'escrow_released',
  PAYOUT_INITIATED: 'payout_initiated',
  PAYOUT_SETTLED:   'payout_settled',
});

// ── Course completion case (drives refund math) ───────────────────────────────
export const COMPLETION_CASE = Object.freeze({
  CASE_1: 'case_1', // completed fully or ≥70% student vote → teacher gets 89%, platform 15%
  CASE_2: 'case_2', // teacher left before 50% hours → full refund to student, platform keeps 4%
  CASE_3: 'case_3', // teacher left after 50% hours → pro-rata split
});

// ── Doubt ─────────────────────────────────────────────────────────────────────
export const DOUBT_VISIBILITY = Object.freeze({
  PUBLIC:  'public',   // visible to all students in classroom
  PRIVATE: 'private',  // visible only to teacher
});

// ── Dynamic Badges / Trust Enums ──────────────────────────────────────────────
export const DOUBT_STATUS = Object.freeze({
  OPEN:     'open',
  ANSWERED: 'answered',
  CLOSED:   'closed',
});

// ── Material ──────────────────────────────────────────────────────────────────
export const MATERIAL_TYPE = Object.freeze({
  PDF:         'pdf',
  PPT:         'ppt',
  VIDEO:       'video',
  LINK:        'link',
  IMAGE:       'image',
  DOCUMENT:    'document',
});

// ── Assignment ────────────────────────────────────────────────────────────────
export const ASSIGNMENT_STATUS = Object.freeze({
  DRAFT:     'draft',
  PUBLISHED: 'published',
  CLOSED:    'closed',
});

export const SUBMISSION_STATUS = Object.freeze({
  PENDING:   'pending',
  SUBMITTED: 'submitted',
  GRADED:    'graded',
  LATE:      'late',
});

// ── Poll ──────────────────────────────────────────────────────────────────────
export const POLL_TYPE = Object.freeze({
  GENERAL:    'general',
  EARLY_END:  'early_end',  // the 70% vote to end course early
});

export const POLL_STATUS = Object.freeze({
  ACTIVE:  'active',
  CLOSED:  'closed',
  EXPIRED: 'expired',
});

// ── Extra class request ───────────────────────────────────────────────────────
export const EXTRA_CLASS_STATUS = Object.freeze({
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

// ── Notification ──────────────────────────────────────────────────────────────
export const NOTIFICATION_CHANNEL = Object.freeze({
  SMS:       'sms',
  EMAIL:     'email',
  PUSH:      'push',
  WHATSAPP:  'whatsapp',
});

// ── Token wallet ──────────────────────────────────────────────────────────────
export const TOKEN_TRANSACTION_TYPE = Object.freeze({
  PURCHASED: 'purchased',  // bought via ₹19 payment
  USED:      'used',       // spent on a query
  REFUNDED:  'refunded',   // returned on rejection/expiry
  BONUS:     'bonus',      // admin grant
});

// ── OTP ───────────────────────────────────────────────────────────────────────
export const OTP_PURPOSE = Object.freeze({
  REGISTER:     'register',    // dual signup OTP (phone + email)
  RESET:        'reset',       // forgot password (email or phone channel)
  PHONE_CHANGE: 'phone_change', // authenticated phone update
  // LOGIN via OTP removed — password login only (no delivery cost per login)
});

// ── Refund ────────────────────────────────────────────────────────────────────
export const REFUND_STATUS = Object.freeze({
  REQUESTED:    'requested',
  UNDER_REVIEW: 'under_review',
  APPROVED:     'approved',
  REJECTED:     'rejected',
  PROCESSED:    'processed',
});

export const REFUND_REASON = Object.freeze({
  TEACHER_ABANDONED:  'teacher_abandoned',
  TEACHER_NO_SHOW:    'teacher_no_show',
  TECHNICAL_ISSUE:    'technical_issue',
  UNSATISFIED:        'unsatisfied',
  DOUBLE_CHARGE:      'double_charge',
  QUERY_AUTO_EXPIRED: 'query_auto_expired',
  OTHER:              'other',
});

// NOTE: AGE_LIMITS lives in app.constants.js (single source of truth) —
// do not redefine it here; importing it from two files caused a silent
// duplicate that would diverge over time. Import { AGE_LIMITS } from
// '../constants/app.constants.js' everywhere (middlewares included).

// ── Idempotency (For Preventing Anti-DDoS Duplicate Form Submissions) ─────────
export const IDEMPOTENCY = Object.freeze({
  HEADER: 'Idempotency-Key',
  TTL_MS: 24 * 60 * 60 * 1000, 
});

// ── Static data ───────────────────────────────────────────────────────────────
export const INDIAN_BOARDS = Object.freeze([
  'CBSE', 'ICSE', 'IB', 'IGCSE', 'State Board', 'JEE', 'NEET', 'Other',
]);

export const SUBJECTS = Object.freeze([
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'Hindi', 'History', 'Geography',
  'Economics', 'Computer Science', 'Coding',
  'Accountancy', 'Business Studies',
  'Music', 'Guitar', 'Art', 'Dance',
  'Spoken English', 'Other',
]);

export const CLASS_GRADES = Object.freeze([
  '1','2','3','4','5','6','7','8','9','10','11','12',
  'UG','PG','Competitive','Beginner','Intermediate','Advanced',
]);

// ── Platform financial constants ──────────────────────────────────────────────
export const PLATFORM_FEE = Object.freeze({
  TOKEN_PRICE_PAISE:        1900,  
  TOKENS_PER_PURCHASE:      3,
  TEACHER_DEPOSIT_PERCENT:  4,     
  PLATFORM_CUT_CASE1:       15,    
  TEACHER_SHARE_CASE1:      89,    
  PLATFORM_CUT_CASE2:       4,     
  PLATFORM_CUT_CASE3:       14,    
  STUDENT_FIXED_REFUND_CASE3: 30,  
});