import { Router } from 'express';
import { settingsService } from '../services/settings.service.js';
import multer from 'multer';

// 🔥 Memory Storage wajib buat Vercel biar gak nyari disk yang gak ada
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // Kita turunin ke 2MB biar Vercel Payload limit gak nangis
  },
  fileFilter: (_req, file, cb) => {
    // Hanya ijinin gambar biar aman
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diijinkan nyet!'));
    }
  }
});

export const settingsRouter = Router();

// Get settings
settingsRouter.get('/', async (req, res, next) => {
  try {
    // Pastiin req.user ada, kalau gak ada langsung cut
    if (!req.user?.id) return res.status(401).json({ error: 'Mana id user lo?' });

    const settings = await settingsService.get(req.user.id);
    return res.json(settings);
  } catch (err) {
    next(err);
  }
});

// Update settings
settingsRouter.patch('/', async (req, res, next) => {
  try {
    const settings = await settingsService.update(req.user!.id, req.body);
    return res.json(settings);
  } catch (err) {
    next(err);
  }
});

// 🔥 UPLOAD PP: Fix Muter-Muter & Payload Limit
settingsRouter.patch('/profile-picture', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Mana fotonya nyet? Kosong nih.' });
    }

    // Convert ke Base64 (Vercel friendly)
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Simpan ke DB lewat service
    const updatedUser = await settingsService.updateProfilePicture(req.user!.id, base64Image);

    // KUNCI: Harus balikkin JSON biar frontend tau loading SELESAI
    return res.json({
      success: true,
      user: {
        id: updatedUser.id,
        image: updatedUser.image // Balikkin image barunya
      }
    });
  } catch (err: any) {
    console.error("Upload Error:", err);
    // Kalau error karena file kegedean (Multer error)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Kegedean fotonya! Max 2MB aja.' });
    }
    return res.status(500).json({ error: 'Server pingsan pas upload.' });
  }
});

// Delete & Reset
settingsRouter.delete('/account', async (req, res, next) => {
  try {
    await settingsService.deleteAccount(req.user!.id);
    return res.json({ success: true });
  } catch (err) { next(err); }
});

settingsRouter.post('/reset-data', async (req, res, next) => {
  try {
    await settingsService.resetData(req.user!.id);
    return res.json({ success: true });
  } catch (err) { next(err); }
});