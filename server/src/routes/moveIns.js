import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { validate, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

/**
 * GET /api/move-ins
 * Get user's move-ins
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryStr = `
      SELECT mi.*, rm.title as room_title, rm.unit_number
      FROM move_ins mi
      JOIN rooms rm ON mi.room_id = rm.id
      WHERE mi.guest_id = $1
    `;
    const values = [req.user.userId];

    if (status) {
      queryStr += ` AND mi.status = $2`;
      values.push(status);
    }

    queryStr += ` ORDER BY mi.move_in_date DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(parseInt(limit), offset);

    const result = await query(queryStr, values);

    return successResponse(res, 200, 'Move-ins retrieved', {
      moveIns: result.rows.map(formatMoveIn),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get move-ins error:', error);
    return errorResponse(res, 500, 'Failed to retrieve move-ins', error.message);
  }
});

/**
 * GET /api/move-ins/:id
 * Get single move-in
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT mi.*, rm.title as room_title, rm.unit_number, rm.images as room_images
       FROM move_ins mi
       JOIN rooms rm ON mi.room_id = rm.id
       WHERE mi.id = $1 AND mi.guest_id = $2`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return notFoundResponse(res, 'Move-in');
    }

    return successResponse(res, 200, 'Move-in retrieved', formatMoveIn(result.rows[0]));
  } catch (error) {
    console.error('Get move-in error:', error);
    return errorResponse(res, 500, 'Failed to retrieve move-in', error.message);
  }
});

/**
 * POST /api/move-ins
 * Create a new move-in record
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { reservationId, moveInDate, comments } = req.body;

    const validation = validate({ reservationId, moveInDate }, {
      reservationId: { required: true },
      moveInDate: { required: true }
    });

    if (!validation.valid) {
      return validationErrorResponse(res, validation.errors);
    }

    // Check reservation exists and belongs to user
    const reservationResult = await query(
      'SELECT * FROM reservations WHERE id = $1 AND guest_id = $2 AND status = $3',
      [reservationId, req.user.userId, 'confirmed']
    );

    if (reservationResult.rows.length === 0) {
      return errorResponse(res, 400, 'Reservation not found or not confirmed');
    }

    const reservation = reservationResult.rows[0];

    // Create move-in record
    const result = await query(
      `INSERT INTO move_ins (room_id, guest_id, reservation_id, move_in_date, status, comments)
       VALUES ($1, $2, $3, $4, 'scheduled', $5)
       RETURNING *`,
      [reservation.room_id, req.user.userId, reservationId, moveInDate, sanitizeInput(comments)]
    );

    return successResponse(res, 201, 'Move-in created successfully', formatMoveIn(result.rows[0]));
  } catch (error) {
    console.error('Create move-in error:', error);
    return errorResponse(res, 500, 'Failed to create move-in', error.message);
  }
});

/**
 * PUT /api/move-ins/:id
 * Update move-in status
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    // Check ownership
    const existing = await query(
      'SELECT * FROM move_ins WHERE id = $1 AND guest_id = $2',
      [id, req.user.userId]
    );

    if (existing.rows.length === 0) {
      return notFoundResponse(res, 'Move-in');
    }

    const updates = ['updated_at = NOW()'];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (comments !== undefined) {
      updates.push(`comments = $${paramCount++}`);
      values.push(sanitizeInput(comments));
    }

    values.push(id);

    const result = await query(
      `UPDATE move_ins SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return successResponse(res, 200, 'Move-in updated successfully', formatMoveIn(result.rows[0]));
  } catch (error) {
    console.error('Update move-in error:', error);
    return errorResponse(res, 500, 'Failed to update move-in', error.message);
  }
});

function formatMoveIn(moveIn) {
  return {
    id: moveIn.id,
    roomId: moveIn.room_id,
    roomTitle: moveIn.room_title,
    unitNumber: moveIn.unit_number,
    roomImages: typeof moveIn.room_images === 'string' ? JSON.parse(moveIn.room_images) : moveIn.room_images,
    reservationId: moveIn.reservation_id,
    moveInDate: moveIn.move_in_date,
    status: moveIn.status,
    comments: moveIn.comments,
    createdAt: moveIn.created_at,
    updatedAt: moveIn.updated_at
  };
}

export default router;