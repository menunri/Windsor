/**
 * API Response wrapper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data
 */
export function successResponse(res, statusCode = 200, message = 'Success', data = null) {
  const response = { success: true, message };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
}

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} details - Additional error details (optional)
 */
export function errorResponse(res, statusCode = 500, message = 'Error', details = null) {
  const response = { success: false, error: message };
  if (details) {
    response.details = details;
  }
  return res.status(statusCode).json(response);
}

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation error array
 */
export function validationErrorResponse(res, errors) {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: errors
  });
}

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name that wasn't found
 */
export function notFoundResponse(res, resource = 'Resource') {
  return res.status(404).json({
    success: false,
    error: `${resource} not found`
  });
}

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export function unauthorizedResponse(res, message = 'Unauthorized') {
  return res.status(401).json({
    success: false,
    error: message
  });
}

export default {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse
};