// ─────────────────────────────────────────────────────────────────────────────
// src/services/google.service.js
// Google OAuth2 token exchange and profile fetch.
// We handle OAuth manually (without passport) to keep deps minimal.
// ─────────────────────────────────────────────────────────────────────────────
import env from "../config/env.config.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.config.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export const GoogleService = {
  /**
   * Exchange a Google authorization code for tokens.
   * Returns { access_token, id_token, ... }.
   */
  async exchangeCode(code) {
    const params = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("Google token exchange failed", { status: res.status, body });
      throw ApiError.badRequest("Google authentication failed.", "GOOGLE_AUTH_FAILED");
    }

    return res.json();
  },

  /**
   * Fetch the user profile from Google using an access token.
   * Returns { sub, email, name, picture, email_verified }.
   */
  async getUserProfile(accessToken) {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw ApiError.badRequest("Failed to fetch Google profile.", "GOOGLE_PROFILE_FAILED");
    }

    const profile = await res.json();

    if (!profile.email_verified) {
      throw ApiError.badRequest("Google account email is not verified.", "GOOGLE_EMAIL_UNVERIFIED");
    }

    return profile;
  },

  /**
   * Full flow: code → tokens → profile.
   * Returns the Google profile.
   */
  async getProfileFromCode(code) {
    const tokens = await this.exchangeCode(code);
    const profile = await this.getUserProfile(tokens.access_token);
    return { profile, tokens };
  },

  /**
   * Build the Google OAuth consent URL to redirect users to.
   */
  buildAuthUrl(state = "") {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },
};
