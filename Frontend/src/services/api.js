// Frontend/src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trueed.onrender.com/api/v1';

/**
 * Generate a unique Idempotency-Key for sensitive POST/PATCH operations
 */
export const generateIdempotencyKey = () => {
  return 'idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Helper to make HTTP requests with authentication headers and proper error handling
 */
// Loading overlay callback bridge
// App.jsx calls `registerLoadingCallbacks` once after mounting LoadingProvider
let _onLoadingStart = null;
let _onLoadingStop  = null;

export function registerLoadingCallbacks(onStart, onStop) {
  _onLoadingStart = onStart;
  _onLoadingStop  = onStop;
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('trueed_token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle json content type automatically unless body is FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
    if (typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  const config = {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  };

  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  if (options.query && typeof options.query === 'object') {
    const params = new URLSearchParams();
    Object.entries(options.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, v);
      }
    });
    const queryString = params.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  try {
    // Signal loading start
    if (_onLoadingStart && !options._silent) _onLoadingStart();
    const response = await fetch(url, config);
    let resData = null;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      resData = await response.json();
    } else {
      const text = await response.text();
      resData = { message: text };
    }

    if (!response.ok) {
      const errorMessage = resData?.message || resData?.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = resData;
      if (response.status === 401) {
        const isPasswordEndpoint = 
          endpoint.includes('/auth/refresh') ||
          endpoint.includes('/checkout') ||
          endpoint.includes('/withdraw') ||
          endpoint.includes('/enroll') ||
          endpoint.includes('/deposit') ||
          resData?.code === 'INVALID_PASSWORD' ||
          resData?.code === 'INVALID_TRANSACTION_PASSWORD';

        if (isPasswordEndpoint) {
          if (_onLoadingStop && !options._silent) _onLoadingStop();
          throw error;
        }

        if (!window.location.pathname.includes('/login')) {
          if (!isRefreshing) {
            isRefreshing = true;
            api.auth.refresh()
              .then((res) => {
                isRefreshing = false;
                const newToken = res.accessToken || res.token;
                if (newToken) {
                  localStorage.setItem('trueed_token', newToken);
                  onRefreshed(newToken);
                } else {
                  throw new Error('Refresh failed');
                }
              })
              .catch((err) => {
                isRefreshing = false;
                localStorage.removeItem('trueed_token');
                localStorage.removeItem('trueed_profile');
                localStorage.removeItem('trueed_role');
                window.location.href = '/login';
              });
          }

          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              const retryHeaders = { ...options.headers, 'Authorization': `Bearer ${newToken}` };
              if (options.body && !(options.body instanceof FormData) && !retryHeaders['Content-Type']) {
                retryHeaders['Content-Type'] = 'application/json';
              }
              const retryConfig = { ...options, headers: retryHeaders, credentials: options.credentials || 'include' };
              resolve(request(endpoint, retryConfig));
            });
          });
        }
      }
      if (_onLoadingStop && !options._silent) _onLoadingStop();
      throw error;
    }

    if (_onLoadingStop && !options._silent) _onLoadingStop();

    if (resData && typeof resData === 'object' && 'data' in resData && 'success' in resData) {
      const data = resData.data !== undefined ? resData.data : resData;
      
      // Developer alert for OTPs intercepted from the API
      if (data && typeof data === 'object') {
        if (data.emailOtp && data.phoneOtp) {
          alert(`Email OTP: ${data.emailOtp}\nPhone OTP: ${data.phoneOtp}`);
        } else if (data.emailOtp) {
          alert(`Email OTP: ${data.emailOtp}`);
        } else if (data.phoneOtp) {
          alert(`Phone OTP: ${data.phoneOtp}`);
        } else if (data.otp) {
          alert(`OTP: ${data.otp}`);
        }
      }
      
      return data;
    }

    return resData;
  } catch (err) {
    if (_onLoadingStop && !options._silent) _onLoadingStop();
    if (!err.status) {
      console.error(`Network or API Error at ${endpoint}:`, err);
    }
    throw err;
  }
}

