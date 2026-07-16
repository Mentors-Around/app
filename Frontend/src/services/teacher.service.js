// src/services/teacher.service.js
import apiClient from './apiClient';

export const teacherService = {
  submitProfile: (data) => apiClient.post('/teachers/onboarding/profile', data),
  uploadKYC: (formData) =>
    apiClient.post('/teachers/onboarding/kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min — Cloudinary uploads can be slow
    }),

  getDashboard: () => apiClient.get('/teachers/me/dashboard'),
  getEarnings: (params) => apiClient.get('/teachers/me/earnings', { params }),
  getMyClassrooms: (params) => apiClient.get('/teachers/me/classrooms', { params }),
  getMyQueries: (params) => apiClient.get('/teachers/me/queries', { params }),
  getMyDoubts: (params) => apiClient.get('/teachers/me/doubts', { params }),
  updateAvailability: (data) => apiClient.patch('/teachers/me/availability', data),

  getPublicProfile: (teacherId) => apiClient.get(`/teachers/${teacherId}/public`),

  getWallet: () => apiClient.get('/teachers/me/wallet'),
  initiateDeposit: (data, idempotencyKey) =>
    apiClient.post('/teachers/me/wallet/deposit', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  verifyDeposit: (data) => apiClient.post('/teachers/me/wallet/deposit/verify', data),

  getReviews: (params) => apiClient.get('/teachers/me/reviews', { params }),
  replyToReview: (reviewId, data) => apiClient.patch(`/teachers/me/reviews/${reviewId}/reply`, data),
};

export default teacherService;
