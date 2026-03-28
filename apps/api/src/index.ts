import express from 'express';
import cors from 'cors';

const app = express();

app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => {
  const raw = process.env.DATABASE_URL ?? '';

  let parsed: Record<string, unknown> = {};
  try {
    const url = new URL(raw);
    parsed = {
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      username: url.username,
      hasPassword: !!url.password,
      search: url.search,
      startsWithPostgres: raw.startsWith('postgresql://') || raw.startsWith('postgres://'),
      hasWhitespace: /^\s|\s$/.test(raw),
      length: raw.length,
    };
  } catch (e) {
    parsed = {
      parseError: e instanceof Error ? e.message : String(e),
      startsWithPostgres: raw.startsWith('postgresql://') || raw.startsWith('postgres://'),
      hasWhitespace: /^\s|\s$/.test(raw),
      length: raw.length,
      preview: raw.slice(0, 40),
    };
  }

  res.status(200).json({
    ok: true,
    message: 'env debug',
    ...parsed,
  });
});

app.use(cors({
  origin: "https://arthaflow.celvinandra.my.id",
  credentials: true,
}));

export default app;