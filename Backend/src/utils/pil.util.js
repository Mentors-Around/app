// ─────────────────────────────────────────────────────────────────────────────
// src/utils/pii.util.js
//
// Detects and blocks personally identifiable information (PII) in
// user-generated text such as query messages, teacher response messages,
// doubt content, and announcements.
//
// Purpose: prevent students and teachers from exchanging contact details
// outside the platform (which would allow them to bypass the query token
// system and reach each other directly for free).
// ─────────────────────────────────────────────────────────────────────────────
import ApiError from './ApiError.js';

// Indian mobile: 10 digits starting with 6–9, optionally prefixed with +91/91/0
const PHONE_REGEX         = /(\+91|0091|91)?[\s\-.]?[6-9]\d{9}\b/;
// Generic 10–12 digit number (catches numbers without country codes)
const GENERIC_PHONE_REGEX = /\b[6-9]\d{9}\b|\b\d{10,12}\b/;
// Email addresses
const EMAIL_REGEX         = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
// WhatsApp / Telegram invitation hints
const MESSAGING_REGEX     = /\b(whatsapp|telegram|wa\.me|t\.me|signal)\b/i;
// Social media @ handles (e.g. @username)
const SOCIAL_HANDLE_REGEX = /@[a-zA-Z0-9_.]{3,}/;

/**
 * Analyse text for PII.
 *
 * @param {string} text
 * @returns {{ hasPII: boolean, hasPhone: boolean, hasEmail: boolean, hasMessagingHint: boolean }}
 */
export const detectPII = (text) => {
  if (!text || typeof text !== 'string') return { hasPII: false };

  const hasPhone         = PHONE_REGEX.test(text) || GENERIC_PHONE_REGEX.test(text);
  const hasEmail         = EMAIL_REGEX.test(text);
  const hasMessagingHint = MESSAGING_REGEX.test(text) || SOCIAL_HANDLE_REGEX.test(text);
  const hasPII           = hasPhone || hasEmail || hasMessagingHint;

  return { hasPII, hasPhone, hasEmail, hasMessagingHint };
};

/**
 * Throw ApiError 400 if text contains PII.
 * Use on any user-generated message field before saving to DB.
 *
 * @param {string|null|undefined} text   The message to check
 * @param {string}                field  Human-readable field name for the error message
 */
export const blockIfPII = (text, field = 'message') => {
  if (!text) return;                    // null / empty is fine
  const { hasPII, hasPhone, hasEmail, hasMessagingHint } = detectPII(text);

  if (!hasPII) return;

  const detail = [
    hasPhone         && 'phone number',
    hasEmail         && 'email address',
    hasMessagingHint && 'messaging app link or handle',
  ].filter(Boolean).join(', ');

  throw new ApiError(
    400,
    `Your ${field} appears to contain personal contact information (${detail}). ` +
    'For your safety and to keep all communication on TrueEd, sharing personal details is not allowed. ' +
    'Please communicate only through the platform.',
    [],
    'PII_DETECTED',
  );
};

/**
 * Convenience wrapper for multiple fields.
 * Pass an object of { fieldName: value } pairs.
 *
 * @param {Record<string, string|null|undefined>} fields
 */
export const blockAllPII = (fields) => {
  for (const [name, value] of Object.entries(fields)) {
    blockIfPII(value, name);
  }
};