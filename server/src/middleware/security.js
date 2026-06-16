import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Security headers via Helmet
export const securityHeaders = helmet();

// CORS configuration - restrict to allowed origins only
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      process.env.CLIENT_URL
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or curl)
    // In production, you might want to be more strict
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true
};

// Rate limiter for login endpoint - 5 attempts per minute
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute per IP
  message: { error: 'Too many login attempts. Please try again after a minute.' },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Skip successful logins from rate limit count
  skipSuccessfulRequests: false
});

// Rate limiter for general API - 100 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Only 10 requests per minute for sensitive operations
  message: { error: 'Rate limit exceeded. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
