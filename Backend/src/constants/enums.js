// ─────────────────────────────────────────────────────────────────────────────
// src/constants/enums.js
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
  DRAFT:              'draft',
  ACTIVE:             'active',
  PAUSED:             'paused',
  COMPLETION_PENDING: 'completion_pending',
  COMPLETED:          'completed',
  CANCELLED:          'cancelled',
});

export const CLASSROOM_MODE = Object.freeze({
  ONLINE:  'online',
  OFFLINE: 'offline',
});

// NEW: academic = school/competitive/college subjects
//      hobby    = music, art, sports, coding etc.
export const CLASSROOM_TYPE = Object.freeze({
  ACADEMIC: 'academic',
  HOBBY:    'hobby',
});

// NEW: skill level — optional for both academic and hobby classrooms
export const SKILL_LEVEL = Object.freeze({
  AMATEUR:      'amateur',
  INTERMEDIATE: 'intermediate',
  ADVANCED:     'advanced',
});

// ── Enrollment Query ──────────────────────────────────────────────────────────
// Teacher tabs:  enrolled | accepted | active(pending) | rejected | expired | refunded(lapsed)
// Student tabs:  enrolled | accepted | active(pending) | rejected | expired(lapsed)
export const QUERY_STATUS = Object.freeze({
  PENDING:  'pending',   // waiting for teacher — counts as "active" in UI tabs
  ACCEPTED: 'accepted',  // teacher accepted — student can enroll (teacher tab: accepted)
  REJECTED: 'rejected',  // teacher rejected — token refunded to student
  EXPIRED:  'expired',   // no teacher response in 24h — token refunded to student
  ENROLLED: 'enrolled',  // student paid and enrolled
  LAPSED:   'lapsed',    // accepted but student didn't enroll in 24h — teacher gets 4% back
                         // teacher tab: "refunded" | student tab: "expired"
});

// ── Enrollment ────────────────────────────────────────────────────────────────
export const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE:    'active',
  COMPLETED: 'completed',
  DROPPED:   'dropped',
  EXPELLED:  'expelled',
});

// ── Payment ───────────────────────────────────────────────────────────────────
export const PAYMENT_STATUS = Object.freeze({
  CREATED:             'created',
  AUTHORIZED:          'authorized',
  CAPTURED:            'captured',
  FAILED:              'failed',
  REFUNDED:            'refunded',
  PARTIALLY_REFUNDED:  'partially_refunded',
});

export const PAYMENT_PURPOSE = Object.freeze({
  TOKEN_PURCHASE:   'token_purchase',   // ₹19 for 3 tokens via Razorpay
  ENROLLMENT_FEE:   'enrollment_fee',   // classroom enrollment via Razorpay
  TEACHER_DEPOSIT:  'teacher_deposit',  // 4% deposit when accepting query
  CASH_DEPOSIT:     'cash_deposit',     // student/teacher topping up wallet via Razorpay
  CASH_WITHDRAWAL:  'cash_withdrawal',  // wallet payout to bank via Razorpay X
});

export const ESCROW_STATUS = Object.freeze({
  HOLDING:        'holding',
  RELEASED:       'released',
  REFUNDED:       'refunded',
  PARTIAL_REFUND: 'partial_refund',
});

// ── Payout ────────────────────────────────────────────────────────────────────
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

// ── Completion case ───────────────────────────────────────────────────────────
export const COMPLETION_CASE = Object.freeze({
  CASE_1: 'case_1',
  CASE_2: 'case_2',
  CASE_3: 'case_3',
});

// ── Doubt ─────────────────────────────────────────────────────────────────────
export const DOUBT_VISIBILITY = Object.freeze({
  PUBLIC:  'public',
  PRIVATE: 'private',
});

export const DOUBT_STATUS = Object.freeze({
  OPEN:     'open',
  ANSWERED: 'answered',
  CLOSED:   'closed',
});

// ── Material ──────────────────────────────────────────────────────────────────
export const MATERIAL_TYPE = Object.freeze({
  PDF:      'pdf',
  PPT:      'ppt',
  VIDEO:    'video',
  LINK:     'link',
  IMAGE:    'image',
  DOCUMENT: 'document',
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
  GENERAL:   'general',
  EARLY_END: 'early_end',
});

export const POLL_STATUS = Object.freeze({
  ACTIVE:  'active',
  CLOSED:  'closed',
  EXPIRED: 'expired',
});

// ── Extra class ───────────────────────────────────────────────────────────────
export const EXTRA_CLASS_STATUS = Object.freeze({
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

// ── Notification ──────────────────────────────────────────────────────────────
export const NOTIFICATION_CHANNEL = Object.freeze({
  SMS:      'sms',
  EMAIL:    'email',
  PUSH:     'push',
  WHATSAPP: 'whatsapp',
});

// ── Token wallet ──────────────────────────────────────────────────────────────
export const TOKEN_TRANSACTION_TYPE = Object.freeze({
  PURCHASED: 'purchased',
  USED:      'used',
  REFUNDED:  'refunded',
  BONUS:     'bonus',
});

// ── OTP ───────────────────────────────────────────────────────────────────────
export const OTP_PURPOSE = Object.freeze({
  REGISTER:     'register',
  RESET:        'reset',
  PHONE_CHANGE: 'phone_change',
  EMAIL_CHANGE: 'email_change',   // NEW: verify new email before updating
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
  TOKEN_PRICE_PAISE:            1900,
  TOKENS_PER_PURCHASE:          3,
  TEACHER_DEPOSIT_PERCENT:      4,
  PLATFORM_CUT_CASE1:           15,
  TEACHER_SHARE_CASE1:          89,
  PLATFORM_CUT_CASE2:           4,
  PLATFORM_CUT_CASE3:           14,
  STUDENT_FIXED_REFUND_CASE3:   30,
});