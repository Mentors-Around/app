// src/utils/pii.util.js
// Client-side detection of personally identifiable information (PII)
// like phone numbers, emails, social handles, or messaging app links.

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i;
const OBFUSCATED_EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+\s*(\(at\)|\[at\]|\b at \b|@)\s*[a-zA-Z0-9.\-]+\s*(\(dot\)|\[dot\]|\b dot \b|\.)\s*[a-zA-Z]{2,}/i;
const MESSAGING_REGEX = /\b(whatsapp|telegram|wa\.me|t\.me|signal|instagram|insta|phone|call me|contact me at)\b/i;
const SOCIAL_HANDLE_REGEX = /@[a-zA-Z0-9_.]{3,}/;

function checkPhoneNumber(text) {
  if (!text) return false;
  if (/(\+91|0091|91)?[\s\-.]?[6-9]\d{9}\b/.test(text)) return true;
  if (/\b[6-9]\d{9}\b|\b\d{10,12}\b/.test(text)) return true;

  const digitsOnly = text.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 10 && /[6-9]\d{9}/.test(digitsOnly)) return true;

  return false;
}

export const detectPII = (text) => {
  if (!text || typeof text !== 'string') return { hasPII: false };

  const hasPhone = checkPhoneNumber(text);
  const hasEmail = EMAIL_REGEX.test(text) || OBFUSCATED_EMAIL_REGEX.test(text);
  const hasMessagingHint = MESSAGING_REGEX.test(text) || SOCIAL_HANDLE_REGEX.test(text);
  const hasPII = hasPhone || hasEmail || hasMessagingHint;

  return { hasPII, hasPhone, hasEmail, hasMessagingHint };
};

export const validateNoPII = (text, fieldName = 'message') => {
  const { hasPII, hasPhone, hasEmail, hasMessagingHint } = detectPII(text);
  if (!hasPII) return null;

  const detail = [
    hasPhone && 'phone number',
    hasEmail && 'email address',
    hasMessagingHint && 'messaging app link or handle',
  ].filter(Boolean).join(', ');

  return `Your ${fieldName} contains personal contact details (${detail}). Sharing contact information is not allowed on TrueEd.`;
};

export default { detectPII, validateNoPII };
