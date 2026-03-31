import express from 'express';
import cors from 'cors';

const app = express();

app.set('trust proxy', 1);

const exactAllowedOrigins = new Set([
  'http://localhost:5173',
  'http://192.168.100.11:5173',
  'https://arthaflow.celvinandra.my.id',
]);

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (exactAllowedOrigins.has(origin)) return true;

  return /^https:\/\/arthaflow-web-git-[a-z0-9-]+-celvin-ams-projects\.vercel\.app$/.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-better-auth-id'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'api isolated health ok',
    time: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

const PORT = Number(process.env.PORT || 3000);
const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

export default app;