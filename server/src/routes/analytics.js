import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Get comprehensive analytics overview for admin dashboard
 */
router.get('/overview', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all analytics data in parallel
    const [
      inquiriesResult,
      roomsResult,
      reservationsResult,
      usersResult,
      reviewsResult
    ] = await Promise.all([
      getInquiryAnalytics(days, startDate),
      getRoomAnalytics(),
      getReservationAnalytics(days, startDate),
      getUserAnalytics(days, startDate),
      getReviewAnalytics()
    ]);

    return successResponse(res, 200, 'Analytics overview retrieved', {
      period,
      days,
      inquiries: inquiriesResult,
      rooms: roomsResult,
      reservations: reservationsResult,
      users: usersResult,
      reviews: reviewsResult,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return errorResponse(res, 500, 'Failed to retrieve analytics', error.message);
  }
});

/**
 * GET /api/analytics/inquiries
 * Get detailed inquiry analytics
 */
router.get('/inquiries', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const inquiriesResult = await getInquiryAnalytics(parseInt(days), startDate);

    return successResponse(res, 200, 'Inquiry analytics retrieved', inquiriesResult);
  } catch (error) {
    console.error('Inquiry analytics error:', error);
    return errorResponse(res, 500, 'Failed to retrieve inquiry analytics', error.message);
  }
});

/**
 * GET /api/analytics/rooms
 * Get detailed room performance analytics
 */
router.get('/rooms', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const roomsResult = await getRoomAnalytics();

    return successResponse(res, 200, 'Room analytics retrieved', roomsResult);
  } catch (error) {
    console.error('Room analytics error:', error);
    return errorResponse(res, 500, 'Failed to retrieve room analytics', error.message);
  }
});

/**
 * GET /api/analytics/trends
 * Get trend data for charts
 */
router.get('/trends', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { metric = 'inquiries', days = 30 } = req.query;
    const numDays = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    let trends = [];

    if (metric === 'inquiries') {
      trends = await getInquiryTrends(numDays);
    } else if (metric === 'reservations') {
      trends = await getReservationTrends(numDays);
    } else if (metric === 'revenue') {
      trends = await getRevenueTrends(numDays);
    }

    return successResponse(res, 200, 'Trend data retrieved', {
      metric,
      days: numDays,
      data: trends
    });
  } catch (error) {
    console.error('Trend analytics error:', error);
    return errorResponse(res, 500, 'Failed to retrieve trends', error.message);
  }
});

// ============ Helper Functions ============

async function getInquiryAnalytics(days, startDate) {
  const [
    totalResult,
    pendingResult,
    repliedResult,
    closedResult,
    recentResult,
    byRoomResult
  ] = await Promise.all([
    supabase.from('inquiries').select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString()),
    supabase.from('inquiries').select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('created_at', startDate.toISOString()),
    supabase.from('inquiries').select('*', { count: 'exact', head: true })
      .eq('status', 'replied')
      .gte('created_at', startDate.toISOString()),
    supabase.from('inquiries').select('*', { count: 'exact', head: true })
      .eq('status', 'closed')
      .gte('created_at', startDate.toISOString()),
    supabase.from('inquiries')
      .select('id, inquirer_name, inquirer_email, message, status, created_at, rooms(title)')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('inquiries')
      .select('room_id, rooms(title)')
      .gte('created_at', startDate.toISOString())
      .not('room_id', 'is', null)
  ]);

  // Count inquiries by room
  const byRoom = {};
  if (byRoomResult.data) {
    byRoomResult.data.forEach(inq => {
      const roomTitle = inq.rooms?.title || 'Unknown';
      byRoom[roomTitle] = (byRoom[roomTitle] || 0) + 1;
    });
  }

  // Get inquiries by day for trend
  const byDay = await getInquiriesByDay(days, startDate);

  return {
    total: totalResult.count || 0,
    pending: pendingResult.count || 0,
    replied: repliedResult.count || 0,
    closed: closedResult.count || 0,
    responseRate: totalResult.count > 0 
      ? Math.round((repliedResult.count + closedResult.count) / totalResult.count * 100) 
      : 0,
    recent: recentResult.data || [],
    byRoom,
    byDay
  };
}

async function getInquiriesByDay(days, startDate) {
  const result = await supabase
    .from('inquiries')
    .select('created_at')
    .gte('created_at', startDate.toISOString());

  const byDay = {};
  const now = new Date();
  
  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split('T')[0];
    byDay[key] = 0;
  }

  // Count inquiries per day
  if (result.data) {
    result.data.forEach(inq => {
      const key = inq.created_at.split('T')[0];
      if (byDay[key] !== undefined) {
        byDay[key]++;
      }
    });
  }

  return Object.entries(byDay).map(([date, count]) => ({ date, count }));
}

