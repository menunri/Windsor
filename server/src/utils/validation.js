/**
 * Simple validation utility
 * @param {Object} data - Data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validate(data, rules) {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const { required, minLength, maxLength, email, match } = rule;

    // Required check
    if (required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip further validation if field is empty and not required
    if (!value) continue;

    // String validations
    if (typeof value === 'string') {
      if (minLength && value.length < minLength) {
        errors.push(`${field} must be at least ${minLength} characters`);
      }
      if (maxLength && value.length > maxLength) {
        errors.push(`${field} must not exceed ${maxLength} characters`);
      }
      if (email && !isValidEmail(value)) {
        errors.push(`${field} must be a valid email address`);
      }
    }

    // Match validation (for comparing two fields like password confirmation)
    if (match && value !== data[match]) {
      errors.push(`${field} must match ${match}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input - remove potentially dangerous characters
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>'"]/g, '');
}

export default { validate, sanitizeInput };