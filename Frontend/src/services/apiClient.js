// src/services/apiClient.js
// Single axios instance for all backend calls.
//
// Auth model: backend issues httpOnly accessToken/refreshToken cookies
// (see cookie.util.js) — the frontend never touches tokens directly.
// `withCredentials: true` sends/receives those cookies automatically.

import axios from 'axios';
import { env } from '@/config/env';
import { LOADING_START_EVENT, LOADING_END_EVENT } from '@/context/LoadingContext';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Global "processing" overlay ─────────────────────────────────────────────
// Every mutating request (POST/PUT/PATCH/DELETE) blocks the whole UI via
// GlobalLoadingOverlay so a user can't fire a second action (double payment,
// double form submit) while the first is still in flight. GET requests don't
// block by default since those are usually background reads.
//
// Opt out per-request with `{ skipGlobalLoader: true }` in the axios config
// (e.g. polling/background refreshes that shouldn't freeze the screen).
// Opt IN a GET request with `{ showGlobalLoader: true }` when it's actually
// a user-initiated blocking action (e.g. "load and open" flows).
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const shouldShowLoader = (config) => {
  if (config?.skipGlobalLoader) return false;
  if (config?.showGlobalLoader) return true;
  return MUTATING_METHODS.has((config?.method || 'get').toLowerCase());
};

apiClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = genCorrelationId();
  if (shouldShowLoader(config)) {
    config._loaderShown = true;
    window.dispatchEvent(new CustomEvent(LOADING_START_EVENT, { detail: { message: config.loaderMessage } }));
  }
  return config;
});

function genCorrelationId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clearLoaderFor(config) {
  if (config?._loaderShown) {
    window.dispatchEvent(new CustomEvent(LOADING_END_EVENT));
    config._loaderShown = false; // guard against double-clear on retry paths
  }
}

// ── 401 → single-flight refresh, then retry original request ──────────────────
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh', null, { skipGlobalLoader: true })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const PUBLIC_AUTH_PATHS = [
  '/auth/login/password',
  '/auth/signup',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/google/complete',
  '/users/me',   // initial hydration — a 401 here means "not logged in", not "session expired"
];

apiClient.interceptors.response.use(
  (response) => {
    clearLoaderFor(response.config);
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = PUBLIC_AUTH_PATHS.some((p) => original?.url?.startsWith(p));

    // IMPORTANT: an incorrect-password / wrong-OTP 401 from a business
    // endpoint (e.g. wallet payment) is NOT an expired session — only treat
    // 401s as "session expired" when the error carries no specific
    // errorCode we already understand, or when it's a generic auth failure.
    // This also fixes double round-trips that made wallet-payment retries
    // and other password-checked actions feel slow.
    const KNOWN_NON_SESSION_401_CODES = new Set([
      'INVALID_PASSWORD',
      'INVALID_TRANSACTION_PASSWORD',
      'NO_PASSWORD_SET',
      'OTP_INVALID',
      'OTP_LOCKED',
      'OTP_NOT_FOUND',
      'SESSION_TOKEN_INVALID',
    ]);
    const errorCode = error.response?.data?.errorCode;
    const isBusiness401 = KNOWN_NON_SESSION_401_CODES.has(errorCode);

    if (status === 401 && !original?._retry && !isAuthEndpoint && !isBusiness401) {
      original._retry = true;
      try {
        await refreshAccessToken();
        return apiClient(original);
      } catch (refreshError) {
        // Refresh failed → force logout by broadcasting a session-expired event.
        // AuthContext listens for this and clears user state / redirects to /login.
        clearLoaderFor(original);
        window.dispatchEvent(new CustomEvent('trueed:session-expired'));
        return Promise.reject(refreshError);
      }
    }

    clearLoaderFor(original);
    return Promise.reject(normalizeError(error));
  },
);

// Normalizes axios errors into the backend's ApiError shape:
// { statusCode, message, errors, errorCode, success:false }
function normalizeError(error) {
  if (error.response?.data) {
    return {
      ...error.response.data,
      statusCode: error.response.data.statusCode ?? error.response.status,
      isNetworkError: false,
    };
  }
  return {
    statusCode: 0,
    message: error.message === 'Network Error'
      ? 'Unable to reach the server. Check your connection.'
      : error.message || 'Something went wrong',
    errors: [],
    errorCode: 'NETWORK_ERROR',
    success: false,
    isNetworkError: true,
  };
}

export default apiClient;