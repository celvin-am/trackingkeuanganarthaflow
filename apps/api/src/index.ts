import dotenv from 'dotenv';
dotenv.config({
  path: new URL('../.env', import.meta.url).pathname,
  override: true,
});
const dbUrl = process.env.DATABASE_URL || '';
console.log('DATABASE_URL loaded:', dbUrl ? 'YES' : 'NO');

import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

import { walletRouter } from './routes/wallet.route.js';
import { transactionRouter } from './routes/transaction.route.js';
import { dashboardRouter } from './routes/dashboard.route.js';
import { budgetRouter } from './routes/budget.route.js';
import { categoryRouter } from './routes/category.route.js';
import { settingsRouter } from './routes/settings.route.js';
import { scanRouter } from './routes/scan.route.js';
import { exportRouter } from './routes/export.route.js';

const app = express();

app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'api restored',
    time: new Date().toISOString(),
    authLoaded: !!auth,
  });
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.100.11:5173',
  'https://arthaflow.celvinandra.my.id',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-better-auth-id'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.all('/api/auth/*', toNodeHandler(auth));

app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/wallets', requireAuth, walletRouter);
app.use('/api/transactions', requireAuth, transactionRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/budgets', requireAuth, budgetRouter);
app.use('/api/categories', requireAuth, categoryRouter);
app.use('/api/scan', requireAuth, scanRouter);
app.use('/api/export', requireAuth, exportRouter);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);
const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

export default app;