async function getRoomAnalytics() {
  const [
    totalResult,
    activeResult,
    inactiveResult,
    byBedroomsResult,
    avgPriceResult,
    topRoomsResult
  ] = await Promise.all([
    supabase.from('rooms').select('*', { count: 'exact', head: true }),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('rooms').select('bedrooms').eq('is_active', true),
    supabase.from('rooms').select('price').eq('is_active', true),
    supabase
      .from('rooms')
      .select('id, title, price, bedrooms, bathrooms, area')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  // Count by bedrooms
  const byBedrooms = { 1: 0, 2: 0, 3: 0, '4+': 0 };
  if (byBedroomsResult.data) {
    byBedroomsResult.data.forEach(room => {
      if (room.bedrooms >= 4) byBedrooms['4+']++;
      else byBedrooms[room.bedrooms] = (byBedrooms[room.bedrooms] || 0) + 1;
    });
  }

  // Calculate average price
  let avgPrice = 0;
  if (avgPriceResult.data && avgPriceResult.data.length > 0) {
    const sum = avgPriceResult.data.reduce((acc, r) => acc + (r.price || 0), 0);
    avgPrice = Math.round(sum / avgPriceResult.data.length);
  }

  // Calculate occupancy (rooms with reservations in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: reservations } = await supabase
    .from('reservations')
    .select('room_id')
    .gte('check_in_date', thirtyDaysAgo.toISOString().split('T')[0])
    .in('status', ['confirmed', 'completed']);

  const occupiedRoomIds = new Set(reservations?.map(r => r.room_id) || []);
  const occupancyRate = activeResult.count > 0 
    ? Math.round(occupiedRoomIds.size / activeResult.count * 100) 
    : 0;

  return {
    total: totalResult.count || 0,
    active: activeResult.count || 0,
    inactive: inactiveResult.count || 0,
    byBedrooms,
    avgPrice,
    occupancyRate,
    recentRooms: topRoomsResult.data || []
  };
}

async function getReservationAnalytics(days, startDate) {
  const [
    totalResult,
    pendingResult,
    confirmedResult,
    completedResult,
    cancelledResult,
    revenueResult
  ] = await Promise.all([
    supabase.from('reservations').select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString()),
    supabase.from('reservations').select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('created_at', startDate.toISOString()),
    supabase.from('reservations').select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('created_at', startDate.toISOString()),
    supabase.from('reservations').select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString()),
    supabase.from('reservations').select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('created_at', startDate.toISOString()),
    supabase.from('reservations')
      .select('total_price')
      .in('status', ['confirmed', 'completed'])
      .gte('created_at', startDate.toISOString())
  ]);

  let totalRevenue = 0;
  if (revenueResult.data) {
    totalRevenue = revenueResult.data.reduce((acc, r) => acc + (r.total_price || 0), 0);
  }

  return {
    total: totalResult.count || 0,
    pending: pendingResult.count || 0,
    confirmed: confirmedResult.count || 0,
    completed: completedResult.count || 0,
    cancelled: cancelledResult.count || 0,
    totalRevenue: Math.round(totalRevenue),
    conversionRate: totalResult.count > 0
      ? Math.round((confirmedResult.count + completedResult.count) / totalResult.count * 100)
      : 0
  };
}

async function getUserAnalytics(days, startDate) {
  const [
    totalResult,
    newResult,
    activeResult
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString()),
    supabase.from('reservations').select('guest_id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
  ]);

  return {
    total: totalResult.count || 0,
    newThisPeriod: newResult.count || 0,
    activeThisPeriod: activeResult.count || 0
  };
}

async function getReviewAnalytics() {
  const [reviewsResult, avgRatingResult] = await Promise.all([
    supabase.from('room_reviews').select('*', { count: 'exact', head: true }),
    supabase.from('room_reviews').select('rating')
  ]);

  let avgRating = 0;
  if (avgRatingResult.data && avgRatingResult.data.length > 0) {
    const sum = avgRatingResult.data.reduce((acc, r) => acc + (r.rating || 0), 0);
    avgRating = (sum / avgRatingResult.data.length).toFixed(1);
  }

  // Get recent reviews with room info
  const { data: recentReviews } = await supabase
    .from('room_reviews')
    .select('id, rating, comment, created_at, rooms(title), users(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    total: reviewsResult.count || 0,
    avgRating: parseFloat(avgRating),
    recent: recentReviews || []
  };
}

async function getInquiryTrends(days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return getInquiriesByDay(days, startDate);
}

async function getReservationTrends(days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data: reservations } = await supabase
    .from('reservations')
    .select('check_in_date')
    .gte('check_in_date', startDate.toISOString().split('T')[0]);

  const byDay = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split('T')[0];
    byDay[key] = 0;
  }

  if (reservations) {
    reservations.forEach(res => {
      const key = res.check_in_date;
      if (byDay[key] !== undefined) {
        byDay[key]++;
      }
    });
  }

  return Object.entries(byDay).map(([date, count]) => ({ date, count }));
}

async function getRevenueTrends(days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data: reservations } = await supabase
    .from('reservations')
    .select('check_in_date, total_price')
    .gte('check_in_date', startDate.toISOString().split('T')[0])
    .in('status', ['confirmed', 'completed']);

  const byDay = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split('T')[0];
    byDay[key] = 0;
  }

  if (reservations) {
    reservations.forEach(res => {
      const key = res.check_in_date;
      if (byDay[key] !== undefined) {
        byDay[key] += res.total_price || 0;
      }
    });
  }

  return Object.entries(byDay).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }));
}

export default router;
