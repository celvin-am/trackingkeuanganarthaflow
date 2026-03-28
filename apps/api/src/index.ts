import express from 'express';

const app = express();

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'minimal health ok',
    time: new Date().toISOString(),
  });
});

app.get('/api/test', (_req, res) => {
  res.status(200).json({
    ok: true,
    route: 'test',
  });
});

export default app;