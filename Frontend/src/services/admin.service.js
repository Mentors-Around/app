// src/services/admin.service.js
import apiClient from './apiClient';

export const adminService = {
  // ── Teachers ──
  getAllTeachers: (params) => apiClient.get('/admin/teachers', { params }),
  getPendingTeachers: (params) => apiClient.get('/admin/teachers/pending', { params }),
  approveTeacher: (teacherId) => apiClient.patch(`/admin/teachers/${teacherId}/approve`),
  rejectTeacher: (teacherId, data) => apiClient.patch(`/admin/teachers/${teacherId}/reject`, data),
  suspendTeacher: (teacherId, data) => apiClient.patch(`/admin/teachers/${teacherId}/suspend`, data),

  // ── Documents ──
  getPendingDocuments: (params) => apiClient.get('/admin/documents/pending', { params }),
  approveDocument: (id) => apiClient.patch(`/admin/documents/${id}/approve`),
  rejectDocument: (id, data) => apiClient.patch(`/admin/documents/${id}/reject`, data),

  // ── Extra classes ──
  getPendingExtraClasses: (params) => apiClient.get('/admin/extra-classes/pending', { params }),
  approveExtraClass: (id) => apiClient.patch(`/admin/extra-classes/${id}/approve`),
  rejectExtraClass: (id, data) => apiClient.patch(`/admin/extra-classes/${id}/reject`, data),

  // ── Reports ──
  getOpenReports: (params) => apiClient.get('/admin/reports', { params }),
  getReportsRiskSummary: () => apiClient.get('/admin/reports/risk-summary'),
  getReportsDashboard: () => apiClient.get('/admin/reports/dashboard'),
  resolveReport: (id, data) => apiClient.patch(`/admin/reports/${id}/resolve`, data),
  dismissReport: (id, data) => apiClient.patch(`/admin/reports/${id}/dismiss`, data),

  // ── Refunds ──
  approveManualRefund: (id, data) => apiClient.patch(`/admin/refunds/${id}/approve`, data),

  // ── Classrooms ──
  getAllClassrooms: (params) => apiClient.get('/admin/classrooms', { params }),
  cancelClassroom: (classroomId, data) => apiClient.patch(`/admin/classrooms/${classroomId}/cancel`, data),

  // ── Users ──
  getAllUsers: (params) => apiClient.get('/admin/users', { params }),
  banUser: (userId, data) => apiClient.patch(`/admin/users/${userId}/ban`, data),
  unbanUser: (userId) => apiClient.patch(`/admin/users/${userId}/unban`),

  // ── Reviews ──
  hideReview: (reviewId) => apiClient.patch(`/admin/reviews/${reviewId}/hide`),

  // ── Stats ──
  getPlatformStats: () => apiClient.get('/admin/stats'),
  getTopTeachers: (params) => apiClient.get('/admin/top-teachers', { params }),
};

export default adminService;
