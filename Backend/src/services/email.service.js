// ─────────────────────────────────────────────────────────────────────────────
// src/services/email.service.js
// Nodemailer-based transactional email service.
// Supports: Gmail App Password | SMTP | mock (Ethereal dev preview)
// ─────────────────────────────────────────────────────────────────────────────
import nodemailer from 'nodemailer';
import env        from '../config/env.config.js';
import logger     from '../config/logger.config.js';

// ── Transport factory (lazy-initialised once per process) ─────────────────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  if (env.EMAIL_PROVIDER === 'mock') {
    // Ethereal catches all mail — nothing reaches a real inbox.
    // The preview URL is logged so you can read emails in the browser.
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: env.ETHEREAL_USER || 'test@ethereal.email',
        pass: env.ETHEREAL_PASS || 'testpass',
      },
    });
    logger.info('[Email] Using Ethereal mock transport — no real emails will be sent');
    return _transporter;
  }

  if (env.EMAIL_PROVIDER === 'gmail') {
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
      // Throw hard at startup — misconfigured credentials should fail loudly, not silently.
      throw new Error(
        'EMAIL_PROVIDER=gmail requires GMAIL_USER and GMAIL_APP_PASSWORD in .env\n' +
        'Generate an App Password at: https://myaccount.google.com → Security → App passwords',
      );
    }
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,   // 16-char App Password, NOT your real Gmail password
      },
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

  throw new Error(
    `Unknown EMAIL_PROVIDER="${env.EMAIL_PROVIDER}". Valid values: gmail | smtp | mock`,
  );
};

// ── HTML OTP template ──────────────────────────────────────────────────────────
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
          <tr>
            <td style="background:#4F46E5;padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">TrueEd</h1>
              <p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">Your Learning Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">Hi there,</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Use the code below to ${purposeLabel}. It expires in
                <strong>${expiryMinutes} minutes</strong>.
              </p>
              <div style="text-align:center;margin:0 0 28px;">
                <span style="display:inline-block;background:#F3F4F6;border:2px dashed #4F46E5;
                             border-radius:8px;padding:18px 40px;font-size:36px;font-weight:700;
                             color:#4F46E5;letter-spacing:10px;font-family:monospace;">
                  ${otp}
                </span>
              </div>
              <p style="margin:0 0 8px;color:#6B7280;font-size:13px;line-height:1.5;">
                🔒 <strong>Never share this code</strong> — TrueEd will never ask for it.
              </p>
              <p style="margin:0;color:#6B7280;font-size:13px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;">
                © ${new Date().getFullYear()} TrueEd · Automated message, do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
};

// ── Public API ────────────────────────────────────────────────────────────────
export const EmailService = {

  /**
   * Low-level send.
   *
   * In PRODUCTION: never throws — logs the error and returns null so a failed
   * email never crashes the OTP flow.
   *
   * In DEVELOPMENT: throws the raw error so it surfaces in the API response
   * and your terminal, making misconfigured credentials immediately obvious.
   *
   * Returns: nodemailer info object on success, null on failure (prod only).
   */
  async send({ to, subject, html, text }) {
    if (!to || !subject || !html) {
      logger.error('[Email] send() called with missing fields', { to, subject });
      return null;
    }

    // Skip placeholder addresses created by the Google OAuth placeholder flow
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
        to:        _maskEmail(to),
        subject,
        messageId: info.messageId,
      });
      return info;

    } catch (err) {
      // ── Structured error log with actionable details ──────────────────────
      logger.error('[Email] ❌ DELIVERY FAILED', {
        to:         _maskEmail(to),
        subject,
        provider:   env.EMAIL_PROVIDER,
        errorCode:  err.code         || 'UNKNOWN',
        errorMsg:   err.message,
        gmailUser:  env.GMAIL_USER   || '(not set)',
        hasAppPass: !!env.GMAIL_APP_PASSWORD,
        // Common Gmail errors and what they mean:
        // EAUTH      → Wrong App Password, or 2FA not enabled on the Gmail account
        // ECONNECTION → Gmail SMTP unreachable (check firewall / internet)
        // ETIMEDOUT  → Network timeout reaching smtp.gmail.com:465/587
      });

      // In development: throw so it's visible in the API response and terminal.
      // In production: return null — don't crash the OTP flow over email failure.
      if (env.NODE_ENV === 'development') {
        const hint = _getErrorHint(err);
        throw new Error(`[Email] Gmail delivery failed: ${err.message}${hint}`);
      }

      return null;
    }
  },

  /**
   * Send an OTP email.
   */
  async sendOtp(to, otp, expiryMinutes = 10, purpose = 'login') {
    const subjectMap = {
      register:     'Verify your TrueEd account',
      login:        'Your TrueEd login code',
      reset:        'Reset your TrueEd password',
      phone_change: 'TrueEd — verify phone change',
      email_verify: 'Verify your TrueEd email',
    };

    const subject = subjectMap[purpose] || 'Your TrueEd OTP';
    const html    = buildOtpHtml(otp, expiryMinutes, purpose);
    const text    = `Your TrueEd OTP: ${otp}\nValid for ${expiryMinutes} minutes. Never share this.`;

    return this.send({ to, subject, html, text });
  },

  /**
   * Verify transporter connection.
   * Call at app startup to catch misconfigured credentials immediately.
   * Returns true on success, false on failure (never throws).
   */
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
        error:     err.message,
        errorCode: err.code || 'UNKNOWN',
        hint:      _getErrorHint(err),
      });
      // Print prominently to terminal since this affects all OTP delivery
      console.error('\n⛔ EMAIL SETUP PROBLEM:', err.message);
      console.error(_getErrorHint(err));
      console.error('Fix this before OTPs will be delivered.\n');
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

const _getErrorHint = (err) => {
  const code = err.code || '';
  const msg  = err.message || '';

  if (code === 'EAUTH' || msg.includes('535') || msg.includes('Authentication')) {
    return (
      '\n💡 FIX: Gmail authentication failed. Steps to resolve:\n' +
      '   1. Go to https://myaccount.google.com → Security\n' +
      '   2. Make sure "2-Step Verification" is ON\n' +
      '   3. Under 2-Step Verification → scroll down → "App passwords"\n' +
      '   4. Generate a new App Password → select Mail + Other\n' +
      '   5. Paste the 16-character code (no spaces) into GMAIL_APP_PASSWORD in .env\n' +
      '   6. Restart the server'
    );
  }
  if (code === 'ECONNECTION' || code === 'ECONNREFUSED') {
    return '\n💡 FIX: Cannot connect to smtp.gmail.com. Check your internet connection.';
  }
  if (code === 'ETIMEDOUT') {
    return '\n💡 FIX: Connection timed out. Your network may be blocking port 587/465.';
  }
  return '\n💡 See https://nodemailer.com/smtp/ for SMTP troubleshooting.';
};