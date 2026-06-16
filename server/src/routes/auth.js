import express from 'express';
import { supabase } from '../config/supabase.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../middleware/auth.js';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '../utils/response.js';
import { validate, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const validation = validate(
      { email, password, firstName, lastName },
      {
        email: { required: true, isEmail: true },
        password: { required: true, minLength: 8 },
        firstName: { required: true, minLength: 2 },
        lastName: { required: true, minLength: 2 }
      }
    );

    if (!validation.valid) {
      return validationErrorResponse(res, validation.errors);
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return errorResponse(res, 409, 'Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: sanitizeInput(firstName),
        last_name: sanitizeInput(lastName),
        phone: phone || null,
        avatar_url: null
      }])
      .select()
      .single();

    if (error) throw error;

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Store refresh token
    await supabase
      .from('refresh_tokens')
      .insert([{
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }]);

    return successResponse(res, 201, 'Registration successful', {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(res, 500, 'Registration failed', error.message);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return validationErrorResponse(res, ['Email and password are required']);
    }

    // Find user
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);

    const user = users && users[0];

    if (!user) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Store refresh token
    await supabase
      .from('refresh_tokens')
      .insert([{
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }]);

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 500, 'Login failed', error.message);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return validationErrorResponse(res, ['Refresh token is required']);
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return unauthorizedResponse(res, 'Invalid refresh token');
    }

    // Check if token exists in database
    const { data: tokens } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .eq('user_id', decoded.userId)
      .gte('expires_at', new Date().toISOString())
      .limit(1);

    if (!tokens || tokens.length === 0) {
      return unauthorizedResponse(res, 'Refresh token expired or invalid');
    }

    // Get user
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .limit(1);

    const user = users && users[0];
    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });

    return successResponse(res, 200, 'Token refreshed', { accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return errorResponse(res, 500, 'Token refresh failed', error.message);
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      await supabase
        .from('refresh_tokens')
        .delete()
        .eq('token', refreshToken);
    }

    return successResponse(res, 200, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 500, 'Logout failed', error.message);
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return validationErrorResponse(res, ['Email is required']);
    }

    // Find user
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (!users || users.length === 0) {
      // Don't reveal if email exists
      return successResponse(res, 200, 'If email exists, reset instructions will be sent');
    }

    // Generate reset token (in production, send email with reset link)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await supabase
      .from('password_reset_tokens')
      .insert([{
        user_id: users[0].id,
        token: resetToken,
        expires_at: expiresAt
      }]);

    // In production, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return successResponse(res, 200, 'If email exists, reset instructions will be sent');
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 500, 'Password reset request failed', error.message);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return validationErrorResponse(res, ['Token and new password are required']);
    }

    if (newPassword.length < 8) {
      return validationErrorResponse(res, ['Password must be at least 8 characters']);
    }

    // Find valid reset token
    const { data: tokens } = await supabase
      .from('password_reset_tokens')
      .select('user_id')
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .limit(1);

    if (!tokens || tokens.length === 0) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', tokens[0].user_id);

    // Delete used reset token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token);

    // Invalidate all refresh tokens for this user
    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('user_id', tokens[0].user_id);

    return successResponse(res, 200, 'Password reset successful');
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 500, 'Password reset failed', error.message);
  }
});

export default router;