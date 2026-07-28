// src/controllers/wallet.controller.js
import { Payment, TokenTransaction } from '../models/index.js';
import { PAYOUT_STATUS } from '../constants/enums.js';
import { WalletService }  from '../services/wallet.service.js';
import { PaymentService } from '../services/payment.service.js';
import { asyncHandler }   from '../utils/AsyncHandler.js';
import ApiError           from '../utils/ApiError.js';
import ApiResponse        from '../utils/ApiResponse.js';
import { PAYMENT_PURPOSE, PAYMENT_STATUS } from '../constants/enums.js';
import { PLATFORM_FEE } from '../constants/app.constants.js';
import logger            from '../config/logger.config.js';

// ── GET / — Get wallet balance ────────────────────────────────────────────────
export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await WalletService.getOrCreate(req.user._id);
  res.status(200).json(new ApiResponse(200, {
    tokenBalance:        wallet.tokenBalance,
    cashBalancePaise:    wallet.cashBalancePaise,
    cashBalanceRupees:   wallet.cashBalancePaise / 100,
    totalTokensPurchased:wallet.totalTokensPurchased,
    totalTokensUsed:     wallet.totalTokensUsed,
  }, 'Wallet balance'));
});

// ── POST /tokens/checkout — Create token purchase order ───────────────────────
export const createTokenCheckout = asyncHandler(async (req, res) => {
  const order = await PaymentService.createTokenPurchaseOrder(req.user._id);

  await Payment.create({
    purpose:          PAYMENT_PURPOSE.TOKEN_PURCHASE,
    payerId:          req.user._id,
    totalAmountPaise: PLATFORM_FEE.TOKEN_PRICE_PAISE,
    tokensBought:     PLATFORM_FEE.TOKENS_PER_PURCHASE,
    status:           PAYMENT_STATUS.CREATED,
    razorpayOrderId:  order.id,
    idempotencyKey:   req.idempotencyKey || null,
  });

  logger.info('Token purchase order created', { userId: req.user._id, orderId: order.id });
  res.status(200).json(new ApiResponse(200, {
    razorpayOrder:   order,
    tokensBought:    PLATFORM_FEE.TOKENS_PER_PURCHASE,
    amountPaise:     PLATFORM_FEE.TOKEN_PRICE_PAISE,
  }, 'Payment order created'));
});

// ── POST /tokens/verify — Verify payment and credit tokens ───────────────────
export const verifyTokenPurchase = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw ApiError.badRequest('razorpayOrderId, razorpayPaymentId and razorpaySignature are required');
  }

  const isValid = PaymentService.verifyPaymentSignature({
    orderId:   razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!isValid) throw new ApiError(400, 'Invalid payment signature', [], 'PAYMENT_SIGNATURE_INVALID');

  const payment = await Payment.findOne({
    razorpayOrderId,
    payerId:  req.user._id,
    purpose:  PAYMENT_PURPOSE.TOKEN_PURCHASE,
    status:   PAYMENT_STATUS.CREATED,
  });
  if (!payment) throw ApiError.notFound('Payment record');

  // Prevent double-credit
  const { default: mongoose } = await import('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await payment.capture({ razorpayPaymentId, razorpaySignature });
    await WalletService.creditTokens(req.user._id, payment._id, session);
    await session.commitTransaction();

    const wallet = await WalletService.getOrCreate(req.user._id);
    logger.info('Tokens credited', { userId: req.user._id, tokens: PLATFORM_FEE.TOKENS_PER_PURCHASE });
    res.status(200).json(new ApiResponse(200, {
      tokensAdded:  PLATFORM_FEE.TOKENS_PER_PURCHASE,
      tokenBalance: wallet.tokenBalance,
    }, `${PLATFORM_FEE.TOKENS_PER_PURCHASE} tokens credited`));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ── GET /transactions — Token transaction history ─────────────────────────────
export const getTokenTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await TokenTransaction.paginate(
    { studentId: req.user._id },
    {
      page: Number(page), limit: Math.min(Number(limit), 50),
      sort: { createdAt: -1 },
    },
  );

  res.status(200).json(new ApiResponse(200, result, 'Token transactions'));
});
// ── POST /deposit/checkout — Student initiates cash deposit via Razorpay ──────
export const createStudentDepositCheckout = asyncHandler(async (req, res) => {
  const { amountPaise, password } = req.body;
  if (!amountPaise || Number(amountPaise) < 100) {
    throw ApiError.badRequest('amountPaise must be at least ₹1 (100 paise)');
  }

  const isGatewayConfigured = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

  if (!isGatewayConfigured && password) {
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Invalid password');

    user.walletPaise = (user.walletPaise || 0) + Math.round(Number(amountPaise));
    await user.save();

    await Payment.create({
      purpose:          PAYMENT_PURPOSE.CASH_DEPOSIT,
      payerId:          req.user._id,
      totalAmountPaise: Math.round(Number(amountPaise)),
      status:           PAYMENT_STATUS.CAPTURED,
      gateway:          'manual',
      idempotencyKey:   req.idempotencyKey || null,
    });

    logger.info('Student direct deposit completed', { userId: req.user._id, amountPaise });
    return res.status(200).json(new ApiResponse(200, { directDeposit: true }, 'Deposit completed successfully'));
  }

  const order = await PaymentService.createOrder({
    amountPaise: Math.round(Number(amountPaise)),
    receipt:     `sdep_${req.user._id.toString().slice(-8)}_${Date.now()}`,
    notes:       { purpose: PAYMENT_PURPOSE.CASH_DEPOSIT, userId: req.user._id.toString(), role: 'student' },
  });

  await Payment.create({
    purpose:          PAYMENT_PURPOSE.CASH_DEPOSIT,
    payerId:          req.user._id,
    totalAmountPaise: Math.round(Number(amountPaise)),
    status:           PAYMENT_STATUS.CREATED,
    razorpayOrderId:  order.id,
    idempotencyKey:   req.idempotencyKey || null,
  });

  logger.info('Student deposit order created', { userId: req.user._id, amountPaise });
  res.status(200).json(new ApiResponse(200, { razorpayOrder: order, amountPaise: Math.round(Number(amountPaise)) }, 'Deposit order created'));
});

