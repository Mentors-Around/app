// src/middlewares/sanitize.middleware.js
import xss from "xss";

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
function deepCleanXSS(value) {
  if (typeof value === "string") return xss(value);
  if (Array.isArray(value)) return value.map(deepCleanXSS);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !["__proto__", "constructor", "prototype"].includes(k))
        .map(([k, v]) => [k, deepCleanXSS(v)])
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