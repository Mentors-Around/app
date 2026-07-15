// src/services/enrollment.service.js
import apiClient from './apiClient';

export const enrollmentService = {
  sendQuery: (data, idempotencyKey) =>
    apiClient.post('/enrollments/queries', data, { headers: { 'Idempotency-Key': idempotencyKey } }),
  acceptQuery: (queryId, data) => apiClient.patch(`/enrollments/queries/${queryId}/accept`, data),
  rejectQuery: (queryId, data) => apiClient.patch(`/enrollments/queries/${queryId}/reject`, data),

  enroll: (queryId, data, idempotencyKey) =>
    apiClient.post(`/enrollments/queries/${queryId}/enroll`, data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  verifyEnrollPayment: (queryId, data) =>
    apiClient.post(`/enrollments/queries/${queryId}/enroll/verify`, data),

  getMyQueries: (params) => apiClient.get('/enrollments/queries', { params }),
  getStudentDashboard: () => apiClient.get('/enrollments/me/dashboard'),
  getStudentEnrollments: (params) => apiClient.get('/enrollments', { params }),
  submitReview: (enrollmentId, data) => apiClient.post(`/enrollments/${enrollmentId}/review`, data),
};

export default enrollmentService;
