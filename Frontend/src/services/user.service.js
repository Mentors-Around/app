// src/services/user.service.js
import apiClient from './apiClient';

export const userService = {
  getMe: () => apiClient.get('/users/me'),
  updateMe: (data) => apiClient.patch('/users/me', data),
  deleteMe: () => apiClient.delete('/users/me'),
  uploadAvatar: (formData) =>
    apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) => apiClient.post('/users/me/change-password', data),

  requestPhoneChange: (data) => apiClient.post('/users/me/phone/send-otp', data),
  confirmPhoneChange: (data) => apiClient.post('/users/me/phone/verify', data),
  requestEmailChange: (data) => apiClient.post('/users/me/email/send-otp', data),
  confirmEmailChange: (data) => apiClient.post('/users/me/email/verify', data),
  updateParentPhone: (data) => apiClient.patch('/users/me/parent-phone', data),

  sendGuardianOtp: (data) => apiClient.post('/users/me/parental-consent/send-otp', data),
  submitParentalConsent: (data) => apiClient.post('/users/me/parental-consent', data),

  updateFcmToken: (data) => apiClient.post('/users/me/fcm-token', data),

  getSavedClassrooms: (params) => apiClient.get('/users/me/saved-classrooms', { params }),
  saveClassroom: (classroomId) => apiClient.post(`/users/me/saved-classrooms/${classroomId}`),
  unsaveClassroom: (classroomId) => apiClient.delete(`/users/me/saved-classrooms/${classroomId}`),

  getSavedTeachers: (params) => apiClient.get('/users/me/saved-teachers', { params }),
  saveTeacher: (teacherId) => apiClient.post(`/users/me/saved-teachers/${teacherId}`),
  unsaveTeacher: (teacherId) => apiClient.delete(`/users/me/saved-teachers/${teacherId}`),

  getPaymentHistory: (params) => apiClient.get('/users/me/payments', { params }),
  getSupport: () => apiClient.get('/users/support'),
};

export default userService;
