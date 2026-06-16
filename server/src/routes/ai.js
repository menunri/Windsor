import express from 'express';
import { chatWithBot } from '../services/ai/chatbot.js';
import { interpretSearch } from '../services/ai/searchInterpreter.js';
import { generateDescription } from '../services/ai/descriptionGenerator.js';
import { suggestReply } from '../services/ai/replySuggester.js';
import { listModels } from '../config/gemini.js';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  translateAndAnswerQuery,
  generateReport,
  analyzeInquiry,
  getRoomPerformanceInsights
} from '../services/ai/analyticsEngine.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Chat with the AI inquiry assistant
 * Public endpoint - no auth required
 */
router.post('/chat', chatWithBot);

/**
 * POST /api/ai/interpret-search
 * Interpret natural language search queries
 * Public endpoint - no auth required
 */
router.post('/interpret-search', interpretSearch);

/**
 * POST /api/ai/generate-description
 * Generate room description from specifications
 * Admin-only endpoint
 */
router.post('/generate-description', generateDescription);

/**
 * POST /api/ai/suggest-reply
 * Suggest replies for admin inquiry responses
 * Admin-only endpoint
 */
router.post('/suggest-reply', suggestReply);

/**
 * GET /api/ai/debug-models
 * Debug endpoint to list available models
 */
router.get('/debug-models', async (req, res) => {
  try {
    const models = await listModels();
    res.json({ success: true, models });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ AI Analytics Endpoints ============

/**
 * POST /api/ai/analytics/query
 * Natural language query against analytics data
 * Admin-only endpoint
 */
router.post('/analytics/query', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return errorResponse(res, 400, 'Question is required');
    }

    // Fetch current analytics data
    const { data: analyticsData, error } = await fetchAnalyticsOverview();

    if (error) throw error;

    const result = await translateAndAnswerQuery(question, analyticsData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Analytics query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process analytics query'
    });
  }
});

/**
 * POST /api/ai/analytics/report
 * Generate AI-powered analytics report
 * Admin-only endpoint
 */
router.post('/analytics/report', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { reportType = 'dashboard', period = '30d' } = req.body;

    // Fetch current analytics data
    const { data: analyticsData, error } = await fetchAnalyticsOverview(period);

    if (error) throw error;

    const report = await generateReport(analyticsData, reportType);

    res.json({
      success: true,
      data: {
        ...report,
        period,
        reportType,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * POST /api/ai/inquiry/analyze
 * Analyze inquiry for categorization, sentiment, and urgency
 * Admin-only endpoint
 */
router.post('/inquiry/analyze', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { inquiryId, inquiryData } = req.body;

    if (!inquiryData && !inquiryId) {
      return errorResponse(res, 400, 'Either inquiryId or inquiryData is required');
    }

    let inquiry = inquiryData;

    if (inquiryId && !inquiry) {
      // Fetch from database
      const { data } = await supabase
        .from('inquiries')
        .select('*')
        .eq('id', inquiryId)
        .single();

      if (data) {
        inquiry = {
          message: data.message,
          inquirerEmail: data.inquirer_email,
          inquirerName: data.inquirer_name
        };
      }
    }

    if (!inquiry || !inquiry.message) {
      return errorResponse(res, 400, 'Inquiry message is required');
    }

    const analysis = await analyzeInquiry(inquiry);

    res.json({
      success: true,
      data: {
        ...analysis,
        inquiryId
      }
    });
  } catch (error) {
    console.error('Inquiry analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze inquiry'
    });
  }
});

/**
 * POST /api/ai/rooms/:id/insights
 * Get AI-powered room performance insights
 * Admin-only endpoint
 */
router.post('/rooms/:id/insights', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { id } = req.params;
    const { period = '30d' } = req.query;

    // Fetch room data
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (roomError || !room) {
      return errorResponse(res, 404, 'Room not found');
    }

    // Fetch room-specific analytics
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      inquiriesResult,
      reservationsResult
    ] = await Promise.all([
      supabase.from('inquiries')
        .select('id, status', { count: 'exact' })
        .eq('room_id', id)
        .gte('created_at', startDate.toISOString()),
      supabase.from('reservations')
        .select('id, status')
        .eq('room_id', id)
        .gte('created_at', startDate.toISOString())
    ]);

    const roomAnalytics = {
      inquiries: inquiriesResult.count || 0,
      pending: inquiriesResult.data?.filter(i => i.status === 'pending').length || 0,
      reservations: reservationsResult.count || 0,
      confirmed: reservationsResult.data?.filter(r => r.status === 'confirmed').length || 0
    };

    const insights = await getRoomPerformanceInsights(room, roomAnalytics);

    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          title: room.title,
          price: room.price,
          bedrooms: room.bedrooms,
          bathrooms: room.bathrooms
        },
        period,
        ...roomAnalytics,
        insights
      }
    });
  } catch (error) {
    console.error('Room insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate room insights'
    });
  }
});