// ── POST /deposit/verify — Verify Razorpay payment and credit student wallet ──
export const verifyStudentDeposit = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw ApiError.badRequest('razorpayOrderId, razorpayPaymentId and razorpaySignature are required');
  }

  const isValid = PaymentService.verifyPaymentSignature({
    orderId:   razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!isValid) throw new ApiError(400, 'Invalid payment signature', [], 'PAYMENT_SIGNATURE_INVALID');

  const payment = await Payment.findOne({
    razorpayOrderId,
    payerId: req.user._id,
    purpose: PAYMENT_PURPOSE.CASH_DEPOSIT,
    status:  PAYMENT_STATUS.CREATED,
  });
  if (!payment) throw ApiError.notFound('Payment record');

  const { default: mongoose } = await import('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await payment.capture({ razorpayPaymentId, razorpaySignature });

    const wallet = await WalletService.creditCash(req.user._id, payment.totalAmountPaise, session);
    await session.commitTransaction();

    // Email receipt
    const { EmailService } = await import('../services/email.service.js');
    const user = await (await import('../models/index.js')).User.findById(req.user._id).select('name email').lean();
    if (user?.email) {
      EmailService.sendPaymentReceipt(user.email, {
        recipientName:     user.name,
        transactionId:     razorpayPaymentId,
        description:       'Wallet top-up (deposit)',
        type:              'cash_deposit',
        amountPaise:       payment.totalAmountPaise,
        date:              new Date().toISOString(),
        balanceAfterPaise: wallet.cashBalancePaise,
      }).catch(() => {});
    }

    logger.info('Student wallet topped up', { userId: req.user._id, amountPaise: payment.totalAmountPaise });
    res.status(200).json(new ApiResponse(200, {
      depositedPaise:  payment.totalAmountPaise,
      cashBalancePaise: wallet.cashBalancePaise,
    }, 'Wallet topped up successfully'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ── POST /withdraw — Student withdraws cash balance to bank (via Razorpay X) ──
export const requestStudentWithdrawal = asyncHandler(async (req, res) => {
  const { amountPaise } = req.body;
  if (!amountPaise || Number(amountPaise) < 100) {
    throw ApiError.badRequest('Minimum withdrawal is ₹1 (100 paise)');
  }

  const requestedPaise = Math.round(Number(amountPaise));
  const wallet = await WalletService.getOrCreate(req.user._id);

  if (wallet.cashBalancePaise < requestedPaise) {
    throw new ApiError(402, `Insufficient balance. Available: ₹${(wallet.cashBalancePaise / 100).toFixed(2)}`, [], 'INSUFFICIENT_BALANCE');
  }

  // Verify user has bank account linked (via user profile)
  const { User } = await import('../models/index.js');
  const user = await User.findById(req.user._id).select('name email bankAccount').lean();

  const { default: mongoose } = await import('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await WalletService.debitCashOrThrow(req.user._id, requestedPaise, session);

    // Create payout record — actual bank transfer processed by admin/cron
    const { Payout } = await import('../models/index.js');
    const payout = await Payout.create([{
      teacherId:              req.user._id, // reuse field as withdrawer
      grossFeesCollectedPaise: requestedPaise,
      teacherPayoutPaise:     requestedPaise,
      platformFeePaise:       0,
      studentRefundTotalPaise: 0,
      status:                 PAYOUT_STATUS?.QUEUED || 'queued',
      notes:                  'Student cash withdrawal',
    }], { session });

    await session.commitTransaction();

    // Email receipt
    const { EmailService } = await import('../services/email.service.js');
    if (user?.email) {
      EmailService.sendPaymentReceipt(user.email, {
        recipientName:     user.name,
        transactionId:     payout[0]._id.toString(),
        description:       'Wallet withdrawal',
        type:              'withdrawal',
        amountPaise:       requestedPaise,
        date:              new Date().toISOString(),
        balanceAfterPaise: wallet.cashBalancePaise - requestedPaise,
      }).catch(() => {});
    }

    logger.info('Student withdrawal requested', { userId: req.user._id, amountPaise: requestedPaise });
    res.status(201).json(new ApiResponse(201, {
      payoutId:    payout[0]._id,
      amountPaise: requestedPaise,
      status:      'queued',
    }, 'Withdrawal request submitted. Funds will be transferred within 2-3 business days.'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});