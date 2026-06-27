// ─────────────────────────────────────────────────────────────────────────────
// src/services/whatsapp.service.js
// Meta WhatsApp Cloud API — OTP delivery.
// Free tier: first 1,000 user-initiated conversations/month at no cost.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// ─────────────────────────────────────────────────────────────────────────────
import env    from '../config/env.config.js';
import logger from '../config/logger.config.js';

const META_API_VERSION = 'v20.0';
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// ── Internal sender ───────────────────────────────────────────────────────────
const _send = async (payload) => {
  if (!env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_TOKEN) {
    throw new Error('WhatsApp not configured: WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_TOKEN are required');
  }

  const url = `${BASE_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify(payload),
    // Hard timeout — Meta API should respond in <3s
    signal: AbortSignal.timeout(8000),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message || JSON.stringify(data);
    throw new Error(`Meta API error ${response.status}: ${errMsg}`);
  }

  return data;
};

// ── Phone normaliser ──────────────────────────────────────────────────────────
// Meta requires E.164 format WITHOUT the leading +
// e.g. +919876543210 → 919876543210
const normaliseForMeta = (phone) => phone.replace(/^\+/, '');

// ── Public service ────────────────────────────────────────────────────────────
export const WhatsAppService = {
  /**
   * Send an OTP via WhatsApp using a pre-approved Meta message template.
   *
   * IMPORTANT — you MUST create and get approval for an OTP template in
   * Meta Business Manager before this works. The template name and component
   * structure below match Meta's default "otp" utility template.
   *
   * Template name: use your approved template name (e.g. "trueed_otp")
   * It must have one body variable: {{1}} → the OTP code
   *
   * @param {string} phone    - E.164 format e.g. +919876543210
   * @param {string} otp      - 6-digit OTP string
   * @param {number} expiryMinutes
   */
  async sendOtp(phone, otp, expiryMinutes = 10) {
    const to           = normaliseForMeta(phone);
    const templateName = env.WHATSAPP_OTP_TEMPLATE || 'trueed_otp';
    const languageCode = env.WHATSAPP_TEMPLATE_LANG || 'en';

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name:     templateName,
        language: { code: languageCode },
        components: [
          {
            // BODY component — passes the OTP as {{1}}
            type:       'body',
            parameters: [
              { type: 'text', text: otp },
            ],
          },
          {
            // BUTTON component — Meta's OTP template has a "Copy Code" button
            // Remove this block if your template has no button
            type:    'button',
            sub_type: 'url',
            index:   '0',
            parameters: [
              { type: 'text', text: otp },
            ],
          },
        ],
      },
    };

    try {
      const result = await _send(payload);
      logger.info('WhatsApp OTP sent', {
        to:       `****${phone.slice(-4)}`,
        template: templateName,
        messageId: result?.messages?.[0]?.id,
      });
      return result;
    } catch (err) {
      logger.error('WhatsApp OTP delivery failed', {
        to:    `****${phone.slice(-4)}`,
        error: err.message,
      });
      // Never throw — caller decides whether to fall back
      return null;
    }
  },

  /**
   * Send a free-form text message (only works within 24h of user messaging you first).
   * Useful for notifications once the user has initiated contact.
   */
  async sendText(phone, message) {
    const to = normaliseForMeta(phone);
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    };

    try {
      const result = await _send(payload);
      logger.info('WhatsApp text sent', { to: `****${phone.slice(-4)}` });
      return result;
    } catch (err) {
      logger.error('WhatsApp text failed', { to: `****${phone.slice(-4)}`, error: err.message });
      return null;
    }
  },

  /**
   * Verify a WhatsApp webhook challenge (GET request from Meta during setup).
   * Mount this at your webhook route for verification.
   */
  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  },

  /**
   * Parse an incoming WhatsApp webhook event (POST from Meta).
   * Returns null for non-message events (status updates, etc.).
   */
  parseIncomingMessage(body) {
    try {
      const entry   = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value   = changes?.value;
      const message = value?.messages?.[0];
      if (!message) return null;
      return {
        from:      message.from,
        messageId: message.id,
        type:      message.type,
        text:      message.text?.body || null,
        timestamp: message.timestamp,
      };
    } catch {
      return null;
    }
  },
};