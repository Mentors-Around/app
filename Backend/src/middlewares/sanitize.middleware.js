// ─────────────────────────────────────────────────────────────────────────────
// src/middlewares/sanitize.middleware.js
// Production-grade Input Sanitation Layer for Express 5 Compliance
// ─────────────────────────────────────────────────────────────────────────────
import xss from "xss";

// ─── XSS prevention (recursive deep sanitise) ────────────────────────────────

function deepSanitize(value) {
  if (typeof value === "string") return xss(value);
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        // Prototype pollution prevention
        .filter(([k]) => !["__proto__", "constructor", "prototype"].includes(k))
        .map(([k, v]) => [k, deepSanitize(v)])
    );
  }
  return value;
}

export const mongoSanitizeMiddleware = (req, _res, next) => {
  // Clean bypass: Mongoose native 'sanitizeFilter' is handling NoSQL security on db/index.js!
  next();
};

export const xssSanitizeMiddleware = (req, _res, next) => {
  // 1. Sanitize request body safely (Body is mutable plain object)
  if (req.body) req.body = deepSanitize(req.body);

  // 2. Sanitize query variables matching Express 5 Immutable Getters contract
  if (req.query) {
    const sanitizedQuery = deepSanitize(req.query);
    // Safely delete raw keys and populate fresh values inside the existing reference
    for (const key in req.query) {
      delete req.query[key];
    }
    Object.assign(req.query, sanitizedQuery);
  }

  // 3. Sanitize params matching Express 5 Immutable Getters contract
  if (req.params) {
    const sanitizedParams = deepSanitize(req.params);
    for (const key in req.params) {
      delete req.params[key];
    }
    Object.assign(req.params, sanitizedParams);
  }

  next();
};