import express from 'express';
import cors from 'cors';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './lib/db.js';

const testAuth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: 'pg' }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: "https://api-arthaflow.celvinandra.my.id",

  advanced: {
    useSecureCookies: true,
    cookieDomain: ".celvinandra.my.id",
    cookieSameSite: "Lax",
    cookiePath: "/",
    trustProxy: true,
  },

  oauthConfig: {
    skipStateCookieCheck: true,
  },

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    "https://arthaflow.celvinandra.my.id",
    "https://api-arthaflow.celvinandra.my.id",
  ],
});

const app = express();

app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'health with betterAuth db adapter ok',
    time: new Date().toISOString(),
    authCreated: !!testAuth,
  });
});

app.use(cors({
  origin: "https://arthaflow.celvinandra.my.id",
  credentials: true,
}));

export default app;