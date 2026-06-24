// ─────────────────────────────────────────────────────────────────────────────
// src/utils/cookie.util.js — Permanent FQDN & Versioned Path Synchronization
// ─────────────────────────────────────────────────────────────────────────────
import env from "../config/env.config.js";

const isProd = env.NODE_ENV === "production";

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge:   15 * 60 * 1000, // 15 min
    domain:   env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.trim() !== "" ? env.COOKIE_DOMAIN.trim() : undefined,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    domain:   env.REFRESH_TOKEN_COOKIE_DOMAIN && env.REFRESH_TOKEN_COOKIE_DOMAIN.trim() !== "" 
                ? env.REFRESH_TOKEN_COOKIE_DOMAIN.trim() 
                : (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.trim() !== "" ? env.COOKIE_DOMAIN.trim() : undefined),
    path:     "/api/v1/auth/refresh",
  });
};

export const clearAuthCookies = (res) => {
  const base = { 
    httpOnly: true, 
    secure: isProd,
    sameSite: isProd ? "strict" : "lax"
  };
  
  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.trim() !== "") {
    base.domain = env.COOKIE_DOMAIN.trim();
  }

  res.clearCookie("accessToken", base);
  res.clearCookie("refreshToken", { ...base, path: "/api/v1/auth/refresh" });
};