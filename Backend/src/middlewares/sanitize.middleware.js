// src/middlewares/sanitize.middleware.js
import xss from "xss";

// ─── Fields that must survive byte-for-byte (never rendered as HTML, only
// ─── hashed/compared server-side). HTML-escaping these silently corrupts
// ─── the value: bcrypt.compare(escaped, hash) fails even for the *correct*
// ─── password if it contains characters like < > & " ' — this was the
// ─── root cause of "correct password rejected" on login / wallet payment /
// ─── change-password. OTP and token fields are excluded for the same reason.
const XSS_EXEMPT_FIELDS = new Set([
  "password", "oldPassword", "newPassword", "confirmPassword",
  "transactionPassword", "currentPassword",
  "otp", "emailOtp", "phoneOtp", "code",
  "sessionToken", "refreshToken", "accessToken",
  "razorpaySignature", "razorpayOrderId", "razorpayPaymentId",
]);

// ─── Recursive NoSQL Scrubbing (Removes keys starting with $ or containing .) ───
function deepCleanNoSQL(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(deepCleanNoSQL);

  const cleanObj = {};
  for (const [key, val] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      continue; // Drop the injection key completely
    }
    cleanObj[key] = deepCleanNoSQL(val);
  }
  return cleanObj;
}

// ─── Recursive XSS Escape ─────────────────────────────────────────────────────
// `parentKey` lets us skip escaping for fields in XSS_EXEMPT_FIELDS (passwords,
// OTPs, tokens, Razorpay signatures) — those are never rendered as HTML, and
// escaping them corrupts the exact byte sequence needed for hashing/comparison.
function deepCleanXSS(value, parentKey = null) {
  if (typeof value === "string") {
    return parentKey && XSS_EXEMPT_FIELDS.has(parentKey) ? value : xss(value);
  }
  if (Array.isArray(value)) return value.map((v) => deepCleanXSS(v, parentKey));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !["__proto__", "constructor", "prototype"].includes(k))
        .map(([k, v]) => [k, deepCleanXSS(v, k)])
    );
  }
  return value;
}

export const mongoSanitizeMiddleware = (req, _res, next) => {
  if (req.body) req.body = deepCleanNoSQL(req.body);

  // In-place assignment to comply with Express 5 read-only getters contract
  if (req.query) {
    const cleanQuery = deepCleanNoSQL(req.query);
    for (const key in req.query) delete req.query[key];
    Object.assign(req.query, cleanQuery);
  }
  if (req.params) {
    const cleanParams = deepCleanNoSQL(req.params);
    for (const key in req.params) delete req.params[key];
    Object.assign(req.params, cleanParams);
  }
  next();
};

export const xssSanitizeMiddleware = (req, _res, next) => {
  if (req.body) req.body = deepCleanXSS(req.body);

  if (req.query) {
    const cleanQuery = deepCleanXSS(req.query);
    for (const key in req.query) delete req.query[key];
    Object.assign(req.query, cleanQuery);
  }
  if (req.params) {
    const cleanParams = deepCleanXSS(req.params);
    for (const key in req.params) delete req.params[key];
    Object.assign(req.params, cleanParams);
  }
  next();
};