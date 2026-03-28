import express from 'express';
import cors from 'cors';
import { betterAuth } from 'better-auth';

const app = express();

app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'health with better-auth package import ok',
    time: new Date().toISOString(),
    betterAuthLoaded: typeof betterAuth === 'function',
  });
});

app.use(cors({
  origin: "https://arthaflow.celvinandra.my.id",
  credentials: true,
}));

export default app;