import env from "./env.config.js";
import ApiError from "../utils/ApiError.js";

const allowedOriginsSet = new Set(env.ALLOWED_ORIGINS);

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server (no origin) only in non-production
    if (!origin) {
      if (env.NODE_ENV !== "production") return callback(null, true);
      return callback(new ApiError(403, "Origin header required in production"));
    }
    if (allowedOriginsSet.has(origin)) {
      callback(null, true);
    } else {
      callback(new ApiError(403, `CORS: origin '${origin}' not allowed`));
    }
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