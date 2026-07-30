// src/routes/wallet.routes.js
import { Router } from 'express';
import { authenticate }         from '../middlewares/auth.middleware.js';
import { requireStudent }       from '../middlewares/student.middleware.js';
import { optionalIdempotency }  from '../middlewares/idempotency.middleware.js';
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

// ── Tokens (Mock or Razorpay) ─────────────────────────────────────────────────
// Use optionalIdempotency so mock mode works without sending an idempotency key
router.post('/tokens/checkout', paymentLimiter, optionalIdempotency, createTokenCheckout);
router.post('/tokens/verify',   paymentLimiter, verifyTokenPurchase);

// ── Cash deposit ──────────────────────────────────────────────────────────────
router.post('/deposit/checkout', paymentLimiter, optionalIdempotency, createStudentDepositCheckout);
router.post('/deposit/verify',   paymentLimiter, verifyStudentDeposit);

// ── Cash withdrawal ───────────────────────────────────────────────────────────
router.post('/withdraw', paymentLimiter, requestStudentWithdrawal);

export default router;