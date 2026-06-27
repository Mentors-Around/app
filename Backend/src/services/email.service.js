// ─────────────────────────────────────────────────────────────────────────────
// src/services/email.service.js
// Nodemailer-based transactional email service.
// Supports: Gmail OAuth2 (production) + SMTP (staging) + mock (dev/test)
// ─────────────────────────────────────────────────────────────────────────────
import nodemailer from 'nodemailer';
import env        from '../config/env.config.js';
import logger     from '../config/logger.config.js';

// ── Transport factory (lazy-initialised once) ─────────────────────────────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  if (env.EMAIL_PROVIDER === 'mock' || env.NODE_ENV === 'test') {
    // Ethereal catches all mail — nothing reaches a real inbox
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: env.ETHEREAL_USER || 'test@ethereal.email',
        pass: env.ETHEREAL_PASS || 'testpass',
      },
    });
    return _transporter;
  }

  if (env.EMAIL_PROVIDER === 'gmail') {
    // Gmail via app password (simpler than OAuth2, still secure for MVP)
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
      throw new Error('EMAIL_PROVIDER=gmail requires GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    }
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD, // 16-char app password, NOT your Gmail password
      },
    });
    return _transporter;
  }

  if (env.EMAIL_PROVIDER === 'smtp') {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      throw new Error('EMAIL_PROVIDER=smtp requires SMTP_HOST, SMTP_USER and SMTP_PASS');
    }
    _transporter = nodemailer.createTransport({
      host:   env.SMTP_HOST,
      port:   Number(env.SMTP_PORT) || 587,
      secure: Number(env.SMTP_PORT) === 465, // true only for port 465
      auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
      tls:    { rejectUnauthorized: env.NODE_ENV === 'production' },
    });
    return _transporter;
  }

  throw new Error(`Unknown EMAIL_PROVIDER: ${env.EMAIL_PROVIDER}. Use gmail | smtp | mock`);
};

// ── HTML template builder ──────────────────────────────────────────────────────
const buildOtpHtml = (otp, expiryMinutes, purpose) => {
  const purposeLabel = purpose === 'register' ? 'verify your email' : 'log in to your account';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TrueEd OTP</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#4F46E5;padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;
                         letter-spacing:-0.5px;">TrueEd</h1>
              <p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">
                Your Learning Platform
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Hi there,
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Use the code below to ${purposeLabel}. This code expires in
                <strong>${expiryMinutes} minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="text-align:center;margin:0 0 28px;">
                <span style="display:inline-block;background:#F3F4F6;border:2px dashed #4F46E5;
                             border-radius:8px;padding:18px 40px;font-size:36px;font-weight:700;
                             color:#4F46E5;letter-spacing:10px;font-family:monospace;">
                  ${otp}
                </span>
              </div>
              <p style="margin:0 0 8px;color:#6B7280;font-size:13px;line-height:1.5;">
                🔒 <strong>Never share this code</strong> with anyone — TrueEd will never ask for it.
              </p>
              <p style="margin:0;color:#6B7280;font-size:13px;line-height:1.5;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;">
                © ${new Date().getFullYear()} TrueEd · This is an automated message, do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// ── Public service ────────────────────────────────────────────────────────────
export const EmailService = {
  /**
   * Low-level send. Never throws to callers — logs error and returns null.
   */
  async send({ to, subject, html, text }) {
    if (!to || !subject || !html) {
      logger.error('EmailService.send: missing required fields', { to, subject });
      return null;
    }

    // Security: never send to placeholder addresses generated by Google OAuth flow
    if (to.startsWith('google_')) {
      logger.warn('EmailService: skipping placeholder google email', { to });
      return null;
    }

    const from = env.EMAIL_FROM || `"TrueEd" <${env.GMAIL_USER || env.SMTP_USER || 'noreply@trueed.in'}>`;

    try {
      const transport = getTransporter();
      const info = await transport.sendMail({ from, to, subject, html, text });

      if (env.EMAIL_PROVIDER === 'mock') {
        // In mock mode, log the Ethereal preview URL so you can see the email
        logger.debug('[EMAIL MOCK] Preview:', { url: nodemailer.getTestMessageUrl(info) });
      }

      logger.info('Email sent', { to: _maskEmail(to), subject, messageId: info.messageId });
      return info;
    } catch (err) {
      logger.error('Email delivery failed', { to: _maskEmail(to), error: err.message });
      return null;
    }
  },

  /**
   * Send an OTP email. Used for both signup verification and login.
   */
  async sendOtp(to, otp, expiryMinutes = 10, purpose = 'login') {
    const subjectMap = {
      register:     'Verify your TrueEd account',
      login:        'Your TrueEd login code',
      reset:        'Reset your TrueEd password',
      phone_change: 'TrueEd — verify email change',
      email_verify: 'Verify your TrueEd email',
    };

    const subject = subjectMap[purpose] || 'Your TrueEd OTP';
    const html    = buildOtpHtml(otp, expiryMinutes, purpose);
    const text    = `Your TrueEd OTP is: ${otp}\nValid for ${expiryMinutes} minutes.\nDo not share this with anyone.`;

    return this.send({ to, subject, html, text });
  },

  /**
   * Verify the transporter connection on startup.
   * Call this from your app boot sequence (optional but good practice).
   */
  async verifyConnection() {
    if (env.EMAIL_PROVIDER === 'mock') return true;
    try {
      const transport = getTransporter();
      await transport.verify();
      logger.info('Email transporter verified successfully');
      return true;
    } catch (err) {
      logger.error('Email transporter verification failed', { error: err.message });
      return false;
    }
  },
};

// ── Internal helpers ──────────────────────────────────────────────────────────
const _maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};