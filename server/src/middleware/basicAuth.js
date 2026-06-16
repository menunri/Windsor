/**
 * Basic Authentication Middleware for Admin Routes
 * 
 * This is an OBFUSCATION layer, not a replacement for JWT authentication.
 * It adds complexity for attackers by requiring additional credentials
 * before they can access admin resources.
 * 
 * Routes protected:
 * - /api/rooms/admin/* - admin room management
 * - /api/inquiries/admin/* - admin inquiry management
 * 
 * Routes EXCLUDED (public access):
 * - /api/admin/auth/* - login, logout, refresh (need to be accessible for login to work)
 * - /api/rooms - public room listings
 * - /api/inquiries - public inquiry submission
 */

const ADMIN_BASIC_USER = process.env.ADMIN_BASIC_USER || 'admin';
const ADMIN_BASIC_PASS = process.env.ADMIN_BASIC_PASS;

// Paths that require Basic Auth (but exclude auth routes)
// These are relative to where the router is mounted
// e.g., /api/rooms router mounted, and route is /admin/list, so req.path = /admin/list
const PROTECTED_PREFIX = '/admin';
// Paths that are never protected (auth endpoints need to be accessible for login)
const EXCLUDED_PREFIX = '/auth';

/**
 * Check if a path should be protected by Basic Auth
 * Uses req.path which is relative to the router mount point
 */
function isProtectedPath(path) {
  // Path must start with /admin but not /auth
  const startsWithAdmin = path.startsWith(PROTECTED_PREFIX);
  const startsWithAuth = path.startsWith(EXCLUDED_PREFIX);
  return startsWithAdmin && !startsWithAuth;
}

/**
 * Require Basic Auth for protected admin routes
 * Skips if ADMIN_BASIC_PASS is not configured (development mode)
 * Skips for excluded paths like /admin/auth/* (login needs to work)
 */
export function requireBasicAuth(req, res, next) {
  const path = req.path;
  
  // Development mode - skip if no password configured
  if (!ADMIN_BASIC_PASS) {
    console.warn('⚠️  WARNING: ADMIN_BASIC_PASS not set - Basic Auth is DISABLED');
    return next();
  }

  // Skip if path is not protected
  if (!isProtectedPath(path)) {
    return next();
  }

  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Windsor Admin"');
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Admin access requires authentication credentials'
    });
  }

  // Parse Basic Auth credentials
  const base64Credentials = authHeader.split(' ')[1];
  
  if (!base64Credentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Windsor Admin"');
    return res.status(401).json({ 
      error: 'Invalid authentication',
      message: 'Could not parse credentials'
    });
  }

  try {
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');

    // Validate credentials
    if (username === ADMIN_BASIC_USER && password === ADMIN_BASIC_PASS) {
      console.log(`✅ Basic Auth success for user: ${username}`);
      return next();
    }

    // Invalid credentials
    console.warn(`❌ Basic Auth failed for user: ${username}`);
    res.setHeader('WWW-Authenticate', 'Basic realm="Windsor Admin"');
    return res.status(401).json({ 
      error: 'Invalid credentials',
      message: 'Authentication failed'
    });
  } catch (error) {
    console.error('Basic Auth parse error:', error.message);
    res.setHeader('WWW-Authenticate', 'Basic realm="Windsor Admin"');
    return res.status(401).json({ 
      error: 'Authentication error',
      message: 'Failed to process authentication'
    });
  }
}

/**
 * Optional Basic Auth - attempts to validate if present, but doesn't require
 */
export function optionalBasicAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return next();
  }

  // If Basic Auth is present, validate it
  return requireBasicAuth(req, res, next);
}
