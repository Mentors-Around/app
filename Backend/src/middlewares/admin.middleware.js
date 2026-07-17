/**
 * admin.middleware.js
 *
 * Admin authorization layer.
 *
 * DESIGN DECISION:
 *   Admin role is set directly in the database by the platform owner
 *   (never via self-registration — the signup endpoint explicitly blocks it).
 *   Therefore, a single role check is the correct and sufficient gate:
 *     req.user.role === "admin"
 *
 *   The authenticate() middleware already validates the JWT, verifies the
 *   user exists, is active, and is not banned — so by the time we reach
 *   requireAdmin, the identity is fully verified.
 *
 * NOTE: authenticate middleware MUST run before this middleware.
 */

import ApiError from "../utils/ApiError.js";

export const requireAdmin = (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required", [], "AUTH_REQUIRED");
  }

  if (req.user.role !== "admin") {
    throw new ApiError(
      403,
      "Insufficient privileges",
      [],
      "ADMIN_REQUIRED"
    );
  }

  next();
};

/**
 * requireAdminOrSelf — for endpoints where a user may access their own
 * data but an admin can access anyone's (e.g. GET /users/:id/profile).
 */
export const requireAdminOrSelf = (paramKey = "userId") => (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required", [], "AUTH_REQUIRED");
  }

  const targetId = req.params[paramKey];
  const isSelf = req.user._id.toString() === targetId;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    throw new ApiError(403, "Access denied", [], "FORBIDDEN");
  }

  next();
};