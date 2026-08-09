import dotenv from "dotenv";
import { cleanEnv, str, num, bool, makeValidator } from "envalid";

dotenv.config();

const commaSeparatedList = makeValidator((x) => {
  if (typeof x !== "string" || x.trim() === "")
    throw new Error("Expected a non-empty comma-separated string");
  return x
    .split(",")
    .map((s) => s.trim())
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

  // ── OTP ─────────────────────────────────────────────────────────────────────
  OTP_SECRET:          str(),
  OTP_EXPIRY_MINUTES:  num({ default: 10 }),
  OTP_MAX_ATTEMPTS:    num({ default: 5 }),

  // ── Google OAuth ────────────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID:     str({ default: "" }),
  GOOGLE_CLIENT_SECRET: str({ default: "" }),
  GOOGLE_CALLBACK_URL:  str({ default: "" }),

  // ── CORS ────────────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS: commaSeparatedList(),

  // ── Cloudinary ──────────────────────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY:    str(),
  CLOUDINARY_API_SECRET: str(),
  CLOUDINARY_FOLDER:     str({ default: "trueed" }),

  // ── Razorpay ────────────────────────────────────────────────────────────────
  RAZORPAY_KEY_ID:        str({ default: "" }),
  RAZORPAY_KEY_SECRET:    str({ default: "" }),
  RAZORPAY_WEBHOOK_SECRET: str({ default: "" }),

  // ── Redis ───────────────────────────────────────────────────────────────────
  REDIS_URL: str({ default: "" }),

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
  LOGIN_RATE_LIMIT_MAX:   num({ default: 10 }),  // stricter for auth routes
  OTP_RATE_LIMIT_MAX:     num({ default: 5 }),

  // ── Uploads ─────────────────────────────────────────────────────────────────
  MAX_FILE_SIZE_MB:        num({ default: 10 }),
  MAX_CONCURRENT_UPLOADS:  num({ default: 50 }),

  // ── SMS ─────────────────────────────────────────────────────────────────────
  SMS_PROVIDER:      str({ choices: ["msg91", "fast2sms", "twilio", "mock"], default: "mock" }),
  MSG91_API_KEY:     str({ default: "" }),
  MSG91_TEMPLATE_ID: str({ default: "" }),
  FAST2SMS_API_KEY:  str({ default: "" }),
  TWILIO_ACCOUNT_SID:   str({ default: "" }),
  TWILIO_AUTH_TOKEN:    str({ default: "" }),
  TWILIO_PHONE_NUMBER:  str({ default: "" }),

  // ── Email (Resend) ──────────────────────────────────────────────────────────
  EMAIL_PROVIDER: str({ choices: ['resend', 'mock'], default: 'resend' }),
  EMAIL_FROM:     str({ default: 'TrueEd <onboarding@resend.dev>' }),
  RESEND_API_KEY: str({ default: '' }),

  // ── WhatsApp (Meta Cloud API) ────────────────────────────────────────────────
  WHATSAPP_OTP_ENABLED:      str({ default: 'false' }),
  WHATSAPP_TOKEN:            str({ default: '' }),          // System User token from Meta
  WHATSAPP_PHONE_NUMBER_ID:  str({ default: '' }),          // From Meta App dashboard
  WHATSAPP_OTP_TEMPLATE:     str({ default: 'trueed_otp' }),
  WHATSAPP_TEMPLATE_LANG:    str({ default: 'en' }),
  WHATSAPP_VERIFY_TOKEN:     str({ default: '' }),          // Your own random string for webhook verify

  // ── Firebase (Push notifications) ───────────────────────────────────────────
  FIREBASE_PROJECT_ID:    str({ default: "" }),
  FIREBASE_CLIENT_EMAIL:  str({ default: "" }),
  FIREBASE_PRIVATE_KEY:   str({ default: "" }),

  // ── Admin ───────────────────────────────────────────────────────────────────
  // ADMIN_IDS is kept for backwards-compatibility but is no longer used
  // for authorization (admin access is controlled solely by role in DB).
  ADMIN_IDS: str({ default: '' }),

  // ── Cron / Jobs ─────────────────────────────────────────────────────────────
  QUERY_AUTO_EXPIRE_DAYS:    num({ default: 5 }),   // days before pending query auto-expires
  QUERY_LAPSE_AFTER_ACCEPT_DAYS: num({ default: 5 }), // days student has to enroll after acceptance
  TEACHER_DEPOSIT_REFUND_DAYS:   num({ default: 5 }), // days teacher has to get 4% back if student doesn't enroll
});

export default env;