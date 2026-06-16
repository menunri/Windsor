import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { sanitizeInput } from '../utils/validation.js';

const router = express.Router();

/**
 * POST /api/comments
 * Create a new comment on a post
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { postId, content } = req.body;

    if (!postId) {
      return validationErrorResponse(res, ['Post ID is required']);
    }

    if (!content || !content.trim()) {
      return validationErrorResponse(res, ['Content is required']);
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return notFoundResponse(res, 'Post');
    }

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: req.user.userId,
        content: sanitizeInput(content)
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:user_id (id, first_name, last_name, avatar_url)
      `)
      .single();

    if (commentError) throw commentError;

    return successResponse(res, 201, 'Comment added', {
      id: comment.id,
      content: comment.content,
      postId: postId,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: comment.user ? {
        id: comment.user.id,
        firstName: comment.user.first_name,
        lastName: comment.user.last_name,
        avatarUrl: comment.user.avatar_url
      } : null
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return errorResponse(res, 500, 'Failed to create comment', error.message);
  }
});

/**
 * PUT /api/comments/:id
 * Update a comment (owner only)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return validationErrorResponse(res, ['Content is required']);
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return notFoundResponse(res, 'Comment');
    }

    if (existing.user_id !== req.user.userId) {
      return errorResponse(res, 403, 'Not authorized to edit this comment');
    }

    const { data: comment, error: updateError } = await supabase
      .from('comments')
      .update({
        content: sanitizeInput(content),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:user_id (id, first_name, last_name, avatar_url)
      `)
      .single();

    if (updateError) throw updateError;

    return successResponse(res, 200, 'Comment updated', {
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: comment.user ? {
        id: comment.user.id,
        firstName: comment.user.first_name,
        lastName: comment.user.last_name,
        avatarUrl: comment.user.avatar_url
      } : null
    });
  } catch (error) {
    console.error('Update comment error:', error);
    return errorResponse(res, 500, 'Failed to update comment', error.message);
  }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment (owner only)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return notFoundResponse(res, 'Comment');
    }

    if (existing.user_id !== req.user.userId) {
      return errorResponse(res, 403, 'Not authorized to delete this comment');
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return successResponse(res, 200, 'Comment deleted');
  } catch (error) {
    console.error('Delete comment error:', error);
    return errorResponse(res, 500, 'Failed to delete comment', error.message);
  }
});

export default router;