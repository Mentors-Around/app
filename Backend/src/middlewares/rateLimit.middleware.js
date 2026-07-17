import rateLimit from "express-rate-limit";
import env from "../config/env.config.js";
import ApiError from "../utils/ApiError.js";
import { RATE_LIMITS } from "../constants/app.constants.js";

// ─── Shared options ───────────────────────────────────────────────────────────
const sharedOptions = {
  standardHeaders: true,    // Return RateLimit-* headers (RFC 6585)
  legacyHeaders: false,     // Disable X-RateLimit-* legacy headers
  skipFailedRequests: false,
  validate: false, 
  skip: (req) => env.NODE_ENV === "development",
  handler(req, res, next, options) {
    next(
      new ApiError(
        429,
        `Too many requests. Try again after ${Math.ceil(options.windowMs / 60000)} minutes.`,
        [],
        "RATE_LIMIT_EXCEEDED"
      )
    );
  },
};

// ─── Rate limit tiers ─────────────────────────────────────────────────────────

/**
 * Global API limiter — applied to all /api/* routes.
 * Sabse simple, isme keyGenerator likhne ki zaroorat hi nahi hai, 
 * library khud back-end par sahi IP pick karegi bina warning ke.
 */
export const globalLimiter = rateLimit({
  ...sharedOptions,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  skip: (req) => env.NODE_ENV === "development" || req.path === "/health",
});

/**
 * Auth limiter — OTP send and verify endpoints.
 * Key by IP + phone to prevent one IP hammering many phone numbers.
 */
export const authLimiter = rateLimit({
  ...sharedOptions,
  windowMs: RATE_LIMITS.AUTH_WINDOW_MS,
  max: RATE_LIMITS.AUTH_MAX,
  skip: (req) => {
    if (env.NODE_ENV === "development") return true;
    const exemptPaths = ["/refresh", "/logout", "/google", "/google/callback"];
    return exemptPaths.some(path => req.path.endsWith(path));
  },
  keyGenerator: (req) => {
    const identifier = req.body?.phone || req.body?.email || req.body?.username || "unknown";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `${ip}:${identifier}`;
  },
});

/**
 * Upload limiter — document / avatar upload endpoints.
 */
export const uploadLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip || "unknown";
  },
});

/**
 * Payment limiter — payment initiation endpoint.
 */
export const paymentLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip || "unknown";
  },
});



/** 
 * Search Limiter — gates unauthenticated bot hammering 
 * windowMs: 1 minute, max: 30 requests as per app.constants.js
 */
export const searchLimiter = rateLimit({
  ...sharedOptions,
  windowMs: RATE_LIMITS.SEARCH_WINDOW_MS,
  max:      RATE_LIMITS.SEARCH_MAX,
  keyGenerator: (req) => req.ip || "unknown",
});