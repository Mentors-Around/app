// src/utils/validation.util.js
// Client-side mirrors of backend/src/utils/validation.util.js rules.
// These are for fast UX feedback only — the backend is the source of truth
// and re-validates everything server-side.

export const isValidEmail = (email = '') =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Indian phone: 10 digits starting 6-9, optional +91 prefix */
export const isValidIndianPhone = (phone = '') =>
  /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));

export const normalisePhone = (phone = '') => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+91')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return cleaned;
};

/** Min 8 chars, at least one letter and one number — matches backend exactly */
export const isStrongPassword = (password = '') =>
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

export const passwordStrengthLabel = (password = '') => {
  if (!password) return { label: '', score: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  return { label: labels[score], score };
};

export const sanitizeString = (str = '') =>
  typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : str;

export const requireFields = (obj, fields) =>
  fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === '');
