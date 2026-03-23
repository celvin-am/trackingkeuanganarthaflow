import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// 🔥 IMPORT SEMUA ROUTER LO DISINI
import { walletRouter } from './routes/wallet.route.js';
import { transactionRouter } from './routes/transaction.route.js';
import { dashboardRouter } from './routes/dashboard.route.js';
import { categoryRouter } from './routes/category.route.js';
import { settingsRouter } from './routes/settings.route.js';

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Better Auth Handler
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 🔥 PASANG ROUTE DISINI (Support jalur /api dan jalur root buat Vercel)
const routes = [
  { path: '/wallets', router: walletRouter },
  { path: '/transactions', router: transactionRouter },
  { path: '/dashboard', router: dashboardRouter },
  { path: '/categories', router: categoryRouter },
  { path: '/settings', router: settingsRouter },
];

routes.forEach(route => {
  // Kita pasang dua-duanya biar aman di lokal & vercel proxy
  app.use([`/api${route.path}`, route.path], requireAuth, route.router);
});

app.use(errorHandler);

export default app;