import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { sanitizeInput } from '../utils/validation.js';

const router = express.Router();

/**
 * GET /api/messages/:threadId
 * Get messages for a thread
 */
router.get('/:threadId', authenticate, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Verify user has access to thread
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('id')
      .eq('id', threadId)
      .or(`sender_id.eq.${req.user.userId},recipient_id.eq.${req.user.userId}`)
      .single();

    if (threadError || !thread) {
      return notFoundResponse(res, 'Thread');
    }

    // Get messages with sender info
    const { data: messages, error: messagesError, count } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        is_read,
        created_at,
        sender:sender_id (id, first_name, last_name, avatar_url)
      `, { count: 'exact' })
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (messagesError) throw messagesError;

    return successResponse(res, 200, 'Messages retrieved', {
      messages: (messages || []).reverse().map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        senderName: msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Unknown',
        senderAvatar: msg.sender?.avatar_url,
        isRead: msg.is_read,
        createdAt: msg.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return errorResponse(res, 500, 'Failed to retrieve messages', error.message);
  }
});

/**
 * POST /api/messages
 * Send a new message
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { threadId, content } = req.body;

    if (!threadId || !content) {
      return validationErrorResponse(res, ['Thread ID and content are required']);
    }

    // Verify user has access to thread
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('id')
      .eq('id', threadId)
      .or(`sender_id.eq.${req.user.userId},recipient_id.eq.${req.user.userId}`)
      .single();

    if (threadError || !thread) {
      return notFoundResponse(res, 'Thread');
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: req.user.userId,
        content: sanitizeInput(content)
      })
      .select(`
        id,
        content,
        sender_id,
        is_read,
        created_at,
        sender:sender_id (id, first_name, last_name, avatar_url)
      `)
      .single();

    if (messageError) throw messageError;

    return successResponse(res, 201, 'Message sent', {
      id: message.id,
      content: message.content,
      senderId: message.sender_id,
      senderName: message.sender ? `${message.sender.first_name} ${message.sender.last_name}` : 'Unknown',
      senderAvatar: message.sender?.avatar_url,
      isRead: message.is_read,
      createdAt: message.created_at
    });
  } catch (error) {
    console.error('Send message error:', error);
    return errorResponse(res, 500, 'Failed to send message', error.message);
  }
});

/**
 * PUT /api/messages/:id/read
 * Mark a message as read
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify message exists and user has access to its thread
    const { data: message } = await supabase
      .from('messages')
      .select('thread_id, sender_id')
      .eq('id', id)
      .single();

    if (!message) {
      return notFoundResponse(res, 'Message');
    }

    // Check user has access to thread
    const { data: thread } = await supabase
      .from('threads')
      .select('id')
      .eq('id', message.thread_id)
      .or(`sender_id.eq.${req.user.userId},recipient_id.eq.${req.user.userId}`)
      .single();

    if (!thread) {
      return notFoundResponse(res, 'Message');
    }

    // Mark as read
    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id);

    if (updateError) throw updateError;

    return successResponse(res, 200, 'Message marked as read');
  } catch (error) {
    console.error('Mark read error:', error);
    return errorResponse(res, 500, 'Failed to mark message as read', error.message);
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify message exists and belongs to user
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('id, sender_id')
      .eq('id', id)
      .single();

    if (fetchError || !message) {
      return notFoundResponse(res, 'Message');
    }

    if (message.sender_id !== req.user.userId) {
      return errorResponse(res, 403, 'Not authorized to delete this message');
    }

    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return successResponse(res, 200, 'Message deleted');
  } catch (error) {
    console.error('Delete message error:', error);
    return errorResponse(res, 500, 'Failed to delete message', error.message);
  }
});

export default router;