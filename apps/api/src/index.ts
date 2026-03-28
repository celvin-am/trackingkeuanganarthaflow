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

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => ({
        name: profile.name,
        email: profile.email,
        emailVerified: profile.email_verified ?? false,
        image: profile.picture ?? null,
      }),
    },
  },
});

const app = express();

app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'health with full auth config ok',
    time: new Date().toISOString(),
    authCreated: !!testAuth,
  });
});

app.use(cors({
  origin: "https://arthaflow.celvinandra.my.id",
  credentials: true,
}));

export default app;