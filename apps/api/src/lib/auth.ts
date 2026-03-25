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
    // ✅ Prevent duplicate cookies dengan SameSite berbeda
    disableCSRFCheck: true,
  },

  // ✅ Enable Bearer token — fix untuk Vercel proxy yang strip cookie cross-domain
  bearerAuth: {
    enabled: true,
  },

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
      // ✅ FIX: Simpan URL foto, bukan base64
      // Tanpa ini Better Auth download foto dan simpan sebagai base64 (400KB+!)
      mapProfileToUser: (profile) => ({
        name: profile.name,
        email: profile.email,
        emailVerified: profile.email_verified ?? false,
        image: profile.picture ?? null, // ✅ URL langsung dari Google
      }),
    }
  },
});