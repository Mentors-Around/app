// src/constants/enums.js
// Mirrors backend src/constants/enums.js — keep in sync manually since
// frontend and backend are separate deployables.

export const ROLES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
});

export const VERIFICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

export const CLASSROOM_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETION_PENDING: 'completion_pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const CLASSROOM_MODE = Object.freeze({ ONLINE: 'online', OFFLINE: 'offline' });

export const CLASSROOM_TYPE = Object.freeze({ ACADEMIC: 'academic', HOBBY: 'hobby' });

export const SKILL_LEVEL = Object.freeze({
  AMATEUR: 'amateur',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
});

// Teacher tabs: enrolled | accepted | active(pending) | rejected | expired | refunded(lapsed)
// Student tabs: enrolled | accepted | active(pending) | rejected | expired(lapsed)
export const QUERY_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  ENROLLED: 'enrolled',
  LAPSED: 'lapsed',
});

export const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  EXPELLED: 'expelled',
});

export const PAYMENT_STATUS = Object.freeze({
  CREATED: 'created',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
});

export const PAYMENT_PURPOSE = Object.freeze({
  TOKEN_PURCHASE: 'token_purchase',
  ENROLLMENT_FEE: 'enrollment_fee',
  TEACHER_DEPOSIT: 'teacher_deposit',
  CASH_DEPOSIT: 'cash_deposit',
  CASH_WITHDRAWAL: 'cash_withdrawal',
});

export const PAYOUT_STATUS = Object.freeze({
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ON_HOLD: 'on_hold',
});

export const DOUBT_VISIBILITY = Object.freeze({ PUBLIC: 'public', PRIVATE: 'private' });
export const DOUBT_STATUS = Object.freeze({ OPEN: 'open', ANSWERED: 'answered', CLOSED: 'closed' });

export const MATERIAL_TYPE = Object.freeze({
  PDF: 'pdf',
  PPT: 'ppt',
  VIDEO: 'video',
  LINK: 'link',
  IMAGE: 'image',
  DOCUMENT: 'document',
});

export const ASSIGNMENT_STATUS = Object.freeze({ DRAFT: 'draft', PUBLISHED: 'published', CLOSED: 'closed' });
export const SUBMISSION_STATUS = Object.freeze({
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  LATE: 'late',
});

export const POLL_TYPE = Object.freeze({ GENERAL: 'general', EARLY_END: 'early_end' });
export const POLL_STATUS = Object.freeze({ ACTIVE: 'active', CLOSED: 'closed', EXPIRED: 'expired' });

export const TEST_STATUS = Object.freeze({ DRAFT: 'draft', PUBLISHED: 'published', CLOSED: 'closed' });
export const TEST_ATTEMPT_STATUS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  AUTO_SUBMITTED: 'auto_submitted',
});

export const EXTRA_CLASS_STATUS = Object.freeze({ PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' });

export const TOKEN_TRANSACTION_TYPE = Object.freeze({
  PURCHASED: 'purchased',
  USED: 'used',
  REFUNDED: 'refunded',
  BONUS: 'bonus',
});

export const OTP_PURPOSE = Object.freeze({
  REGISTER: 'register',
  RESET: 'reset',
  PHONE_CHANGE: 'phone_change',
  EMAIL_CHANGE: 'email_change',
});

export const REFUND_STATUS = Object.freeze({
  REQUESTED: 'requested',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSED: 'processed',
});

export const REFUND_REASON = Object.freeze({
  TEACHER_ABANDONED: 'teacher_abandoned',
  TEACHER_NO_SHOW: 'teacher_no_show',
  TECHNICAL_ISSUE: 'technical_issue',
  UNSATISFIED: 'unsatisfied',
  DOUBLE_CHARGE: 'double_charge',
  QUERY_AUTO_EXPIRED: 'query_auto_expired',
  OTHER: 'other',
});

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