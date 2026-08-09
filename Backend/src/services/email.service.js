// ─────────────────────────────────────────────────────────────────────────────
// src/services/email.service.js
// ─────────────────────────────────────────────────────────────────────────────
import nodemailer from 'nodemailer';
import env        from '../config/env.config.js';
import logger     from '../config/logger.config.js';

let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  if (env.EMAIL_PROVIDER === 'mock') {
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: env.ETHEREAL_USER || 'test@ethereal.email', pass: env.ETHEREAL_PASS || 'testpass' },
    });
    logger.info('[Email] Using Ethereal mock transport — no real emails will be sent');
    return _transporter;
  }

  if (env.EMAIL_PROVIDER === 'gmail') {
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
      throw new Error(
        'EMAIL_PROVIDER=gmail requires GMAIL_USER and GMAIL_APP_PASSWORD in .env\n' +
        'Generate an App Password at: https://myaccount.google.com → Security → App passwords',
      );
    }
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth:    { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    });
    logger.info('[Email] Gmail transport initialised', { user: env.GMAIL_USER });
    return _transporter;
  }

  if (env.EMAIL_PROVIDER === 'smtp') {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      throw new Error('EMAIL_PROVIDER=smtp requires SMTP_HOST, SMTP_USER and SMTP_PASS in .env');
    }
    _transporter = nodemailer.createTransport({
      host:   env.SMTP_HOST,
      port:   Number(env.SMTP_PORT) || 587,
      secure: Number(env.SMTP_PORT) === 465,
      auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
      tls:    { rejectUnauthorized: env.NODE_ENV === 'production' },
    });
    logger.info('[Email] SMTP transport initialised', { host: env.SMTP_HOST });
    return _transporter;
  }

  throw new Error(`Unknown EMAIL_PROVIDER="${env.EMAIL_PROVIDER}". Valid values: gmail | smtp | mock`);
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
    token_purchase:  '🎟️  Token Purchase',
    enrollment_fee:  '📚 Classroom Enrollment',
    cash_deposit:    '💰 Wallet Deposit',
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

    const from = env.EMAIL_FROM
      || `TrueEd <${env.GMAIL_USER || env.SMTP_USER || 'noreply@trueed.in'}>`;

    try {
      const transport = getTransporter();
      const info      = await transport.sendMail({ from, to, subject, html, text });

      if (env.EMAIL_PROVIDER === 'mock') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.debug('[Email] MOCK — open this URL to read the email in browser', { previewUrl });
        console.log('\n📧 EMAIL PREVIEW (copy into browser):', previewUrl, '\n');
      }

      logger.info('[Email] Sent successfully', {
        to: _maskEmail(to), subject, messageId: info.messageId,
      });
      return info;

    } catch (err) {
      logger.error('[Email] ❌ DELIVERY FAILED', {
        to: _maskEmail(to), subject,
        provider:   env.EMAIL_PROVIDER,
        errorCode:  err.code || 'UNKNOWN',
        errorMsg:   err.message,
        gmailUser:  env.GMAIL_USER || '(not set)',
        hasAppPass: !!env.GMAIL_APP_PASSWORD,
      });

      if (env.NODE_ENV === 'development') {
        const hint = _getErrorHint(err);
        throw new Error(`[Email] Gmail delivery failed: ${err.message}${hint}`);
      }
      return null;
    }
  },

  async sendOtp(to, otp, expiryMinutes = 10, purpose = 'login') {
    const subjectMap = {
      register:     'Verify your TrueEd account',
      login:        'Your TrueEd login code',
      reset:        'Reset your TrueEd password',
      phone_change: 'TrueEd — verify phone change',
      email_change: 'TrueEd — verify your new email',
      email_verify: 'Verify your TrueEd email',
    };
    const subject = subjectMap[purpose] || 'Your TrueEd OTP';
    const html    = buildOtpHtml(otp, expiryMinutes, purpose);
    const text    = `Your TrueEd OTP: ${otp}\nValid for ${expiryMinutes} minutes. Never share this.`;
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
    const html    = buildReceiptHtml(receiptData);
    const text    = [
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
      announcement: { emoji: '📢', label: 'New Announcement',       color: '#4F46E5' },
      material:     { emoji: '📄', label: 'New Study Material',     color: '#059669' },
      poll:         { emoji: '🗳️', label: 'New Poll / Vote',        color: '#D97706' },
      session:      { emoji: '📅', label: 'Session Schedule Update', color: '#7C3AED' },
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
    try {
      const transport = getTransporter();
      await transport.verify();
      logger.info('[Email] ✅ Transporter connection verified successfully');
      return true;
    } catch (err) {
      logger.error('[Email] ❌ Transporter connection FAILED', {
        error: err.message, errorCode: err.code || 'UNKNOWN', hint: _getErrorHint(err),
      });
      console.error('\n⛔ EMAIL SETUP PROBLEM:', err.message);
      console.error(_getErrorHint(err));
      console.error('Fix this before OTPs will be delivered.\n');
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
  const code = err.code || '';
  const msg  = err.message || '';
  if (code === 'EAUTH' || msg.includes('535') || msg.includes('Authentication')) {
    return (
      '\n💡 FIX: Gmail authentication failed.\n' +
      '   1. myaccount.google.com → Security → 2-Step Verification → App passwords\n' +
      '   2. Generate a new App Password → paste 16-char code (no spaces) in GMAIL_APP_PASSWORD'
    );
  }
  if (code === 'ECONNECTION' || code === 'ECONNREFUSED') return '\n💡 FIX: Cannot reach smtp.gmail.com. Check internet connection.';
  if (code === 'ETIMEDOUT') return '\n💡 FIX: Connection timed out. Network may be blocking port 587/465.';
  return '\n💡 See https://nodemailer.com/smtp/ for SMTP troubleshooting.';
};