// Frontend/src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Generate a unique Idempotency-Key for sensitive POST/PATCH operations
 */
export const generateIdempotencyKey = () => {
  return 'idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Helper to make HTTP requests with authentication headers and proper error handling
 */
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
        // Auto-clear auth state on 401 unauthenticated if not already on login page
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('trueed_token');
          localStorage.removeItem('trueed_profile');
          localStorage.removeItem('trueed_role');
        }
      }
      throw error;
    }

    // Return inner data payload if wrapped in standard ApiResponse envelope { success, statusCode, data, message }
    if (resData && typeof resData === 'object' && 'data' in resData && 'success' in resData) {
      return resData.data !== undefined ? resData.data : resData;
    }

    return resData;
  } catch (err) {
    if (!err.status) {
      console.error(`Network or API Error at ${endpoint}:`, err);
    }
    throw err;
  }
}

export const api = {
  // ── AUTH ──────────────────────────────────────────────────────────────────
  auth: {
    login: (email, password) =>
      request('/auth/login/password', { method: 'POST', body: { email, password } }),
    
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
    
    logout: () =>
      request('/auth/logout', { method: 'POST' }),
  },

  // ── USER ──────────────────────────────────────────────────────────────────
  user: {
    getMe: () => request('/users/me'),
    
    updateMe: (data) => request('/users/me', { method: 'PATCH', body: data }),
    
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
  },

  // ── CLASSROOM ──────────────────────────────────────────────────────────────
  classroom: {
    discover: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/classrooms/discover${q ? `?${q}` : ''}`);
    },
    
    search: (query) => request(`/classrooms/search?q=${encodeURIComponent(query)}`),
    
    getDetail: (id) => request(`/classrooms/${id}`),
    
    create: (data) => request('/classrooms', { method: 'POST', body: data }),
    
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
    
    enrollInClassroom: (queryId, paymentMethod = 'wallet') =>
      request(`/enrollments/queries/${queryId}/enroll`, {
        method: 'POST',
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: { paymentMethod },
      }),
    
    getMyQueries: (tab) => request(`/enrollments/queries${tab ? `?tab=${tab}` : ''}`),
    
    getStudentDashboard: () => request('/enrollments/me/dashboard'),
    
    getStudentEnrollments: () => request('/enrollments'),
    
    submitReview: (enrollmentId, rating, comment) =>
      request(`/enrollments/${enrollmentId}/review`, { method: 'POST', body: { rating, comment } }),
  },

  // ── TEACHER ────────────────────────────────────────────────────────────────
  teacher: {
    getDashboard: () => request('/teachers/me/dashboard'),
    getEarnings: () => request('/teachers/me/earnings'),
    getMyClassrooms: () => request('/teachers/me/classrooms'),
    getMyQueries: () => request('/teachers/me/queries'),
    getMyDoubts: () => request('/teachers/me/doubts'),
    getMyReviews: () => request('/teachers/me/reviews'),
    updateAvailability: (availability) => request('/teachers/me/availability', { method: 'PATCH', body: { availability } }),
    getPublicProfile: (id) => request(`/teachers/${id}/public`),
    getWallet: () => request('/teachers/me/wallet'),
    submitKYC: (formData) => request('/teachers/onboarding/kyc', { method: 'POST', body: formData }),
    submitProfile: (data) => request('/teachers/onboarding/profile', { method: 'POST', body: data }),
  },

  // ── WALLET & PAYOUTS ───────────────────────────────────────────────────────
  wallet: {
    getStudentWallet: () => request('/wallet'),
    getTokenTransactions: () => request('/wallet/transactions'),
    
    buyTokens: (packageId) =>
      request('/wallet/tokens/checkout', {
        method: 'POST',
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: { packageId },
      }),
    
    verifyTokenPurchase: (data) =>
      request('/wallet/tokens/verify', { method: 'POST', body: data }),
    
    depositCheckout: (amount) =>
      request('/wallet/deposit/checkout', {
        method: 'POST',
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: { amount },
      }),
    
    verifyDeposit: (data) =>
      request('/wallet/deposit/verify', { method: 'POST', body: data }),
    
    withdrawStudent: (amount, bankAccount) =>
      request('/wallet/withdraw', { method: 'POST', body: { amount, bankAccount } }),
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
  },
};

export default api;
