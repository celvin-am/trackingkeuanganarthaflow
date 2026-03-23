import express from 'express';
import cors from 'cors';
import path from 'path';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Import routers
import { walletRouter } from './routes/wallet.route.js';
import { transactionRouter } from './routes/transaction.route.js';
import { dashboardRouter } from './routes/dashboard.route.js';
import { exportRouter } from './routes/export.route.js';
import { budgetRouter } from './routes/budget.route.js';
import { categoryRouter } from './routes/category.route.js';
import { scanRouter } from './routes/scan.route.js';
import { settingsRouter } from './routes/settings.route.js';
import { recurringRouter } from './routes/recurring.route.js';

const app = express();

// 1. Keamanan proxy untuk Vercel (Wajib buat baca header HTTPS)
app.set('trust proxy', 1);

// 2. Konfigurasi CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// 3. Better Auth Handler (WAJIB sebelum body parsers)
app.all('/api/auth/*', toNodeHandler(auth));

// 4. Body parsers (Ditaruh setelah Auth)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rute dasar biar gak 404
app.get('/', (req, res) => {
  res.json({ message: "🚀 ArthaFlow API is Running!" });
});
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 5. API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 6. Protected Routes (Semua rute di bawah ini wajib bawa Cookie)
app.use('/api/wallets', requireAuth, walletRouter);
app.use('/api/transactions', requireAuth, transactionRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/export', requireAuth, exportRouter);
app.use('/api/budgets', requireAuth, budgetRouter);
app.use('/api/categories', requireAuth, categoryRouter);
app.use('/api/scan', requireAuth, scanRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/recurring', requireAuth, recurringRouter);

// 7. Global Error Handler
app.use(errorHandler);

// 8. Jalankan server hanya di mode lokal (Development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(env.PORT, () => {
    console.log(`🚀 ArthaFlow API Ready on port ${env.PORT}!`);
  });
}

// Ekspor app untuk Vercel Serverless Functions
export default app;