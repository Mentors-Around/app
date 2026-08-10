// ─────────────────────────────────────────────────────────────────────────────
// src/services/wallet.service.js
// Completely synchronized with updated StudentWallet and TokenTransaction schemas.
// ─────────────────────────────────────────────────────────────────────────────
import { StudentWallet, TokenTransaction } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.config.js";
import { PLATFORM_FEE } from "../constants/app.constants.js";
import { TOKEN_TRANSACTION_TYPE } from "../constants/enums.js";

export const WalletService = {
  async getOrCreate(studentId) {
    let wallet = await StudentWallet.findOne({ studentId });
    if (!wallet) {
      wallet = await StudentWallet.create({ studentId, tokenBalance: 0, cashBalancePaise: 0 });
    }
    return wallet;
  },

  async creditTokens(studentId, paymentId, count = null, session = null) {
    const tokens = typeof count === 'number' ? count : PLATFORM_FEE.TOKENS_PER_PURCHASE;
    const wallet = await StudentWallet.findOneAndUpdate(
      { studentId },
      { $inc: { tokenBalance: tokens, totalTokensPurchased: tokens } },
      { new: true, upsert: true, session }
    );

    await TokenTransaction.create(
      [{
        studentId,
        walletId: wallet._id,
        type: TOKEN_TRANSACTION_TYPE.PURCHASED,
        amount: tokens,
        balanceAfter: wallet.tokenBalance,
        paymentId,
        note: `Purchased ${tokens} tokens for ₹${(tokens === 5 ? 19 : tokens === 10 ? 35 : 79)}`,
      }],
      { session }
    );

    logger.info("Tokens credited internally", { studentId, tokens, balance: wallet.tokenBalance });
    return wallet;
  },

  async debitToken(studentId, queryId, classroomId, session = null) {
    const wallet = await StudentWallet.findOneAndUpdate(
      { studentId, tokenBalance: { $gte: 1 } },
      { $inc: { tokenBalance: -1 } },
      { new: true, session }
    );

    if (!wallet) {
      throw new ApiError(402, "Insufficient tokens. Please purchase more.", [], "INSUFFICIENT_TOKENS");
    }

    await TokenTransaction.create(
      [{
        studentId,
        walletId: wallet._id,
        type: TOKEN_TRANSACTION_TYPE.USED,
        amount: -1,
        balanceAfter: wallet.tokenBalance,
        queryId,
        note: "Token used to send enrollment query",
      }],
      { session }
    );

    return wallet;
  },

  async refundToken(studentId, queryId, reason, session = null) {
    const wallet = await StudentWallet.findOneAndUpdate(
      { studentId },
      { $inc: { tokenBalance: 1 } },
      { new: true, upsert: true, session }
    );

    await TokenTransaction.create(
      [{
        studentId,
        walletId: wallet._id,
        type: TOKEN_TRANSACTION_TYPE.REFUNDED,
        amount: 1,
        balanceAfter: wallet.tokenBalance,
        queryId,
        note: reason || "Token refunded due to query rejection/expiry",
      }],
      { session }
    );

    return wallet;
  },

  /**
   * Debit the student's internal cash balance (funds previously refunded via
   * Case 2/3 settlements) — used when a student opts to pay an enrollment
   * fee from wallet cash instead of a fresh Razorpay charge.
   *
   * Throws 402 INSUFFICIENT_CASH (not a generic 400/500) so the SPA can
   * immediately fall back to the Razorpay checkout flow without a page
   * reload, per the front-end's error-code contract.
   */
  // Credit cash to student wallet (from Razorpay deposit)
  async creditCash(studentId, amountPaise, session = null) {
    const wallet = await StudentWallet.findOneAndUpdate(
      { studentId },
      {
        $inc: {
          cashBalancePaise: amountPaise,
          totalCashDepositedPaise: amountPaise,
        },
      },
      { new: true, upsert: true, session },
    );
    logger.info('Cash credited to student wallet', { studentId, amountPaise, newBalance: wallet.cashBalancePaise });
    return wallet;
  },

  async debitCashOrThrow(studentId, amountPaise, session = null) {
    const wallet = await StudentWallet.findOneAndUpdate(
      { studentId, cashBalancePaise: { $gte: amountPaise } },
      { $inc: { cashBalancePaise: -amountPaise, totalCashSpentPaise: amountPaise } },
      { new: true, session }
    );

    if (!wallet) {
      throw new ApiError(
        402,
        "Insufficient wallet cash balance. Please pay via checkout instead.",
        [],
        "INSUFFICIENT_CASH",
      );
    }

    return wallet;
  },
};