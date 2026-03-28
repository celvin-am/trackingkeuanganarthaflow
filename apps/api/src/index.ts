import express from 'express';
import cors from 'cors';
import { db } from './lib/db.js';

const app = express();

app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'health with db import ok',
    time: new Date().toISOString(),
    dbLoaded: !!db,
  });
});

app.use(cors({
  origin: "https://arthaflow.celvinandra.my.id",
  credentials: true,
}));

export default app;