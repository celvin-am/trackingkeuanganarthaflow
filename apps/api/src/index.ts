import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// 1. Keamanan proxy untuk Vercel (PENTING!)
app.set('trust proxy', 1);

// 2. Konfigurasi CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// 3. Better Auth Handler (Sebelum body parsers)
app.all('/api/auth/*', toNodeHandler(auth));

// 4. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 5. Protected Routes
app.use('/api/settings', requireAuth, (req, res) => res.json({ message: "Success!" }));
// ... (rute lainnya)

app.use(errorHandler);

export default app;