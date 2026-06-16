import express from 'express';
import { supabase } from '../config/supabase.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { validate, sanitizeInput } from '../utils/validation.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * POST /api/admin/auth/login
 * Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = validate(
      { email, password },
      {
        email: { required: true, email: true },
        password: { required: true }
      }
    );

    if (!validation.valid) {
      return validationErrorResponse(res, validation.errors);
    }

    // Find admin user
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', sanitizeInput(email))
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Generate tokens
    const tokenPayload = {
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin'
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase
      .from('refresh_tokens')
      .insert([{
        user_id: admin.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt.toISOString()
      }]);

    return successResponse(res, 200, 'Login successful', {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return errorResponse(res, 500, 'Login failed', error.message);
  }
});

/**
 * POST /api/admin/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return validationErrorResponse(res, ['Refresh token is required']);
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 401, 'Invalid refresh token');
    }

    // Verify refresh token exists in database
    const { data: tokenData, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('user_id', decoded.userId)
      .gt('expires_at', new Date().toISOString());

    if (error || !tokenData || tokenData.length === 0) {
      return errorResponse(res, 401, 'Refresh token expired or invalid');
    }

    // Generate new access token
    const tokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: 'admin'
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    return successResponse(res, 200, 'Token refreshed', {
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse(res, 500, 'Token refresh failed', error.message);
  }
});

/**
 * POST /api/admin/auth/logout
 * Admin logout
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;

    // Extract and verify access token
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (decoded && decoded.role === 'admin') {
        // Delete all refresh tokens for this user
        await supabase
          .from('refresh_tokens')
          .delete()
          .eq('user_id', decoded.userId);
      }
    }

    return successResponse(res, 200, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 500, 'Logout failed', error.message);
  }
});

/**
 * GET /api/admin/auth/me
 * Get current admin user
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return errorResponse(res, 401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 401, 'Invalid token');
    }

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, name, created_at')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return notFoundResponse(res, 'Admin user');
    }

    return successResponse(res, 200, 'Admin retrieved', admin);
  } catch (error) {
    console.error('Get admin error:', error);
    return errorResponse(res, 500, 'Failed to get admin', error.message);
  }
});

export default router;
