import env from "../config/env.config.js";
import logger from "../config/logger.config.js";

// ── Provider implementations ──────────────────────────────────────────────────

const providers = {
  async msg91(phone, message) {
    if (!env.MSG91_API_KEY || !env.MSG91_TEMPLATE_ID) {
      throw new Error("MSG91 credentials not configured");
    }
    const normalised = phone.startsWith("+") ? phone.slice(1) : phone;
    const response = await fetch(
      `https://api.msg91.com/api/v5/otp?template_id=${env.MSG91_TEMPLATE_ID}&mobile=${normalised}`,
      {
        method: "POST",
        headers: {
          authkey: env.MSG91_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      }
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`MSG91 error ${response.status}: ${body}`);
    }
    return response.json();
  },

  async fast2sms(phone, message) {
    if (!env.FAST2SMS_API_KEY) throw new Error("FAST2SMS_API_KEY not configured");
    const mobile = phone.replace(/^\+?91/, "");
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ route: "q", message, numbers: mobile }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Fast2SMS error ${response.status}: ${body}`);
    }
    return response.json();
  },

  async twilio(phone, message) {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio credentials not configured");
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
    const credentials = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
    const body = new URLSearchParams({ From: env.TWILIO_PHONE_NUMBER, To: phone, Body: message });

    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Twilio error ${data.status}: ${data.message}`);
    }
    return response.json();
  },

  async mock(phone, message) {
    console.log(`\n========================================\n[PHONE OTP VERIFICATION] To: ${phone}\n${message}\n========================================\n`);
    logger.info("[SMS MOCK]", {
      phone,
      message,
    });
    return { success: true, mock: true };
  },
};

// ── Public service ────────────────────────────────────────────────────────────

export const SmsService = {
  async send(phone, message) {
    const provider = env.SMS_PROVIDER || "mock";
    const handler = providers[provider];
    if (!handler) {
      logger.error("Unknown SMS provider", { provider });
      return null;
    }
    try {
      const result = await handler(phone, message);
      logger.info("SMS sent", { provider, to: phone.slice(-4) });
      return result;
    } catch (err) {
      logger.error("SMS delivery failed", { provider, to: phone.slice(-4), error: err.message });
      return null;
    }
  },

  async sendOtp(phone, otp, expiryMinutes = 10) {
    const message = `Your TrueEd OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share this with anyone.`;
    return this.send(phone, message);
  },
};
