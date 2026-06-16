import express from 'express';
import { supabase, query } from '../config/supabase.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { validate, sanitizeInput } from '../utils/validation.js';

const router = express.Router();

/**
 * GET /api/rooms
 * Get all active rooms (public - no auth required)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      bathrooms,
      search 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build filters array for Supabase query builder
    const filters = [];

    if (minPrice) {
      filters.push({ column: 'price', operator: 'gte', value: parseFloat(minPrice) });
    }
    if (maxPrice) {
      filters.push({ column: 'price', operator: 'lte', value: parseFloat(maxPrice) });
    }
    if (bedrooms) {
      filters.push({ column: 'bedrooms', operator: 'gte', value: parseInt(bedrooms) });
    }
    if (bathrooms) {
      filters.push({ column: 'bathrooms', operator: 'gte', value: parseFloat(bathrooms) });
    }
    if (search) {
      filters.push({ column: 'title', operator: 'ilike', value: `%${sanitizeInput(search)}%` });
    }

    // Add is_active filter for public access
    filters.push({ column: 'is_active', operator: 'eq', value: true });

    const { rows: rooms, error, count } = await query('rooms', {
      select: '*',
      filters,
      order: { column: 'created_at', ascending: false },
      limit: limitNum,
      offset,
      count: 'exact'
    });

    if (error) throw error;

    return successResponse(res, 200, 'Rooms retrieved', {
      rooms: rooms.map(room => formatRoom(room)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    return errorResponse(res, 500, 'Failed to retrieve rooms', error.message);
  }
});

/**
 * GET /api/rooms/:id
 * Get single room by ID (public - no auth required)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows, error } = await query('rooms', {
      select: '*',
      filters: [
        { column: 'id', operator: 'eq', value: id },
        { column: 'is_active', operator: 'eq', value: true }
      ],
      single: true
    });

    if (error) throw error;
    if (rows.length === 0) {
      return notFoundResponse(res, 'Room');
    }

    const room = formatRoom(rows[0]);

    return successResponse(res, 200, 'Room retrieved', room);
  } catch (error) {
    console.error('Get room error:', error);
    return errorResponse(res, 500, 'Failed to retrieve room', error.message);
  }
});

/**
 * ADMIN ROUTES - Require authentication
 */

/**
 * GET /api/rooms/admin/list
 * Get all rooms including inactive (admin only)
 */
router.get('/admin/list', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { 
      page = 1, 
      limit = 20, 
      isActive 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const filters = [];

    if (isActive !== undefined) {
      filters.push({ column: 'is_active', operator: 'eq', value: isActive === 'true' });
    }

    const { rows: rooms, error, count } = await query('rooms', {
      select: '*',
      filters,
      order: { column: 'created_at', ascending: false },
      limit: limitNum,
      offset,
      count: 'exact'
    });

    if (error) throw error;

    return successResponse(res, 200, 'Rooms retrieved', {
      rooms: rooms.map(room => formatRoom(room)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    return errorResponse(res, 500, 'Failed to retrieve rooms', error.message);
  }
});

/**
 * GET /api/rooms/admin/:id
 * Get single room by ID (admin only - includes inactive rooms)
 */
router.get('/admin/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { id } = req.params;

    const { rows, error } = await query('rooms', {
      select: '*',
      filters: [{ column: 'id', operator: 'eq', value: id }],
      single: true
    });

    if (error) throw error;
    if (rows.length === 0) {
      return notFoundResponse(res, 'Room');
    }

    const room = formatRoom(rows[0]);
    return successResponse(res, 200, 'Room retrieved', room);
  } catch (error) {
    console.error('Get room error:', error);
    return errorResponse(res, 500, 'Failed to retrieve room', error.message);
  }
});

/**
 * POST /api/rooms/admin
 * Create a new room (admin only)
 */
