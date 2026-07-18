// ─────────────────────────────────────────────────────────────────────────────
// src/utils/pii.util.js (pil.util.js)
//
// Detects and blocks personally identifiable information (PII) in
// user-generated text such as query messages, teacher response messages,
// doubt content, announcements, and material descriptions.
// ─────────────────────────────────────────────────────────────────────────────
import ApiError from './ApiError.js';

// Standard email regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i;

// Obfuscated email regex (e.g. user at domain dot com or user(at)domain(dot)com)
const OBFUSCATED_EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+\s*(\(at\)|\[at\]|\b at \b|@)\s*[a-zA-Z0-9.\-]+\s*(\(dot\)|\[dot\]|\b dot \b|\.)\s*[a-zA-Z]{2,}/i;

// WhatsApp / Telegram / Social invitation hints
const MESSAGING_REGEX = /\b(whatsapp|telegram|wa\.me|t\.me|signal|instagram|insta|phone|call me|contact me at)\b/i;

// Social media @ handles (e.g. @username)
const SOCIAL_HANDLE_REGEX = /@[a-zA-Z0-9_.]{3,}/;

/**
 * Check if a text contains phone numbers, considering spaced or formatted digits.
 * e.g., "9905893153", "+91 9905893153", "9 9 0 5 8 9 3 1 5 3", "99058-93153"
 */
function checkPhoneNumber(text) {
  if (!text) return false;

  // Direct 10-digit check starting with 6-9
  if (/(\+91|0091|91)?[\s\-.]?[6-9]\d{9}\b/.test(text)) return true;
  if (/\b[6-9]\d{9}\b|\b\d{10,12}\b/.test(text)) return true;

  // Normalized check: strip spaces, dashes, dots, brackets, plus signs between numbers
  // Example: "9 9 0 5 8 9 3 1 5 3" -> "9905893153"
  const digitsOnly = text.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 10) {
    // Check if there's a sequence of 10 digits starting with 6-9 in digitsOnly
    if (/[6-9]\d{9}/.test(digitsOnly)) return true;
  }

  return false;
}

/**
 * Analyse text for PII.
 *
 * @param {string} text
 * @returns {{ hasPII: boolean, hasPhone: boolean, hasEmail: boolean, hasMessagingHint: boolean }}
 */
export const detectPII = (text) => {
  if (!text || typeof text !== 'string') return { hasPII: false };

  const hasPhone = checkPhoneNumber(text);
  const hasEmail = EMAIL_REGEX.test(text) || OBFUSCATED_EMAIL_REGEX.test(text);
  const hasMessagingHint = MESSAGING_REGEX.test(text) || SOCIAL_HANDLE_REGEX.test(text);
  const hasPII = hasPhone || hasEmail || hasMessagingHint;

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
  if (!text) return; // null / empty is fine
  const { hasPII, hasPhone, hasEmail, hasMessagingHint } = detectPII(text);

  if (!hasPII) return;

  const detail = [
    hasPhone && 'phone number',
    hasEmail && 'email address',
    hasMessagingHint && 'messaging app link or handle',
  ].filter(Boolean).join(', ');

  throw new ApiError(
    400,
    `Your ${field} appears to contain personal contact information (${detail}). ` +
    'Sharing personal details (phone numbers, email addresses, social handles) is strictly prohibited on TrueEd. ' +
    'Please communicate exclusively through platform features.',
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