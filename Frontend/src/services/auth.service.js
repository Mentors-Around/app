// src/services/auth.service.js
import apiClient from './apiClient';

export const authService = {
  signupSendOtp: (data) => apiClient.post('/auth/signup/send-otp', data),
  signupVerifyOtp: (data) => apiClient.post('/auth/signup/verify-otp', data),
  signupComplete: (data) => apiClient.post('/auth/signup/complete', data),

  loginWithPassword: (email, password) => apiClient.post('/auth/login/password', { email, password }),

  forgotPasswordSendOtp: (data) => apiClient.post('/auth/forgot-password/send-otp', data),
  forgotPasswordVerifyOtp: (data) => apiClient.post('/auth/forgot-password/verify-otp', data),
  resetPassword: (data) => apiClient.post('/auth/forgot-password/reset', data),

  sendPhoneOtp: (data) => apiClient.post('/auth/phone/send-otp', data),
  verifyPhoneOtp: (data) => apiClient.post('/auth/phone/verify-otp', data),

  googleAuthUrl: () => apiClient.get('/auth/google'),
  googleComplete: (data) => apiClient.post('/auth/google/complete', data),

  refresh: () => apiClient.post('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
};

export default authService;