router.post('/admin', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { 
      title, description, price, bedrooms, bathrooms, 
      area, floor, unitNumber, images, amenities 
    } = req.body;

    const validation = validate(
      { title, description, price, bedrooms, bathrooms },
      {
        title: { required: true, minLength: 3, maxLength: 200 },
        description: { required: true, minLength: 10 },
        price: { required: true },
        bedrooms: { required: true },
        bathrooms: { required: true }
      }
    );

    if (!validation.valid) {
      return validationErrorResponse(res, validation.errors);
    }

    const roomData = {
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      price: parseFloat(price),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseFloat(bathrooms),
      area: area ? parseFloat(area) : null,
      floor: floor ? parseInt(floor) : null,
      unit_number: unitNumber ? sanitizeInput(unitNumber) : null,
      images: images ? (typeof images === 'string' ? JSON.parse(images) : images) : [],
      is_active: true
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();

    if (error) throw error;

    // Handle amenities if provided
    if (amenities && amenities.length > 0) {
      const amenityInserts = amenities.map(amenityId => ({
        room_id: data.id,
        amenity_id: amenityId
      }));
      
      await supabase
        .from('room_amenities')
        .insert(amenityInserts);
    }

    return successResponse(res, 201, 'Room created successfully', formatRoom(data));
  } catch (error) {
    console.error('Create room error:', error);
    return errorResponse(res, 500, 'Failed to create room', error.message);
  }
});

/**
 * PUT /api/rooms/admin/:id
 * Update room (admin only)
 */
router.put('/admin/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { id } = req.params;
    const { 
      title, description, price, bedrooms, bathrooms, 
      area, floor, unitNumber, images, amenities, isActive 
    } = req.body;

    // Check if room exists
    const { rows: existing } = await query('rooms', {
      select: 'id',
      filters: [{ column: 'id', operator: 'eq', value: id }],
      single: true
    });

    if (existing.length === 0) {
      return notFoundResponse(res, 'Room');
    }

    const updates = {};
    if (title !== undefined) updates.title = sanitizeInput(title);
    if (description !== undefined) updates.description = sanitizeInput(description);
    if (price !== undefined) updates.price = parseFloat(price);
    if (bedrooms !== undefined) updates.bedrooms = parseInt(bedrooms);
    if (bathrooms !== undefined) updates.bathrooms = parseFloat(bathrooms);
    if (area !== undefined) updates.area = area ? parseFloat(area) : null;
    if (floor !== undefined) updates.floor = floor ? parseInt(floor) : null;
    if (unitNumber !== undefined) updates.unit_number = unitNumber ? sanitizeInput(unitNumber) : null;
    if (images !== undefined) updates.images = typeof images === 'string' ? JSON.parse(images) : images;
    if (isActive !== undefined) updates.is_active = isActive;
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 0) {
      return validationErrorResponse(res, ['No fields to update']);
    }

    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle amenities if provided
    if (amenities !== undefined) {
      // Remove existing amenities
      await supabase
        .from('room_amenities')
        .delete()
        .eq('room_id', id);

      // Add new amenities
      if (amenities.length > 0) {
        const amenityInserts = amenities.map(amenityId => ({
          room_id: id,
          amenity_id: amenityId
        }));
        
        await supabase
          .from('room_amenities')
          .insert(amenityInserts);
      }
    }

    return successResponse(res, 200, 'Room updated successfully', formatRoom(data));
  } catch (error) {
    console.error('Update room error:', error);
    return errorResponse(res, 500, 'Failed to update room', error.message);
  }
});

/**
 * DELETE /api/rooms/admin/:id
 * Delete room (admin only - soft delete)
 */
router.delete('/admin/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { id } = req.params;

    // Check if room exists
    const { rows: existing } = await query('rooms', {
      select: 'id',
      filters: [{ column: 'id', operator: 'eq', value: id }],
      single: true
    });

    if (existing.length === 0) {
      return notFoundResponse(res, 'Room');
    }

    // Soft delete
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return successResponse(res, 200, 'Room deleted successfully');
  } catch (error) {
    console.error('Delete room error:', error);
    return errorResponse(res, 500, 'Failed to delete room', error.message);
  }
});

/**
 * Helper function to format room data
 */
function formatRoom(room) {
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    price: parseFloat(room.price),
    bedrooms: parseInt(room.bedrooms),
    bathrooms: parseFloat(room.bathrooms),
    area: room.area ? parseFloat(room.area) : null,
    floor: room.floor,
    unitNumber: room.unit_number,
    images: typeof room.images === 'string' ? JSON.parse(room.images) : room.images || [],
    isActive: room.is_active,
    ownerId: room.owner_id,
    createdAt: room.created_at,
    updatedAt: room.updated_at
  };
}

export default router;
