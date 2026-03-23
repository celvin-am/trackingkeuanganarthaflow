import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// 1. Trust Proxy (Wajib buat Vercel HTTPS)
app.set('trust proxy', 1);

// 2. CORS (Izinkan domain web lo)
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// 3. Better Auth (Sebelum body parser)
app.all('/api/auth/*', toNodeHandler(auth));

// 4. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... (sisanya rute API lo seperti biasa)

app.use(errorHandler);

export default app;