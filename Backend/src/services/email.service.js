// ─────────────────────────────────────────────────────────────────────────────
// src/services/email.service.js
// ─────────────────────────────────────────────────────────────────────────────
import { Resend } from 'resend';
import env from '../config/env.config.js';
import logger from '../config/logger.config.js';

let _resendInstance = null;

const getResendClient = () => {
  if (_resendInstance) return _resendInstance;

  if (!env.RESEND_API_KEY) {
    throw new Error(
      'EMAIL_PROVIDER=resend requires RESEND_API_KEY in .env\n' +
      'Get your API Key at: https://resend.com/api-keys',
    );
  }
  _resendInstance = new Resend(env.RESEND_API_KEY);
  logger.info('[Email] Resend client initialised');
  return _resendInstance;
};

// ── HTML builders ─────────────────────────────────────────────────────────────
const buildOtpHtml = (otp, expiryMinutes, purpose) => {
  const purposeLabel = purpose === 'register' ? 'verify your email' : 'log in to your account';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>TrueEd OTP</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
<tr><td style="background:#4F46E5;padding:28px 40px;"><h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">TrueEd</h1><p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">Your Learning Platform</p></td></tr>
<tr><td style="padding:36px 40px 28px;">
<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">Hi there,</p>
<p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">Use the code below to ${purposeLabel}. It expires in <strong>${expiryMinutes} minutes</strong>.</p>
<div style="text-align:center;margin:0 0 28px;"><span style="display:inline-block;background:#F3F4F6;border:2px dashed #4F46E5;border-radius:8px;padding:18px 40px;font-size:36px;font-weight:700;color:#4F46E5;letter-spacing:10px;font-family:monospace;">${otp}</span></div>
<p style="margin:0 0 8px;color:#6B7280;font-size:13px;line-height:1.5;">🔒 <strong>Never share this code</strong> — TrueEd will never ask for it.</p>
<p style="margin:0;color:#6B7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
</td></tr>
<tr><td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;"><p style="margin:0;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} TrueEd · Automated message, do not reply.</p></td></tr>
</table></td></tr></table></body></html>`;
};

/**
 * Builds a payment receipt HTML email.
 * @param {object} data
 * @param {string} data.recipientName
 * @param {string} data.transactionId   - internal or Razorpay payment/order ID
 * @param {string} data.description     - e.g. "3 Query Tokens", "Enrollment: Kinematics for JEE"
 * @param {string} data.type            - 'token_purchase' | 'enrollment_fee' | 'cash_deposit' | 'cash_withdrawal' | 'teacher_deposit'
 * @param {number} data.amountPaise     - amount in paise
 * @param {string} data.date            - ISO date string
 * @param {string} [data.classroomName] - if applicable
 * @param {number} [data.balanceAfterPaise] - wallet balance after (if in-app transfer)
 */
const buildReceiptHtml = ({
  recipientName, transactionId, description, type, amountPaise, date,
  classroomName, balanceAfterPaise,
}) => {
  const amountRupees = (amountPaise / 100).toFixed(2);
  const formattedDate = new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  const typeLabels = {
    token_purchase: '🎟️  Token Purchase',
    enrollment_fee: '📚 Classroom Enrollment',
    cash_deposit: '💰 Wallet Deposit',
    cash_withdrawal: '🏦 Wallet Withdrawal',
    teacher_deposit: '🔒 Query Acceptance Deposit',
  };
  const typeLabel = typeLabels[type] || description;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>TrueEd Receipt</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
<tr><td style="background:#4F46E5;padding:28px 40px;"><h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">TrueEd</h1><p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">Payment Receipt</p></td></tr>
<tr><td style="padding:36px 40px;">
<p style="margin:0 0 4px;color:#374151;font-size:15px;">Hi <strong>${recipientName}</strong>,</p>
<p style="margin:0 0 24px;color:#6B7280;font-size:14px;">Here's your payment receipt from TrueEd.</p>
<table width="100%" cellpadding="12" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;font-size:14px;color:#374151;">
  <tr style="background:#F9FAFB;"><td style="border-bottom:1px solid #E5E7EB;font-weight:700;" colspan="2">${typeLabel}</td></tr>
  <tr><td style="border-bottom:1px solid #E5E7EB;color:#6B7280;">Description</td><td style="border-bottom:1px solid #E5E7EB;">${description}</td></tr>
  ${classroomName ? `<tr><td style="border-bottom:1px solid #E5E7EB;color:#6B7280;">Classroom</td><td style="border-bottom:1px solid #E5E7EB;">${classroomName}</td></tr>` : ''}
  <tr><td style="border-bottom:1px solid #E5E7EB;color:#6B7280;">Amount</td><td style="border-bottom:1px solid #E5E7EB;font-weight:700;color:#059669;">₹${amountRupees}</td></tr>
  <tr><td style="border-bottom:1px solid #E5E7EB;color:#6B7280;">Date & Time</td><td style="border-bottom:1px solid #E5E7EB;">${formattedDate} IST</td></tr>
  <tr><td style="color:#6B7280;">Transaction ID</td><td style="font-family:monospace;font-size:12px;">${transactionId}</td></tr>
  ${balanceAfterPaise !== undefined ? `<tr><td style="color:#6B7280;border-top:1px solid #E5E7EB;">Wallet Balance After</td><td style="border-top:1px solid #E5E7EB;">₹${(balanceAfterPaise / 100).toFixed(2)}</td></tr>` : ''}
</table>
<p style="margin:20px 0 0;color:#6B7280;font-size:13px;">If you did not make this transaction, please contact us immediately at <a href="mailto:trued.alex@gmail.com" style="color:#4F46E5;">trued.alex@gmail.com</a> or call <a href="tel:+919905893153" style="color:#4F46E5;">+91 99058 93153</a>.</p>
</td></tr>
<tr><td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;"><p style="margin:0;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} TrueEd · Automated receipt, do not reply.</p></td></tr>
</table></td></tr></table></body></html>`;
};

