import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { sanitizeInput } from '../utils/validation.js';

const router = express.Router();

/**
 * GET /api/threads
 * Get user's message threads
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // Get threads where user is sender or recipient
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('*')
      .or(`sender_id.eq.${req.user.userId},recipient_id.eq.${req.user.userId}`)
      .order('created_at', { ascending: false });

    if (threadsError) throw threadsError;

    // For each thread, get participant info, room title, and message data
    const threadsWithDetails = await Promise.all(threads.map(async (thread) => {
      // Determine participant ID
      const participantId = thread.sender_id === req.user.userId ? thread.recipient_id : thread.sender_id;

      // Get participant user info
      const { data: participant } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', participantId)
        .single();

      // Get room title if room_id exists
      let roomTitle = null;
      if (thread.room_id) {
        const { data: room } = await supabase
          .from('rooms')
          .select('title')
          .eq('id', thread.room_id)
          .single();
        roomTitle = room?.title;
      }

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', thread.id)
        .neq('sender_id', req.user.userId)
        .eq('is_read', false);

      // Get last message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: thread.id,
        roomId: thread.room_id,
        roomTitle,
        participant: participant ? {
          id: participant.id,
          firstName: participant.first_name,
          lastName: participant.last_name,
          avatarUrl: participant.avatar_url
        } : null,
        unreadCount: unreadCount || 0,
        lastMessage: lastMsg?.content,
        lastMessageAt: lastMsg?.created_at,
        createdAt: thread.created_at
      };
    }));

    return successResponse(res, 200, 'Threads retrieved', { threads: threadsWithDetails });
  } catch (error) {
    console.error('Get threads error:', error);
    return errorResponse(res, 500, 'Failed to retrieve threads', error.message);
  }
});

/**
 * GET /api/threads/:id
 * Get single thread with messages
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get thread
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('*')
      .eq('id', id)
      .or(`sender_id.eq.${req.user.userId},recipient_id.eq.${req.user.userId}`)
      .single();

    if (threadError || !thread) {
      return notFoundResponse(res, 'Thread');
    }

    // Get participant user info
    const participantId = thread.sender_id === req.user.userId ? thread.recipient_id : thread.sender_id;
    const { data: participant } = await supabase
      .from('users')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', participantId)
      .single();

    // Get room title if room_id exists
    let roomTitle = null;
    if (thread.room_id) {
      const { data: room } = await supabase
        .from('rooms')
        .select('title')
        .eq('id', thread.room_id)
        .single();
      roomTitle = room?.title;
    }

    // Get messages with sender info
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        is_read,
        created_at,
        sender:sender_id (id, first_name, last_name, avatar_url)
      `)
      .eq('thread_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (messagesError) throw messagesError;

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('thread_id', id)
      .neq('sender_id', req.user.userId);

    return successResponse(res, 200, 'Thread retrieved', {
      id: thread.id,
      roomId: thread.room_id,
      roomTitle,
      participant: participant ? {
        id: participant.id,
        firstName: participant.first_name,
        lastName: participant.last_name,
        avatarUrl: participant.avatar_url
      } : null,
      createdAt: thread.created_at,
      messages: (messages || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        senderName: msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Unknown',
        senderAvatar: msg.sender?.avatar_url,
        isRead: msg.is_read,
        createdAt: msg.created_at
      }))
    });
  } catch (error) {
    console.error('Get thread error:', error);
    return errorResponse(res, 500, 'Failed to retrieve thread', error.message);
  }
});

/**
 * POST /api/threads
 * Create a new thread
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { recipientId, roomId, initialMessage } = req.body;

    if (!recipientId || !initialMessage) {
      return validationErrorResponse(res, ['Recipient and message are required']);
    }

    // Check for existing thread
    const { data: existing } = await supabase
      .from('threads')
      .select('id')
      .eq('room_id', roomId || null)
      .or(`and(sender_id.eq.${req.user.userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${req.user.userId})`)
      .single();

    let threadId;

    if (existing) {
      threadId = existing.id;
    } else {
      // Create new thread
      const { data: newThread, error: threadError } = await supabase
        .from('threads')
        .insert({
          sender_id: req.user.userId,
          recipient_id: recipientId,
          room_id: roomId || null
        })
        .select('id')
        .single();

      if (threadError) throw threadError;
      threadId = newThread.id;
    }

    // Add initial message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: req.user.userId,
        content: sanitizeInput(initialMessage)
      })
      .select('id, content, sender_id, created_at')
      .single();

    if (messageError) throw messageError;

    return successResponse(res, 201, 'Thread created successfully', {
      threadId,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.sender_id,
        createdAt: message.created_at
      }
    });
  } catch (error) {
    console.error('Create thread error:', error);
    return errorResponse(res, 500, 'Failed to create thread', error.message);
  }
});

/**
 * PUT /api/threads/:id/read
 * Mark all messages in thread as read
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('thread_id', id)
      .neq('sender_id', req.user.userId);

    if (updateError) throw updateError;

    return successResponse(res, 200, 'Messages marked as read');
  } catch (error) {
    console.error('Mark read error:', error);
    return errorResponse(res, 500, 'Failed to mark messages as read', error.message);
  }
});

export default router;