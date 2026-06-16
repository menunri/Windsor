import express from 'express';
import { supabase, query } from '../config/supabase.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { validate, sanitizeInput } from '../utils/validation.js';
import { sendInquiryNotificationToAdmin, sendReplyNotificationToInquirer } from '../utils/email.js';

const router = express.Router();

/**
 * POST /api/inquiries
 * Submit a new inquiry (public - no auth required)
 */
router.post('/', async (req, res) => {
  try {
    const { roomId, inquirerName, inquirerEmail, inquirerPhone, message } = req.body;

    const validation = validate(
      { inquirerName, inquirerEmail, message },
      {
        inquirerName: { required: true, minLength: 2, maxLength: 100 },
        inquirerEmail: { required: true, email: true },
        message: { required: true, minLength: 10 }
      }
    );

    if (!validation.valid) {
      return validationErrorResponse(res, validation.errors);
    }

    const inquiryData = {
      room_id: roomId || null,
      inquirer_name: sanitizeInput(inquirerName),
      inquirer_email: sanitizeInput(inquirerEmail),
      inquirer_phone: inquirerPhone ? sanitizeInput(inquirerPhone) : null,
      message: sanitizeInput(message),
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('inquiries')
      .insert([inquiryData])
      .select()
      .single();

    if (error) throw error;

    // Send email notification to admin (async - don't block response)
    sendInquiryNotificationToAdmin({
      inquirerName,
      inquirerEmail,
      inquirerPhone,
      message,
      roomId
    }).catch(err => console.error('Failed to send inquiry notification:', err.message));

    return successResponse(res, 201, 'Inquiry submitted successfully', formatInquiry(data));
  } catch (error) {
    console.error('Create inquiry error:', error);
    return errorResponse(res, 500, 'Failed to submit inquiry', error.message);
  }
});

/**
 * GET /api/inquiries/:id
 * Get inquiry status by ID (public - uses email for verification)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!email) {
      return validationErrorResponse(res, ['Email is required for verification']);
    }

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .select(`
        id,
        status,
        inquirer_name,
        inquirer_email,
        message,
        room_id,
        created_at,
        inquiry_replies (
          id,
          message,
          created_at
        )
      `)
      .eq('id', id)
      .eq('inquirer_email', sanitizeInput(email))
      .single();

    if (error || !inquiry) {
      return notFoundResponse(res, 'Inquiry');
    }

    return successResponse(res, 200, 'Inquiry retrieved', formatInquiryWithReplies(inquiry));
  } catch (error) {
    console.error('Get inquiry error:', error);
    return errorResponse(res, 500, 'Failed to retrieve inquiry', error.message);
  }
});

/**
 * ADMIN ROUTES - Require authentication
 */

/**
 * GET /api/admin/inquiries
 * Get all inquiries (admin only)
 */
router.get('/admin/list', authenticate, async (req, res) => {
  try {
    // Only allow admin role
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { 
      page = 1, 
      limit = 20, 
      status,
      roomId 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const filters = [];

    if (status) {
      filters.push({ column: 'status', operator: 'eq', value: status });
    }
    if (roomId) {
      filters.push({ column: 'room_id', operator: 'eq', value: roomId });
    }

    const { rows: inquiries, error, count } = await query('inquiries', {
      select: `
        *,
        rooms (id, title),
        inquiry_replies (id, message, created_at, admin_id)
      `,
      filters,
      order: { column: 'created_at', ascending: false },
      limit: limitNum,
      offset,
      count: 'exact'
    });

    if (error) throw error;

    return successResponse(res, 200, 'Inquiries retrieved', {
      inquiries: inquiries.map(formatInquiryWithReplies),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return errorResponse(res, 500, 'Failed to retrieve inquiries', error.message);
  }
});

/**
 * GET /api/admin/inquiries/:id
 * Get single inquiry details (admin only)
 */
router.get('/admin/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { id } = req.params;

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        rooms (id, title),
        inquiry_replies (
          id,
          message,
          created_at,
          admin_id,
          admin_users (name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !inquiry) {
      return notFoundResponse(res, 'Inquiry');
    }

    return successResponse(res, 200, 'Inquiry retrieved', formatInquiryWithReplies(inquiry));
  } catch (error) {
    console.error('Get inquiry error:', error);
    return errorResponse(res, 500, 'Failed to retrieve inquiry', error.message);
  }
});

/**
 * PUT /api/admin/inquiries/:id
 * Update inquiry status (admin only)
 */
router.put('/admin/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'replied', 'closed'].includes(status)) {
      return validationErrorResponse(res, ['Invalid status']);
    }

    const { data, error } = await supabase
      .from('inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(res, 200, 'Inquiry updated', formatInquiry(data));
  } catch (error) {
    console.error('Update inquiry error:', error);
    return errorResponse(res, 500, 'Failed to update inquiry', error.message);
  }
});

/**
 * POST /api/admin/inquiries/:id/reply
 * Reply to an inquiry (admin only)
 */
router.post('/admin/:id/reply', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { id } = req.params;
    const { message } = req.body;

    const validation = validate(
      { message },
      { message: { required: true, minLength: 5 } }
    );

    if (!validation.valid) {
      return validationErrorResponse(res, validation.errors);
    }

    // Check if inquiry exists and get inquirer details
    const { data: existingInquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('id, inquirer_name, inquirer_email')
      .eq('id', id)
      .single();

    if (inquiryError || !existingInquiry) {
      return notFoundResponse(res, 'Inquiry');
    }

    // Insert reply
    const { data: reply, error: replyError } = await supabase
      .from('inquiry_replies')
      .insert([{
        inquiry_id: id,
        admin_id: req.user.userId,
        message: sanitizeInput(message)
      }])
      .select()
      .single();

    if (replyError) throw replyError;

    // Update inquiry status to replied
    await supabase
      .from('inquiries')
      .update({ status: 'replied', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Send email notification to inquirer (async - don't block response)
    sendReplyNotificationToInquirer({
      inquirerEmail: existingInquiry.inquirer_email,
      inquirerName: existingInquiry.inquirer_name,
      inquiryId: id,
      replyMessage: message
    }).catch(err => console.error('Failed to send reply notification:', err.message));

    return successResponse(res, 201, 'Reply sent', {
      id: reply.id,
      message: reply.message,
      created_at: reply.created_at
    });
  } catch (error) {
    console.error('Reply to inquiry error:', error);
    return errorResponse(res, 500, 'Failed to send reply', error.message);
  }
});

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics (admin only)
 */
router.get('/admin/dashboard/stats', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    // Get counts
    const [inquiriesCount, pendingInquiries, repliedInquiries, roomsCount] = await Promise.all([
      supabase.from('inquiries').select('*', { count: 'exact', head: true }),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'replied'),
      supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    return successResponse(res, 200, 'Dashboard stats retrieved', {
      totalInquiries: inquiriesCount.count || 0,
      pendingInquiries: pendingInquiries.count || 0,
      repliedInquiries: repliedInquiries.count || 0,
      activeRooms: roomsCount.count || 0
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return errorResponse(res, 500, 'Failed to retrieve statistics', error.message);
  }
});

/**
 * Helper function to format inquiry data
 */
function formatInquiry(inquiry) {
  return {
    id: inquiry.id,
    roomId: inquiry.room_id,
    inquirerName: inquiry.inquirer_name,
    inquirerEmail: inquiry.inquirer_email,
    inquirerPhone: inquiry.inquirer_phone,
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.created_at,
    updatedAt: inquiry.updated_at
  };
}

/**
 * Helper function to format inquiry with replies
 */
function formatInquiryWithReplies(inquiry) {
  const formatted = formatInquiry(inquiry);
  
  if (inquiry.inquiry_replies) {
    formatted.replies = inquiry.inquiry_replies.map(reply => ({
      id: reply.id,
      message: reply.message,
      createdAt: reply.created_at,
      adminId: reply.admin_id,
      adminName: reply.admin_users?.name || 'Admin'
    }));
  }

  if (inquiry.rooms) {
    formatted.room = {
      id: inquiry.rooms.id,
      title: inquiry.rooms.title
    };
  }

  return formatted;
}

export default router;
