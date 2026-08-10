import env from "./env.config.js";
import ApiError from "../utils/ApiError.js";

const allowedOriginsSet = new Set(
  env.ALLOWED_ORIGINS.map((url) => url.trim().replace(/\/+$/, ""))
);

const corsOptions = {
  // For demo: reflect any origin back — safe since no sensitive server-side secrets are exposed via CORS
  origin: true,

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