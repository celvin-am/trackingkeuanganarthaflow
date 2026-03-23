import { Router } from 'express';
import { settingsService } from '../services/settings.service.js';
import { auth } from '../lib/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, req.user!.id.substring(0,8) + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

export const settingsRouter = Router();

settingsRouter.get('/', async (req, res, next) => {
  try {
    const settings = await settingsService.get(req.user!.id);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

settingsRouter.patch('/', async (req, res, next) => {
  try {
    const settings = await settingsService.update(req.user!.id, req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

settingsRouter.patch('/profile-picture', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await settingsService.updateProfilePicture(req.user!.id, imageUrl);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    next(err);
  }
});

settingsRouter.delete('/account', async (req, res, next) => {
  try {
    await settingsService.deleteAccount(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

settingsRouter.post('/reset-data', async (req, res, next) => {
  try {
    await settingsService.resetData(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
