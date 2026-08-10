class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    errorCode = null
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Factory shortcuts ────────────────────────────────────────────────────
  static badRequest(message = "Bad request", errors = [], code = "BAD_REQUEST") {
    return new ApiError(400, message, errors, code);
  }

  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
    return new ApiError(401, message, [], code);
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new ApiError(403, message, [], code);
  }

  static notFound(resource = "Resource", code = "NOT_FOUND") {
    return new ApiError(404, `${resource} not found`, [], code);
  }

  static conflict(message = "Conflict", code = "CONFLICT") {
    return new ApiError(409, message, [], code);
  }

  static tooManyRequests(message = "Too many requests", code = "RATE_LIMITED") {
    return new ApiError(429, message, [], code);
  }

  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new ApiError(500, message, [], code);
  }

  static serviceUnavailable(message = "Service unavailable", code = "SERVICE_UNAVAILABLE") {
    return new ApiError(503, message, [], code);
  }
}

export default ApiError;
