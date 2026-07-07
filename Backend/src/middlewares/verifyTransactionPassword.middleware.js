// ─────────────────────────────────────────────────────────────────────────────
// src/middlewares/verifyTransactionPassword.middleware.js
//
// Security layer for in-app balance transfers.
// Any debit from a user's in-app wallet (token spend, cash spend, teacher deposit)
// requires the user to re-confirm their login password before the transfer proceeds.
//
// This prevents: stolen sessions / XSS spending the victim's balance silently.
// NOT applied to: Razorpay-gateway deposits/withdrawals (Razorpay handles auth there).
// ─────────────────────────────────────────────────────────────────────────────
import { User }        from '../models/index.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import ApiError         from '../utils/ApiError.js';

export const verifyTransactionPassword = asyncHandler(async (req, _res, next) => {
  const { transactionPassword } = req.body;

  if (!transactionPassword) {
    throw new ApiError(
      400,
      'Transaction password is required for in-app transfers. Please enter your login password to confirm.',
      [],
      'TRANSACTION_PASSWORD_REQUIRED',
    );
  }

  // Fetch user WITH passwordHash (it is select:false on the model)
  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!user?.passwordHash) {
    throw new ApiError(
      403,
      'No password set on this account. Please set a password before making in-app transfers.',
      [],
      'NO_PASSWORD_SET',
    );
  }

  const isValid = await user.comparePassword(transactionPassword);
  if (!isValid) {
    throw new ApiError(
      401,
      'Incorrect transaction password. Please try again.',
      [],
      'INVALID_TRANSACTION_PASSWORD',
    );
  }

  next();
});