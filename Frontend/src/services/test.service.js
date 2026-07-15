// src/services/test.service.js
import apiClient from './apiClient';

export const testService = {
  publishTest: (testId) => apiClient.patch(`/tests/${testId}/publish`),
  getStudentTests: (params) => apiClient.get('/tests/me', { params }),
  startAttempt: (testId) => apiClient.post(`/tests/${testId}/start`),
  submitAttempt: (testId, data) => apiClient.post(`/tests/${testId}/submit`, data),
  getResults: (testId) => apiClient.get(`/tests/${testId}/results`),
};

export default testService;