// ============ Helper Functions ============

async function fetchAnalyticsOverview(period = '30d') {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    inquiriesResult,
    roomsResult,
    reservationsResult,
    usersResult,
    reviewsResult
  ] = await Promise.all([
    getInquiryStats(days, startDate),
    getRoomStats(),
    getReservationStats(days, startDate),
    getUserStats(days, startDate),
    getReviewStats()
  ]);

  return {
    data: {
      period,
      inquiries: inquiriesResult,
      rooms: roomsResult,
      reservations: reservationsResult,
      users: usersResult,
      reviews: reviewsResult
    }
  };
}

async function getInquiryStats(days, startDate) {
  const [total, pending, replied, closed] = await Promise.all([
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending').gte('created_at', startDate.toISOString()),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'replied').gte('created_at', startDate.toISOString()),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'closed').gte('created_at', startDate.toISOString())
  ]);

  return {
    total: total.count || 0,
    pending: pending.count || 0,
    replied: replied.count || 0,
    closed: closed.count || 0,
    responseRate: total.count > 0 ? Math.round((replied.count + closed.count) / total.count * 100) : 0
  };
}

async function getRoomStats() {
  const [total, active, avgPrice] = await Promise.all([
    supabase.from('rooms').select('*', { count: 'exact', head: true }),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('rooms').select('price').eq('is_active', true)
  ]);

  let avgPriceValue = 0;
  if (avgPrice.data && avgPrice.data.length > 0) {
    const sum = avgPrice.data.reduce((acc, r) => acc + (r.price || 0), 0);
    avgPriceValue = Math.round(sum / avgPrice.data.length);
  }

  return {
    total: total.count || 0,
    active: active.count || 0,
    avgPrice: avgPriceValue
  };
}

async function getReservationStats(days, startDate) {
  const [total, confirmed, completed, revenue] = await Promise.all([
    supabase.from('reservations').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'completed']).gte('created_at', startDate.toISOString()),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', startDate.toISOString()),
    supabase.from('reservations').select('total_price').in('status', ['confirmed', 'completed']).gte('created_at', startDate.toISOString())
  ]);

  const totalRevenue = revenue.data?.reduce((acc, r) => acc + (r.total_price || 0), 0) || 0;

  return {
    total: total.count || 0,
    confirmed: confirmed.count || 0,
    completed: completed.count || 0,
    totalRevenue: Math.round(totalRevenue)
  };
}

async function getUserStats(days, startDate) {
  const [total, newUsers] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString())
  ]);

  return {
    total: total.count || 0,
    newThisPeriod: newUsers.count || 0
  };
}

async function getReviewStats() {
  const [total, avgRating] = await Promise.all([
    supabase.from('room_reviews').select('*', { count: 'exact', head: true }),
    supabase.from('room_reviews').select('rating')
  ]);

  let avgRatingValue = 0;
  if (avgRating.data && avgRating.data.length > 0) {
    const sum = avgRating.data.reduce((acc, r) => acc + (r.rating || 0), 0);
    avgRatingValue = (sum / avgRating.data.length).toFixed(1);
  }

  return {
    total: total.count || 0,
    avgRating: parseFloat(avgRatingValue)
  };
}

export default router;
