// src/services/payout.service.js
import apiClient from './apiClient';

export const payoutService = {
  getMyPayouts: (params) => apiClient.get('/payouts', { params }),
  requestWithdrawal: (data) => apiClient.post('/payouts/withdraw', data),
  getPayoutDetail: (payoutId) => apiClient.get(`/payouts/${payoutId}`),

  // ── Admin ──
  adminGetAll: (params) => apiClient.get('/payouts/admin/all', { params }),
  adminHold: (payoutId, data) => apiClient.patch(`/payouts/admin/${payoutId}/hold`, data),
  adminRelease: (payoutId) => apiClient.patch(`/payouts/admin/${payoutId}/release`),
};

export default payoutService;
