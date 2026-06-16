import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { validate, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

/**
 * GET /api/reservations
 * Get user's reservations
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryStr = `
      SELECT r.*, rm.title as room_title, rm.images as room_images
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.guest_id = $1
    `;
    const values = [req.user.userId];

    if (status) {
      queryStr += ` AND r.status = $2`;
      values.push(status);
    }

    queryStr += ` ORDER BY r.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(parseInt(limit), offset);

    const result = await query(queryStr, values);

    return successResponse(res, 200, 'Reservations retrieved', {
      reservations: result.rows.map(formatReservation),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    return errorResponse(res, 500, 'Failed to retrieve reservations', error.message);
  }
});

/**
 * GET /api/reservations/:id
 * Get single reservation
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT r.*, rm.title as room_title, rm.images as room_images
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.id = $1 AND r.guest_id = $2`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return notFoundResponse(res, 'Reservation');
    }

    return successResponse(res, 200, 'Reservation retrieved', formatReservation(result.rows[0]));
  } catch (error) {
    console.error('Get reservation error:', error);
    return errorResponse(res, 500, 'Failed to retrieve reservation', error.message);
  }
});

/**
 * POST /api/reservations
 * Create a new reservation
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, guestCount, specialRequests } = req.body;

    const validation = validate({ roomId, checkInDate, checkOutDate }, {
      roomId: { required: true },
      checkInDate: { required: true },
      checkOutDate: { required: true }
    });

    if (!validation.valid) {
      return validationErrorResponse(res, validation.errors);
    }

    // Check room exists and is active
    const roomResult = await query(
      'SELECT * FROM rooms WHERE id = $1 AND is_active = true',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return notFoundResponse(res, 'Room');
    }

    // Check availability
    const overlapResult = await query(
      `SELECT COUNT(*) as count FROM reservations
       WHERE room_id = $1
       AND status IN ('confirmed', 'pending')
       AND (
         (check_in_date <= $2 AND check_out_date >= $2) OR
         (check_in_date <= $3 AND check_out_date >= $3) OR
         (check_in_date >= $2 AND check_out_date <= $3)
       )`,
      [roomId, checkInDate, checkOutDate]
    );

    if (parseInt(overlapResult.rows[0].count) > 0) {
      return errorResponse(res, 409, 'Room is not available for selected dates');
    }

    // Create reservation
    const result = await query(
      `INSERT INTO reservations (room_id, guest_id, check_in_date, check_out_date, guest_count, special_requests, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [roomId, req.user.userId, checkInDate, checkOutDate, parseInt(guestCount) || 1, sanitizeInput(specialRequests)]
    );

    return successResponse(res, 201, 'Reservation created successfully', formatReservation(result.rows[0]));
  } catch (error) {
    console.error('Create reservation error:', error);
    return errorResponse(res, 500, 'Failed to create reservation', error.message);
  }
});

/**
 * PUT /api/reservations/:id/cancel
 * Cancel a reservation
 */
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE reservations SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND guest_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 400, 'Cannot cancel this reservation');
    }

    return successResponse(res, 200, 'Reservation cancelled successfully', formatReservation(result.rows[0]));
  } catch (error) {
    console.error('Cancel reservation error:', error);
    return errorResponse(res, 500, 'Failed to cancel reservation', error.message);
  }
});

/**
 * PUT /api/reservations/:id/confirm
 * Confirm a reservation (owner only)
 */
router.put('/:id/confirm', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is the room owner
    const reservation = await query(
      `SELECT r.*, rm.owner_id FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.id = $1`,
      [id]
    );

    if (reservation.rows.length === 0) {
      return notFoundResponse(res, 'Reservation');
    }

    if (reservation.rows[0].owner_id !== req.user.userId) {
      return errorResponse(res, 403, 'Not authorized to confirm this reservation');
    }

    const result = await query(
      `UPDATE reservations SET status = 'confirmed', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    return successResponse(res, 200, 'Reservation confirmed successfully', formatReservation(result.rows[0]));
  } catch (error) {
    console.error('Confirm reservation error:', error);
    return errorResponse(res, 500, 'Failed to confirm reservation', error.message);
  }
});

function formatReservation(reservation) {
  return {
    id: reservation.id,
    roomId: reservation.room_id,
    roomTitle: reservation.room_title,
    roomImages: typeof reservation.room_images === 'string' ? JSON.parse(reservation.room_images) : reservation.room_images,
    checkInDate: reservation.check_in_date,
    checkOutDate: reservation.check_out_date,
    guestCount: reservation.guest_count,
    totalPrice: parseFloat(reservation.total_price),
    status: reservation.status,
    specialRequests: reservation.special_requests,
    createdAt: reservation.created_at
  };
}

export default router;