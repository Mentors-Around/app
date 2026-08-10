import dotenv from "dotenv";
import { cleanEnv, str, num, bool, makeValidator } from "envalid";

dotenv.config();

const commaSeparatedList = makeValidator((x) => {
  if (typeof x !== "string" || x.trim() === "")
    throw new Error("Expected a non-empty comma-separated string");
  return x
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
});

const env = cleanEnv(process.env, {
  // ── Server ──────────────────────────────────────────────────────────────────
  NODE_ENV:     str({ choices: ["development", "test", "production"] }),
  PORT:         num({ default: 8000 }),
  FRONTEND_URL: str({ default: "http://localhost:5173" }),

  // ── MongoDB ─────────────────────────────────────────────────────────────────
  MONGODB_URI: str(),
  DB_NAME:     str({ default: "trueed" }),

  // ── JWT ─────────────────────────────────────────────────────────────────────
  ACCESS_TOKEN_SECRET:   str(),
  ACCESS_TOKEN_EXPIRY:   str({ default: "15m" }),
  REFRESH_TOKEN_SECRET:  str(),
  REFRESH_TOKEN_EXPIRY:  str({ default: "7d" }),

  // ── Google OAuth ────────────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID:     str({ default: "" }),
  GOOGLE_CLIENT_SECRET: str({ default: "" }),
  GOOGLE_CALLBACK_URL:  str({ default: "" }),

  // ── CORS ────────────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS: commaSeparatedList(),

  // ── Cloudinary ──────────────────────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: str({ default: "" }),
  CLOUDINARY_API_KEY:    str({ default: "" }),
  CLOUDINARY_API_SECRET: str({ default: "" }),
  CLOUDINARY_FOLDER:     str({ default: "trueed" }),

  // ── Razorpay ────────────────────────────────────────────────────────────────
  RAZORPAY_KEY_ID:        str({ default: "" }),
  RAZORPAY_KEY_SECRET:    str({ default: "" }),
  RAZORPAY_WEBHOOK_SECRET: str({ default: "" }),

  // ── Cookie ──────────────────────────────────────────────────────────────────
  COOKIE_DOMAIN:                str({ default: "" }),
  REFRESH_TOKEN_COOKIE_DOMAIN:  str({ default: "" }),

  // ── Logging ─────────────────────────────────────────────────────────────────
  LOG_LEVEL: str({
    choices: ["error", "warn", "info", "http", "debug"],
    default: "info",
  }),

  // ── Rate limiting ───────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS:   num({ default: 15 * 60 * 1000 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),
  LOGIN_RATE_LIMIT_MAX:   num({ default: 10 }),

  // ── Uploads ─────────────────────────────────────────────────────────────────
  MAX_FILE_SIZE_MB:        num({ default: 10 }),
  MAX_CONCURRENT_UPLOADS:  num({ default: 50 }),

  // ── Email (Resend) ──────────────────────────────────────────────────────────
  EMAIL_PROVIDER: str({ choices: ['resend', 'mock'], default: 'mock' }),
  EMAIL_FROM:     str({ default: 'TrueEd <onboarding@resend.dev>' }),
  RESEND_API_KEY: str({ default: '' }),

  // ── Cron / Jobs ─────────────────────────────────────────────────────────────
  QUERY_AUTO_EXPIRE_DAYS:    num({ default: 5 }),
  QUERY_LAPSE_AFTER_ACCEPT_DAYS: num({ default: 5 }),
  TEACHER_DEPOSIT_REFUND_DAYS:   num({ default: 5 }),
});

export default env;