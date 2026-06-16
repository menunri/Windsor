import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

/**
 * POST /api/upload/image
 * Upload a single image file (admin only)
 */
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    if (!req.file) {
      return errorResponse(res, 400, 'No image file provided');
    }

    const file = req.file;
    
    // Generate unique filename
    const ext = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `rooms/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return errorResponse(res, 500, 'Failed to upload image', error.message);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath);

    return successResponse(res, 200, 'Image uploaded successfully', {
      url: urlData.publicUrl,
      path: filePath
    });
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(res, 500, 'Failed to upload image', error.message);
  }
});

/**
 * POST /api/upload/images
 * Upload multiple image files (admin only)
 */
router.post('/images', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, 'No image files provided');
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      const ext = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = `rooms/${fileName}`;

      const { error } = await supabaseAdmin.storage
        .from('images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        errors.push(`${file.originalname}: Upload failed`);
        continue;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(filePath);

      results.push({
        url: urlData.publicUrl,
        path: filePath
      });
    }

    return successResponse(res, 200, 'Images uploaded', {
      uploaded: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(res, 500, 'Failed to upload images', error.message);
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 400, 'File too large. Maximum size is 5MB.');
    }
    return errorResponse(res, 400, err.message);
  }
  if (err) {
    return errorResponse(res, 400, err.message);
  }
  next();
});

export default router;