export const api = {
  // ── AUTH ──────────────────────────────────────────────────────────────────
  auth: {
    login: (email, password, rememberMe = false) =>
      request('/auth/login/password', { method: 'POST', body: { email, password, rememberMe } }),
    
    signupSendOtp: (email, phone, role) =>
      request('/auth/signup/send-otp', { method: 'POST', body: { email, phone, role } }),
    
    signupVerifyOtp: (email, phone, emailOtp, phoneOtp) =>
      request('/auth/signup/verify-otp', { method: 'POST', body: { email, phone, emailOtp, phoneOtp } }),
    
    signupComplete: (data) =>
      request('/auth/signup/complete', { method: 'POST', body: data }),
    
    forgotPasswordSendOtp: (channel, email, phone) =>
      request('/auth/forgot-password/send-otp', { method: 'POST', body: { channel, email, phone } }),
    
    forgotPasswordVerifyOtp: (channel, email, phone, otp) =>
      request('/auth/forgot-password/verify-otp', { method: 'POST', body: { channel, email, phone, otp } }),
    
    resetPassword: (sessionToken, newPassword) =>
      request('/auth/forgot-password/reset', { method: 'POST', body: { sessionToken, newPassword } }),
    
    refresh: () =>
      request('/auth/refresh', { method: 'POST' }),

    logout: () =>
      request('/auth/logout', { method: 'POST' }),
  },

  // ── USER ──────────────────────────────────────────────────────────────────
  user: {
    getMe: () => request('/users/me'),
    
    updateMe: (data) => request('/users/me', { method: 'PATCH', body: data }),
    
    updateUsername: (username) => request('/users/me/username', { method: 'PATCH', body: { username } }),
    
    getDashboardStats: () => request('/users/me/dashboard'),
    
    getSessions: () => request('/users/me/sessions'),
    
    uploadAvatar: (formData) =>
      request('/users/me/avatar', { method: 'POST', body: formData }),
    
    changePassword: (oldPassword, newPassword) =>
      request('/users/me/change-password', { method: 'POST', body: { oldPassword, newPassword } }),
    
    getSavedClassrooms: () => request('/users/me/saved-classrooms'),
    saveClassroom: (id) => request(`/users/me/saved-classrooms/${id}`, { method: 'POST' }),
    unsaveClassroom: (id) => request(`/users/me/saved-classrooms/${id}`, { method: 'DELETE' }),
    
    getSavedTeachers: () => request('/users/me/saved-teachers'),
    saveTeacher: (id) => request(`/users/me/saved-teachers/${id}`, { method: 'POST' }),
    unsaveTeacher: (id) => request(`/users/me/saved-teachers/${id}`, { method: 'DELETE' }),
    
    getPayments: () => request('/users/me/payments'),
    
    deleteMe: () => request('/users/me', { method: 'DELETE' }),

    getProfile: (id) => request(`/users/${id}/profile`),
  },

  // ── CLASSROOM ──────────────────────────────────────────────────────────────
  classroom: {
    discover: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/classrooms/discover${q ? `?${q}` : ''}`);
    },
    
    search: (query) => request(`/classrooms/search?q=${encodeURIComponent(query)}`),
    
    getDetail: (id) => request(`/classrooms/${id}`),
    
    create: (data) => request('/classrooms', { method: 'POST', headers: { 'Idempotency-Key': generateIdempotencyKey() }, body: data }),
    
    update: (id, data) => request(`/classrooms/${id}`, { method: 'PATCH', body: data }),
    
    getEnrolledStudents: (id) => request(`/classrooms/${id}/students`),
    
    // Announcements
    getAnnouncements: (id) => request(`/classrooms/${id}/announcements`),
    createAnnouncement: (id, data) => request(`/classrooms/${id}/announcements`, { method: 'POST', body: data }),
    deleteAnnouncement: (id, annId) => request(`/classrooms/${id}/announcements/${annId}`, { method: 'DELETE' }),
    
    // Materials
    getMaterials: (id) => request(`/classrooms/${id}/materials`),
    uploadMaterial: (id, formData) => request(`/classrooms/${id}/materials`, { method: 'POST', body: formData }),
    deleteMaterial: (id, matId) => request(`/classrooms/${id}/materials/${matId}`, { method: 'DELETE' }),
    
    // Assignments
    getAssignments: (id) => request(`/classrooms/${id}/assignments`),
    createAssignment: (id, data) => request(`/classrooms/${id}/assignments`, { method: 'POST', body: data }),
    submitAssignment: (id, assignId, formData) => request(`/classrooms/${id}/assignments/${assignId}/submit`, { method: 'POST', body: formData }),
    gradeAssignment: (id, assignId, data) => request(`/classrooms/${id}/assignments/${assignId}/grade`, { method: 'PATCH', body: data }),
    
    // Doubts
    getDoubts: (id) => request(`/classrooms/${id}/doubts`),
    createDoubt: (id, data) => request(`/classrooms/${id}/doubts`, { method: 'POST', body: data }),
    answerDoubt: (id, doubtId, text) => request(`/classrooms/${id}/doubts/${doubtId}/answer`, { method: 'PATCH', body: { answer: text } }),
    upvoteDoubt: (id, doubtId) => request(`/classrooms/${id}/doubts/${doubtId}/upvote`, { method: 'POST' }),

    // Join live class (marks attendance, returns meeting link)
    joinClass: (classroomId) => request(`/classrooms/${classroomId}/join`, { method: 'POST' }),
  },

  // ── ENROLLMENTS & QUERIES ──────────────────────────────────────────────────
  enrollment: {
    sendQuery: (data) =>
      request('/enrollments/queries', {
        method: 'POST',
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: data,
      }),
    
    acceptQuery: (id, teacherMessage = '') =>
      request(`/enrollments/queries/${id}/accept`, { method: 'PATCH', body: { teacherMessage } }),
    
    rejectQuery: (id, reason = '') =>
      request(`/enrollments/queries/${id}/reject`, { method: 'PATCH', body: { reason } }),
    
    enrollInClassroom: (queryId, paymentMethod = 'wallet', password = '') =>
      request(`/enrollments/queries/${queryId}/enroll`, {
        method: 'POST',
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: {
          paymentMethod,
          useWalletCash: true,
          password,
        },
      }),
    
    getMyQueries: (tab) => request(`/enrollments/queries${tab ? `?tab=${tab}` : ''}`),
    
    getStudentDashboard: () => request('/enrollments/me/dashboard'),
    
    getStudentEnrollments: (tab) => request(`/enrollments${tab ? `?tab=${tab}` : ''}`),
    
    withdrawQuery: (queryId) =>
      request(`/enrollments/queries/${queryId}`, { method: 'DELETE' }),
    
    submitReview: (enrollmentId, rating, comment) =>
      request(`/enrollments/${enrollmentId}/review`, { method: 'POST', body: { rating, comment } }),

    sendQueryMessage: (queryId, text) =>
      request(`/enrollments/queries/${queryId}/messages`, { method: 'POST', body: { text } }),

    archiveQuery: (queryId, archive = true) =>
      request(`/enrollments/queries/${queryId}/archive`, { method: 'PATCH', body: { archive } }),
  },

  // ── TEACHER ────────────────────────────────────────────────────────────────
  teacher: {
    search: (query) => request(`/teachers?q=${encodeURIComponent(query)}`),
    getDashboard: () => request('/teachers/me/dashboard'),
    getEarnings: () => request('/teachers/me/earnings'),
    getMyClassrooms: (params = {}) => request('/teachers/me/classrooms', { query: { limit: 100, ...params } }),
    getMyStudents: () => request('/teachers/me/students'),
    getMyQueries: (params = {}) => request('/teachers/me/queries', { query: { limit: 200, ...params } }),
    getMyDoubts: () => request('/teachers/me/doubts'),
    getMyReviews: () => request('/teachers/me/reviews'),
    updateAvailability: (availability) => request('/teachers/me/availability', { method: 'PATCH', body: { availability } }),
    getPublicProfile: (id) => request(`/teachers/${id}/public`),
    getWallet: () => request('/teachers/me/wallet'),
    submitKYC: (formData) => request('/teachers/onboarding/kyc', { method: 'POST', body: formData }),
    submitProfile: (data) => request('/teachers/onboarding/profile', { method: 'POST', body: data }),
    depositWallet: (amountPaise, password) => request('/teachers/me/wallet/deposit', { method: 'POST', body: { amountPaise, password } }),
  },

  // ── WALLET & PAYOUTS ───────────────────────────────────────────────────────
  wallet: {
    getStudentWallet: () => request('/wallet'),
    getTokenTransactions: () => request('/wallet/transactions'),
    

    // In mock mode, password is used to verify and tokens are credited directly
    buyTokens: (price, password) =>
      request('/wallet/tokens/checkout', {
        method: 'POST',
        body: { price, password },
      }),
    
    verifyTokenPurchase: (data) =>
      request('/wallet/tokens/verify', { method: 'POST', body: data }),
    
    // In mock mode, password is used to verify and cash is credited directly
    depositCheckout: (amountPaise, password) =>
      request('/wallet/deposit/checkout', {
        method: 'POST',
        body: { amountPaise, password },
      }),
    
    verifyDeposit: (data) =>
      request('/wallet/deposit/verify', { method: 'POST', body: data }),
    
    // In mock mode, password is used to verify and cash is debited directly
    withdrawStudent: (amountPaise, password) =>
      request('/wallet/withdraw', { method: 'POST', body: { amountPaise, password } }),
  },

  payout: {
    getTeacherPayouts: () => request('/payouts'),
    requestTeacherWithdrawal: (amount, bankAccount) =>
      request('/payouts/withdraw', { method: 'POST', body: { amountPaise: amount * 100, bankAccount } }),
  },

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  admin: {
    getStats: () => request('/admin/stats'),
    getAllTeachers: (query) => request('/admin/teachers', { query }),
    getPendingTeachers: () => request('/admin/teachers/pending'),
    approveTeacher: (id) => request(`/admin/teachers/${id}/approve`, { method: 'PATCH' }),
    rejectTeacher: (id, reason) => request(`/admin/teachers/${id}/reject`, { method: 'PATCH', body: { reason: reason || 'Rejected by admin' } }),
    suspendTeacher: (id, reason) => request(`/admin/teachers/${id}/suspend`, { method: 'PATCH', body: { reason: reason || 'Suspended by admin' } }),
    
    getPendingDocuments: () => request('/admin/documents/pending'),
    approveDocument: (id) => request(`/admin/documents/${id}/approve`, { method: 'PATCH' }),
    rejectDocument: (id, reason) => request(`/admin/documents/${id}/reject`, { method: 'PATCH', body: { reason: reason || 'Rejected by admin' } }),
    
    getAllClassrooms: (query) => request('/admin/classrooms', { query }),
    cancelClassroom: (id, reason) => request(`/admin/classrooms/${id}/cancel`, { method: 'PATCH', body: { reason: reason || 'Cancelled by admin' } }),
    
    getAllUsers: (query) => request('/admin/users', { query }),
    banUser: (id, reason) => request(`/admin/users/${id}/ban`, { method: 'PATCH', body: { reason } }),
    unbanUser: (id) => request(`/admin/users/${id}/unban`, { method: 'PATCH' }),
    
    getAllReviews: (query) => request('/admin/reviews', { query }),
    getReports: () => request('/admin/reports'),
    resolveReport: (id) => request(`/admin/reports/${id}/resolve`, { method: 'PATCH' }),
    dismissReport: (id) => request(`/admin/reports/${id}/dismiss`, { method: 'PATCH' }),
    
    getSettings: () => request('/admin/settings'),
    updateSettings: (data) => request('/admin/settings', { method: 'PATCH', body: data }),
  },

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  notification: {
    getAll: () => request('/notifications'),
    getUnreadCount: () => request('/notifications/unread-count'),
    markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllAsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
    clearAll: () => request('/notifications', { method: 'DELETE' }),
    delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  },
  // ── REPORTS ────────────────────────────────────────────────────────────────
  report: {
    fileReport: (data) => request('/reports', { method: 'POST', body: data }),
  },
};

export default api;
