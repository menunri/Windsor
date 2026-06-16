import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { sanitizeInput } from '../utils/validation.js';

const router = express.Router();

/**
 * GET /api/posts
 * Get all posts with author info and comment counts
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get posts with author info and comment count
    const { data: posts, error: postsError, count } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:user_id (id, first_name, last_name, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (postsError) throw postsError;

    // Get comment counts for each post
    const postsWithCounts = await Promise.all((posts || []).map(async (post) => {
      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      return {
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: post.user ? {
          id: post.user.id,
          firstName: post.user.first_name,
          lastName: post.user.last_name,
          avatarUrl: post.user.avatar_url
        } : null,
        commentCount: commentCount || 0
      };
    }));

    return successResponse(res, 200, 'Posts retrieved', {
      posts: postsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return errorResponse(res, 500, 'Failed to retrieve posts', error.message);
  }
});

/**
 * GET /api/posts/:id
 * Get single post with comments
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get post with author info
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:user_id (id, first_name, last_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (postError || !post) {
      return notFoundResponse(res, 'Post');
    }

    // Get comments for this post
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:user_id (id, first_name, last_name, avatar_url)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    return successResponse(res, 200, 'Post retrieved', {
      id: post.id,
      content: post.content,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.user ? {
        id: post.user.id,
        firstName: post.user.first_name,
        lastName: post.user.last_name,
        avatarUrl: post.user.avatar_url
      } : null,
      comments: (comments || []).map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        author: c.user ? {
          id: c.user.id,
          firstName: c.user.first_name,
          lastName: c.user.last_name,
          avatarUrl: c.user.avatar_url
        } : null
      }))
    });
  } catch (error) {
    console.error('Get post error:', error);
    return errorResponse(res, 500, 'Failed to retrieve post', error.message);
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return validationErrorResponse(res, ['Content is required']);
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
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

    if (postError) throw postError;

    return successResponse(res, 201, 'Post created', {
      id: post.id,
      content: post.content,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.user ? {
        id: post.user.id,
        firstName: post.user.first_name,
        lastName: post.user.last_name,
        avatarUrl: post.user.avatar_url
      } : null
    });
  } catch (error) {
    console.error('Create post error:', error);
    return errorResponse(res, 500, 'Failed to create post', error.message);
  }
});

/**
 * PUT /api/posts/:id
 * Update a post (owner only)
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
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return notFoundResponse(res, 'Post');
    }

    if (existing.user_id !== req.user.userId) {
      return errorResponse(res, 403, 'Not authorized to edit this post');
    }

    const { data: post, error: updateError } = await supabase
      .from('posts')
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

    return successResponse(res, 200, 'Post updated', {
      id: post.id,
      content: post.content,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.user ? {
        id: post.user.id,
        firstName: post.user.first_name,
        lastName: post.user.last_name,
        avatarUrl: post.user.avatar_url
      } : null
    });
  } catch (error) {
    console.error('Update post error:', error);
    return errorResponse(res, 500, 'Failed to update post', error.message);
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post (owner only)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return notFoundResponse(res, 'Post');
    }

    if (existing.user_id !== req.user.userId) {
      return errorResponse(res, 403, 'Not authorized to delete this post');
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return successResponse(res, 200, 'Post deleted');
  } catch (error) {
    console.error('Delete post error:', error);
    return errorResponse(res, 500, 'Failed to delete post', error.message);
  }
});

export default router;