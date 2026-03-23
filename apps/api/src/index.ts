import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Import routers
import { walletRouter } from './routes/wallet.route.js';
import { transactionRouter } from './routes/transaction.route.js';
import { dashboardRouter } from './routes/dashboard.route.js';
import { budgetRouter } from './routes/budget.route.js';
import { categoryRouter } from './routes/category.route.js';
import { scanRouter } from './routes/scan.route.js';
import { settingsRouter } from './routes/settings.route.js';

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Better Auth
app.all('/api/auth/*', toNodeHandler(auth));

// Payload limit gedein buat Base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get(['/', '/api/health'], (req, res) => res.json({ status: 'ok' }));

// Routes Mapping
const apiRoutes = [
  { path: '/wallets', router: walletRouter },
  { path: '/transactions', router: transactionRouter },
  { path: '/dashboard', router: dashboardRouter },
  { path: '/budgets', router: budgetRouter },
  { path: '/categories', router: categoryRouter },
  { path: '/settings', router: settingsRouter },
  { path: '/scan', router: scanRouter },
];

apiRoutes.forEach(route => {
  app.use([`/api${route.path}`, route.path], requireAuth, route.router);
});

app.use(errorHandler);

export default app;