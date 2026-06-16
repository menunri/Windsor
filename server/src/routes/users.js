import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { validate, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, avatar_url, created_at, updated_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return notFoundResponse(res, 'User');
    }

    return successResponse(res, 200, 'User profile retrieved', {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, 500, 'Failed to retrieve user profile', error.message);
  }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const updates = {};

    if (firstName !== undefined) {
      updates.first_name = sanitizeInput(firstName);
    }
    if (lastName !== undefined) {
      updates.last_name = sanitizeInput(lastName);
    }
    if (phone !== undefined) {
      updates.phone = sanitizeInput(phone);
    }

    if (Object.keys(updates).length === 0) {
      return validationErrorResponse(res, ['No fields to update']);
    }

    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.userId)
      .select('id, email, first_name, last_name, phone, avatar_url, created_at, updated_at')
      .single();

    if (error || !user) {
      return notFoundResponse(res, 'User');
    }

    return successResponse(res, 200, 'Profile updated successfully', {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, 500, 'Failed to update profile', error.message);
  }
});

/**
 * PUT /api/users/me/avatar
 * Update user avatar
 */
router.put('/me/avatar', async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return validationErrorResponse(res, ['Avatar URL is required']);
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        avatar_url: sanitizeInput(avatarUrl),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.userId)
      .select('id, avatar_url')
      .single();

    if (error || !user) {
      return notFoundResponse(res, 'User');
    }

    return successResponse(res, 200, 'Avatar updated successfully', {
      avatarUrl: user.avatar_url
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    return errorResponse(res, 500, 'Failed to update avatar', error.message);
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (public profile)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, avatar_url, created_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return notFoundResponse(res, 'User');
    }

    return successResponse(res, 200, 'User retrieved', {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      memberSince: user.created_at
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return errorResponse(res, 500, 'Failed to retrieve user', error.message);
  }
});

export default router;