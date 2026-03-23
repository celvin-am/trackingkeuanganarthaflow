import { Router } from 'express';
import { settingsService } from '../services/settings.service.js';
import multer from 'multer';

// 🔥 PAKE memoryStorage, jangan diskStorage!
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 } // Limit 3MB biar gak kena limit Vercel
});

export const settingsRouter = Router();

// Get settings
settingsRouter.get('/', async (req, res, next) => {
  try {
    const settings = await settingsService.get(req.user!.id);
    res.json(settings);
  } catch (err) { next(err); }
});

// Update settings
settingsRouter.patch('/', async (req, res, next) => {
  try {
    const settings = await settingsService.update(req.user!.id, req.body);
    res.json(settings);
  } catch (err) { next(err); }
});

// 🔥 FIX MUTER-MUTER: Upload PP via Base64
settingsRouter.patch('/profile-picture', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    // Convert file buffer ke Base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Simpan ke DB
    const updatedUser = await settingsService.updateProfilePicture(req.user!.id, base64Image);

    // Kirim respon BIAR FRONTEND BERHENTI LOADING
    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

settingsRouter.delete('/account', async (req, res, next) => {
  try {
    await settingsService.deleteAccount(req.user!.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

settingsRouter.post('/reset-data', async (req, res, next) => {
  try {
    await settingsService.resetData(req.user!.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});