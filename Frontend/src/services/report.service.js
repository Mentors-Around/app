// src/services/report.service.js
import apiClient from './apiClient';

export const reportService = {
  fileReport: (data) => apiClient.post('/reports', data),
  getMyReports: (params) => apiClient.get('/reports/my', { params }),
};

export default reportService;
