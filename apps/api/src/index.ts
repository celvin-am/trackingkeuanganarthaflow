import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { settingsRouter } from './routes/settings.route.js';

const app = express();

app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'health with settings route ok',
    time: new Date().toISOString(),
    authLoaded: !!auth,
  });
});

app.use(cors({
  origin: "https://arthaflow.celvinandra.my.id",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-better-auth-id'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.all('/api/auth/*', toNodeHandler(auth));

app.get('/api/protected-test', requireAuth, (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'protected route works',
    userId: req.user?.id ?? null,
    email: req.user?.email ?? null,
  });
});

app.use('/api/settings', requireAuth, settingsRouter);

export default app;