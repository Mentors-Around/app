// src/config/env.js
// Central place to read Vite env vars. import.meta.env.* is inlined at build
// time, so never reference it dynamically elsewhere — always go through here.

const read = (key, fallback) => {
  const value = import.meta.env[key] ?? fallback;
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing env var: ${key}`);
  }
  return value;
};

export const env = Object.freeze({
  API_BASE_URL: read('VITE_API_BASE_URL', '/api/v1'),
  APP_NAME: read('VITE_APP_NAME', 'TrueEd'),
  NODE_ENV: import.meta.env.MODE,
  IS_PROD: import.meta.env.PROD,
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN ?? '',
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID ?? '',
});

export default env;
