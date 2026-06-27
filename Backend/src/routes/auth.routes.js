// src/routes/auth.routes.js
import { Router } from 'express';
import {
  signupSendOtp, signupVerifyOtp, signupComplete,
  loginWithPassword,
  forgotPasswordSendOtp, forgotPasswordVerifyOtp, resetPassword,
  sendPhoneOtp, verifyPhoneOtp,
  googleAuthUrl, googleCallback, googleComplete,
  refreshToken, logout,
} from '../controllers/auth.controller.js';
import { authLimiter }  from '../middlewares/rateLimit.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authLimiter);

// ── Signup (dual OTP: phone + email simultaneously) ───────────────────────────
router.post('/signup/send-otp',   signupSendOtp);
router.post('/signup/verify-otp', signupVerifyOtp);
router.post('/signup/complete',   signupComplete);   // auto-logs in on success

// ── Login (password only — no OTP cost on every login) ────────────────────────
router.post('/login/password',    loginWithPassword);

// ── Forgot password ───────────────────────────────────────────────────────────
router.post('/forgot-password/send-otp',   forgotPasswordSendOtp);    // channel: email | phone
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOtp);  // verify chosen channel OTP
router.post('/forgot-password/reset',      resetPassword);             // set new password + auto-login

// ── Phone linking (authenticated — add/update phone on existing account) ──────
router.post('/phone/send-otp',   authenticate, sendPhoneOtp);
router.post('/phone/verify-otp', authenticate, verifyPhoneOtp);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google',           googleAuthUrl);
router.get('/google/callback',  googleCallback);
router.post('/google/complete', googleComplete);    // new Google users complete profile here

// ── Session ───────────────────────────────────────────────────────────────────
router.post('/refresh', refreshToken);
router.post('/logout',  logout);

export default router;