import Razorpay from "razorpay";
import crypto from "crypto";
import env from "../config/env.config.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.config.js";
import { PLATFORM_FEE } from "../constants/app.constants.js";

let razorpay = null;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export const PaymentService = {
  _assertGateway() {
    if (!razorpay) {
      throw ApiError.serviceUnavailable("Payment gateway not configured.", "PAYMENT_UNAVAILABLE");
    }
  },

  /**
   * Create a Razorpay order.
   */
  async createOrder({ amountPaise, currency = "INR", receipt, notes = {} }) {
    this._assertGateway();
    try {
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency,
        receipt: receipt?.substring(0, 40), // Razorpay limit
        notes,
      });
      logger.info("Razorpay order created", { orderId: order.id, amount: amountPaise });
      return order;
    } catch (err) {
      logger.error("Razorpay order creation failed", { error: err.message });
      throw ApiError.internal("Failed to create payment order.", "PAYMENT_ORDER_FAILED");
    }
  },

  /**
   * Create a ₹19 token purchase order.
   */
  async createTokenPurchaseOrder(userId) {
    return this.createOrder({
      amountPaise: PLATFORM_FEE.TOKEN_PRICE_PAISE,
      receipt: `tok_${userId.toString().slice(-8)}_${Date.now()}`,
      notes: { purpose: "token_purchase", userId: userId.toString() },
    });
  },

  /**
   * Create an enrollment fee order.
   */
  async createEnrollmentOrder(userId, classroomId, amountPaise) {
    return this.createOrder({
      amountPaise,
      receipt: `enr_${classroomId.toString().slice(-8)}_${Date.now()}`,
      notes: { purpose: "enrollment_fee", userId: userId.toString(), classroomId: classroomId.toString() },
    });
  },

  /**
   * Verify Razorpay webhook signature.
   * Use with express.raw() body — never parsed JSON.
   */
  verifyWebhookSignature(rawBody, signature) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw ApiError.internal("Webhook secret not configured.");
    }
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  },

  /**
   * Verify client-side payment signature (after capture).
   */
  verifyPaymentSignature({ orderId, paymentId, signature }) {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  },

  /**
   * Initiate a refund via Razorpay.
   */
  async initiateRefund(paymentId, amountPaise, notes = {}) {
    this._assertGateway();
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amountPaise,
        notes,
      });
      logger.info("Refund initiated", { paymentId, refundId: refund.id, amount: amountPaise });
      return refund;
    } catch (err) {
      logger.error("Refund failed", { paymentId, error: err.message });
      throw ApiError.internal("Failed to initiate refund.", "REFUND_FAILED");
    }
  },

  /**
   * Fetch payment details from Razorpay.
   */
  async fetchPayment(paymentId) {
    this._assertGateway();
    return razorpay.payments.fetch(paymentId);
  },
};
