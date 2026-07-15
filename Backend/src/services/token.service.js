import jwt from "jsonwebtoken";
import env from "../config/env.config.js";
import ApiError from "../utils/ApiError.js";

export const TokenService = {
  generateAccessToken(payload) {
    return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
      expiresIn: env.ACCESS_TOKEN_EXPIRY,
      algorithm: "HS256",
    });
  },

  generateRefreshToken(payload) {
    return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRY,
      algorithm: "HS256",
    });
  },

  /**
   * Generate both tokens for a user document.
   * Payload is minimal — only what's needed for auth checks.
   */
  generateTokenPair(user) {
    const payload = {
      _id:  user._id.toString(),
      role: user.role,
    };
    return {
      accessToken:  this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw ApiError.unauthorized("Access token expired. Please refresh.", "TOKEN_EXPIRED");
      }
      throw ApiError.unauthorized("Invalid access token.", "TOKEN_INVALID");
    }
  },

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw ApiError.unauthorized("Refresh token expired. Please login again.", "REFRESH_EXPIRED");
      }
      throw ApiError.unauthorized("Invalid refresh token.", "REFRESH_INVALID");
    }
  },

  getRefreshCookieOptions() {
    return {
      httpOnly: true,
      secure:   env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge:   7 * 24 * 60 * 60 * 1000,
      domain:   env.REFRESH_TOKEN_COOKIE_DOMAIN || env.COOKIE_DOMAIN || undefined,
      path:     "/",
    };
  },

  getAccessCookieOptions() {
    return {
      httpOnly: true,
      secure:   env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge:   15 * 60 * 1000,
      domain:   env.COOKIE_DOMAIN || undefined,
    };
  },
};
