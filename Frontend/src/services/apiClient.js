// src/services/apiClient.js
// Single axios instance for all backend calls.
//
// Auth model: backend issues httpOnly accessToken/refreshToken cookies
// (see cookie.util.js) — the frontend never touches tokens directly.
// `withCredentials: true` sends/receives those cookies automatically.

import axios from 'axios';
import { env } from '@/config/env';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Correlation ID (backend reads X-Correlation-ID, see correlationId.middleware.js) ──
const genCorrelationId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const isMutatingRequest = (config) => {
  if (!config?.method) return false;
  const method = config.method.toUpperCase();
  const url = config.url || '';
  if (url.includes('/auth/refresh') || url.includes('/users/me')) return false;
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
};

apiClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = genCorrelationId();
  if (isMutatingRequest(config)) {
    window.dispatchEvent(new CustomEvent('trueed:api-start'));
  }
  return config;
});

// ── 401 → single-flight refresh, then retry original request ──────────────────
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh')
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
    if (isMutatingRequest(response.config)) {
      window.dispatchEvent(new CustomEvent('trueed:api-end'));
    }
    return response;
  },
  async (error) => {
    if (isMutatingRequest(error.config)) {
      window.dispatchEvent(new CustomEvent('trueed:api-end'));
    }
    const original = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = PUBLIC_AUTH_PATHS.some((p) => original?.url?.startsWith(p));

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        await refreshAccessToken();
        return apiClient(original);
      } catch (refreshError) {
        // Refresh failed → force logout by broadcasting a session-expired event.
        // AuthContext listens for this and clears user state / redirects to /login.
        window.dispatchEvent(new CustomEvent('trueed:session-expired'));
        return Promise.reject(refreshError);
      }
    }

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