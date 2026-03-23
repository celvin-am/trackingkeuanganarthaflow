import { Router } from 'express';
import { settingsService } from '../services/settings.service.js';
import multer from 'multer';

// 🔥 JANGAN pake diskStorage di Vercel! Pake memoryStorage.
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 } // Limit 4MB (Vercel max 4.5MB)
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

// 🔥 FIX ERROR 500: Upload Foto Profil
settingsRouter.patch('/profile-picture', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Convert buffer gambar jadi Base64 String
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Simpen ke DB lewat service lo
    const updatedUser = await settingsService.updateProfilePicture(req.user!.id, base64Image);

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: 'Internal server error' });
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