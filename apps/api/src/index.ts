import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Import routers
import { walletRouter } from './routes/wallet.route.js';
import { transactionRouter } from './routes/transaction.route.js';
import { dashboardRouter } from './routes/dashboard.route.js';
import { budgetRouter } from './routes/budget.route.js';
import { categoryRouter } from './routes/category.route.js';
import { settingsRouter } from './routes/settings.route.js';

const app = express();

// 1. Set Trust Proxy (Wajib buat Vercel)
app.set('trust proxy', 1);

// 2. Health Check (TARUH PALING ATAS!)
// Biar kita tau servernya "hidup" tanpa perlu nunggu koneksi DB/Auth
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server ArthaFlow is running!',
    timestamp: new Date().toISOString()
  });
});

// 3. CORS Configuration
app.use(cors({
  origin: "https://arthaflow.celvinandra.my.id",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-better-auth-id'],
}));

// 4. Body Parsers (Sebelum Auth Handler)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Better Auth Handler
app.all('/api/auth/*', toNodeHandler(auth));

// 6. Routes Mapping
const apiRoutes = [
  { path: '/wallets', router: walletRouter },
  { path: '/transactions', router: transactionRouter },
  { path: '/dashboard', router: dashboardRouter },
  { path: '/budgets', router: budgetRouter },
  { path: '/categories', router: categoryRouter },
  { path: '/settings', router: settingsRouter },
];

apiRoutes.forEach(route => {
  // Pakai rute /api di depannya
  app.use(`/api${route.path}`, requireAuth, route.router);
});

// 7. Error Handler (Paling Bawah)
app.use(errorHandler);

export default app;