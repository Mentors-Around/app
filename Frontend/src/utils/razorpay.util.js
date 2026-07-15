// src/utils/razorpay.util.js
// Thin wrapper around the Razorpay Checkout.js widget (loaded via <script> in index.html).
import { env } from '@/config/env';

export const openRazorpayCheckout = ({ order, name = 'TrueEd', description, prefill, theme = '#16355F' }) =>
  new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Payment gateway failed to load. Please refresh and try again.'));
      return;
    }

    const rzp = new window.Razorpay({
      key: env.RAZORPAY_KEY_ID || order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      order_id: order.id,
      name,
      description,
      prefill,
      theme: { color: theme },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });

    rzp.on('payment.failed', (response) => reject(new Error(response.error?.description || 'Payment failed')));
    rzp.open();
  });

export default openRazorpayCheckout;
