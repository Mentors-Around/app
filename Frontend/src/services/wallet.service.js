// src/services/wallet.service.js
import apiClient from './apiClient';

export const walletService = {
  getWallet: () => apiClient.get('/wallet'),
  getTransactions: (params) => apiClient.get('/wallet/transactions', { params }),

  createTokenCheckout: (data, idempotencyKey) =>
    apiClient.post('/wallet/tokens/checkout', data, { headers: { 'Idempotency-Key': idempotencyKey } }),
  verifyTokenPurchase: (data) => apiClient.post('/wallet/tokens/verify', data),

  createDepositCheckout: (data, idempotencyKey) =>
    apiClient.post('/wallet/deposit/checkout', data, { headers: { 'Idempotency-Key': idempotencyKey } }),
  verifyDeposit: (data) => apiClient.post('/wallet/deposit/verify', data),

  requestWithdrawal: (data) => apiClient.post('/wallet/withdraw', data),
};

export default walletService;
