import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: "https://arthaflow-api.vercel.app",
  secret: env.BETTER_AUTH_SECRET,

  advanced: {
    useSecureCookies: true,
    cookieSameSite: "None",
    cookiePath: "/",
    trustProxy: true,
  },

  // ✅ FIX state mismatch — karena web dan API beda domain,
  // signed cookie state tidak bisa ikut ke callback.
  // State tetap divalidasi via database (verification table).
  oauthConfig: {
    skipStateCookieCheck: true,
  },

  trustedOrigins: [
    "https://arthaflow-web.vercel.app",
    "https://arthaflow-api.vercel.app",
  ],

  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
    }
  },
});