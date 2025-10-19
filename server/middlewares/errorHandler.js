// utils/responses.js is used here for consistent API responses
import { fail } from "../utils/responses.js";

/**
 * Centralized Error Handling Middleware
 * This will catch any errors thrown from controllers/services
 */
export function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);

  // Default error details
  let statusCode = err.status || 500;
  let errorCode = err.code || "INTERNAL_ERROR";
  let message = err.message || "Something went wrong";

  // Common custom error mapping
  switch (err.message) {
    case "USER_NOT_FOUND":
      statusCode = 404;
      errorCode = "USER_NOT_FOUND";
      message = "User not found";
      break;

    case "INVALID_INPUT":
      statusCode = 400;
      errorCode = "INVALID_INPUT";
      message = "Invalid request data";
      break;

    case "UNAUTHORIZED":
      statusCode = 401;
      errorCode = "UNAUTHORIZED";
      message = "Authentication required";
      break;

    case "FORBIDDEN":
      statusCode = 403;
      errorCode = "FORBIDDEN";
      message = "You do not have permission";
      break;
  }

  res.status(statusCode).json(fail(errorCode, message));
}
