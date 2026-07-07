// src/routes/wallet.routes.js
import { Router } from 'express';
import { authenticate }         from '../middlewares/auth.middleware.js';
import { requireStudent }       from '../middlewares/student.middleware.js';
import { requireIdempotencyKey } from '../middlewares/idempotency.middleware.js';
import { paymentLimiter }       from '../middlewares/rateLimit.middleware.js';
import {
  getWallet, createTokenCheckout, verifyTokenPurchase, getTokenTransactions,
  createStudentDepositCheckout, verifyStudentDeposit, requestStudentWithdrawal,
} from '../controllers/wallet.controller.js';

const router = Router();
router.use(authenticate, requireStudent);

// ── Balance ───────────────────────────────────────────────────────────────────
router.get('/',             getWallet);
router.get('/transactions', getTokenTransactions);

// ── Tokens (Razorpay — ₹19 for 3 tokens) ─────────────────────────────────────
router.post('/tokens/checkout', paymentLimiter, requireIdempotencyKey, createTokenCheckout);
router.post('/tokens/verify',   paymentLimiter, verifyTokenPurchase);

// ── Cash deposit (Razorpay) ───────────────────────────────────────────────────
router.post('/deposit/checkout', paymentLimiter, requireIdempotencyKey, createStudentDepositCheckout);
router.post('/deposit/verify',   paymentLimiter, verifyStudentDeposit);

// ── Cash withdrawal (to bank — processed by admin/cron) ───────────────────────
router.post('/withdraw', paymentLimiter, requestStudentWithdrawal);

export default router;