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

app.get('/api/test', (_req, res) => {
  res.status(200).json({
    ok: true,
    route: 'test',
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

export default app;