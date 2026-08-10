import env from "./env.config.js";
import ApiError from "../utils/ApiError.js";

const allowedOriginsSet = new Set(
  env.ALLOWED_ORIGINS.map((url) => url.trim().replace(/\/+$/, ""))
);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (e.g. server-to-server, health checks, Postman)
    if (!origin) {
      return callback(null, true);
    }
    const cleanOrigin = origin.trim().replace(/\/+$/, "");

    if (
      allowedOriginsSet.has("*") ||
      allowedOriginsSet.has(cleanOrigin) ||
      /\.vercel\.app$/.test(cleanOrigin)
    ) {
      return callback(null, true);
    }

    callback(null, false);
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Correlation-ID",
    "X-Requested-With",
    "Idempotency-Key",
  ],

  exposedHeaders: [
    "X-Correlation-ID",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],

  credentials: true,
  maxAge: 600,
  optionsSuccessStatus: 204,
};

export default corsOptions;