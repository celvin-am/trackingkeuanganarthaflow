import express from 'express';
import cors from 'cors';
import { auth } from './lib/auth.js';

const app = express();

app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'health using auth module ok',
    time: new Date().toISOString(),
    authLoaded: !!auth,
  });
});

app.use(cors({
  origin: "https://arthaflow.celvinandra.my.id",
  credentials: true,
}));

export default app;