// ── Public API ────────────────────────────────────────────────────────────────
export const EmailService = {

  async send({ to, subject, html, text }) {
    if (!to || !subject || !html) {
      logger.error('[Email] send() called with missing fields', { to, subject });
      return null;
    }
    if (typeof to === 'string' && to.startsWith('google_')) {
      logger.warn('[Email] Skipping Google OAuth placeholder address', { to });
      return null;
    }

    if (env.EMAIL_PROVIDER === 'mock') {
      logger.info('[Email] MOCK mode — skipping email dispatch', { to: _maskEmail(to), subject });
      console.log(`\n📧 MOCK EMAIL TO: ${to}\nSUBJECT: ${subject}\n`);
      return { id: 'mock-' + Date.now() };
    }

    const from = env.EMAIL_FROM || 'TrueEd <onboarding@resend.dev>';

    try {
      const resend = getResendClient();
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
      });

      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }

      logger.info('[Email] Sent successfully via Resend', {
        to: _maskEmail(to), subject, messageId: data?.id,
      });
      return data;

    } catch (err) {
      logger.error('[Email] ❌ DELIVERY FAILED (Resend)', {
        to: _maskEmail(to), subject,
        provider: env.EMAIL_PROVIDER,
        errorMsg: err.message,
        hasApiKey: !!env.RESEND_API_KEY,
      });

      if (env.NODE_ENV === 'development') {
        const hint = _getErrorHint(err);
        throw new Error(`[Email] Resend delivery failed: ${err.message}${hint}`);
      }
      return null;
    }
  },

  async sendOtp(to, otp, expiryMinutes = 10, purpose = 'login') {
    const subjectMap = {
      register: 'Verify your TrueEd account',
      login: 'Your TrueEd login code',
      reset: 'Reset your TrueEd password',
      phone_change: 'TrueEd — verify phone change',
      email_change: 'TrueEd — verify your new email',
      email_verify: 'Verify your TrueEd email',
    };
    const subject = subjectMap[purpose] || 'Your TrueEd OTP';
    const html = buildOtpHtml(otp, expiryMinutes, purpose);
    const text = `Your TrueEd OTP: ${otp}\nValid for ${expiryMinutes} minutes. Never share this.`;
    return this.send({ to, subject, html, text });
  },

  /**
   * Send a payment receipt email.
   * Called after every successful in-app or gateway transaction.
   *
   * @param {string} to               - recipient email
   * @param {object} receiptData      - see buildReceiptHtml for fields
   */
  async sendPaymentReceipt(to, receiptData) {
    if (!to) return null;
    const { description = 'TrueEd Transaction' } = receiptData;
    const subject = `TrueEd Receipt — ${description}`;
    const html = buildReceiptHtml(receiptData);
    const text = [
      `TrueEd Payment Receipt`,
      `Description: ${description}`,
      `Amount: ₹${(receiptData.amountPaise / 100).toFixed(2)}`,
      `Transaction ID: ${receiptData.transactionId}`,
      `Date: ${new Date(receiptData.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
    ].join('\n');

    // Fire-and-forget — receipt delivery failure must never block the API response
    this.send({ to, subject, html, text }).catch((err) => {
      logger.error('[Email] Receipt delivery failed (non-critical)', {
        to: _maskEmail(to), error: err.message,
      });
    });
  },

  /**
   * Send a classroom event notification email to an enrolled student.
   * Fire-and-forget — never blocks the API response.
   *
   * @param {string}   to               - recipient email
   * @param {object}   data
   * @param {string}   data.studentName - recipient name
   * @param {string}   data.classroomTitle
   * @param {string}   data.eventType   - 'announcement' | 'material' | 'poll' | 'session'
   * @param {string}   data.eventTitle  - e.g. announcement title, material name
   * @param {string}   [data.eventBody] - optional summary
   */
  async sendClassroomNotification(to, data) {
    if (!to) return null;
    const { studentName, classroomTitle, eventType, eventTitle, eventBody = '' } = data;

    const typeConfig = {
      announcement: { emoji: '📢', label: 'New Announcement', color: '#4F46E5' },
      material: { emoji: '📄', label: 'New Study Material', color: '#059669' },
      poll: { emoji: '🗳️', label: 'New Poll / Vote', color: '#D97706' },
      session: { emoji: '📅', label: 'Session Schedule Update', color: '#7C3AED' },
    };
    const config = typeConfig[eventType] || { emoji: '🔔', label: 'Classroom Update', color: '#4F46E5' };

    const subject = `${config.emoji} ${config.label} in "${classroomTitle}"`;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>TrueEd Notification</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
<tr><td style="background:${config.color};padding:28px 40px;"><h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">TrueEd</h1><p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${config.label}</p></td></tr>
<tr><td style="padding:36px 40px 28px;">
<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>${studentName}</strong>,</p>
<p style="margin:0 0 24px;color:#374151;font-size:15px;">There's a new update in your classroom <strong>"${classroomTitle}"</strong>:</p>
<div style="background:#F9FAFB;border-left:4px solid ${config.color};border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
  <p style="margin:0 0 4px;font-weight:700;color:#111827;font-size:15px;">${config.emoji} ${eventTitle}</p>
  ${eventBody ? `<p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">${eventBody}</p>` : ''}
</div>
<p style="margin:0 0 24px;color:#374151;font-size:14px;">Log in to your TrueEd dashboard to view the full details.</p>
</td></tr>
<tr><td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;"><p style="margin:0;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} TrueEd · Automated notification, do not reply directly. Contact us at <a href="mailto:trued.alex@gmail.com" style="color:#4F46E5;">trued.alex@gmail.com</a></p></td></tr>
</table></td></tr></table></body></html>`;

    const text = `Hi ${studentName},\n\n${config.label} in "${classroomTitle}"\n${eventTitle}\n${eventBody}\n\nLog in to view details.\n\n— TrueEd Team`;
    this.send({ to, subject, html, text }).catch((err) => {
      logger.error('[Email] Classroom notification failed (non-critical)', {
        to: _maskEmail(to), error: err.message,
      });
    });
  },

  async verifyConnection() {
    if (env.EMAIL_PROVIDER === 'mock') {
      logger.info('[Email] Mock provider — skipping connection check');
      return true;
    }
    if (!env.RESEND_API_KEY) {
      logger.error('[Email] ❌ RESEND_API_KEY is missing in .env');
      return false;
    }
    try {
      getResendClient();
      logger.info('[Email] ✅ Resend client initialised successfully');
      return true;
    } catch (err) {
      logger.error('[Email] ❌ Resend setup failed', { error: err.message });
      return false;
    }
  },
};

const _maskEmail = (email) => {
  if (!email?.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};

const _getErrorHint = (err) => {
  const msg = err.message || '';
  if (msg.includes('API key') || msg.includes('unauthorized') || msg.includes('401')) {
    return (
      '\n💡 FIX: Resend API Key is invalid or unauthorized.\n' +
      '   Check RESEND_API_KEY in .env (starts with re_).'
    );
  }
  if (msg.includes('domain') || msg.includes('testing')) {
    return (
      '\n💡 FIX: Domain verification issue in Resend.\n' +
      '   If using onboarding@resend.dev, you can only send to your account registered email.'
    );
  }
  return '\n💡 See https://resend.com/docs for Resend API documentation.';
};