import { Router } from 'express';
import { settingsService } from '../services/settings.service.js';
import multer from 'multer';
import path from 'path';
import { supabaseAdmin } from '../lib/supabase.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
});

export const settingsRouter = Router();

// Get user settings
settingsRouter.get('/', async (req, res, next) => {
  try {
    const settings = await settingsService.get(req.user!.id);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// Update general settings
settingsRouter.patch('/', async (req, res, next) => {
  try {
    const settings = await settingsService.update(req.user!.id, req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// Upload profile picture to Supabase Storage, save URL to DB
settingsRouter.patch('/profile-picture', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase() || '.jpg';
    const filePath = `avatars/${req.user.id}-${Date.now()}${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image to storage' });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    const updatedUser = await settingsService.updateProfilePicture(req.user.id, imageUrl);

    return res.json({
      success: true,
      imageUrl,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Upload Error:', err);
    next(err);
  }
});

// Delete account
settingsRouter.delete('/account', async (req, res, next) => {
  try {
    await settingsService.deleteAccount(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Reset all data
settingsRouter.post('/reset-data', async (req, res, next) => {
  try {
    await settingsService.resetData(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});