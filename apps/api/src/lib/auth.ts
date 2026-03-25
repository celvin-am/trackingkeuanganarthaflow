import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: "https://api-arthaflow.celvinandra.my.id",
  secret: env.BETTER_AUTH_SECRET,

  advanced: {
    useSecureCookies: true,
    // 🔥 KUNCI UTAMA: Titik di depan biar tembus antar subdomain
    cookieDomain: ".celvinandra.my.id",
    cookieSameSite: "Lax",
    cookiePath: "/",
    trustProxy: true,
  },

  bearerAuth: {
    enabled: true,
  },

  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') || [
    "https://arthaflow.celvinandra.my.id",
    "https://api-arthaflow.celvinandra.my.id"
  ],

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      // ✅ FIX: Simpan URL foto, bukan base64 biar gak lemot
      mapProfileToUser: (profile) => ({
        name: profile.name,
        email: profile.email,
        emailVerified: profile.email_verified ?? false,
        image: profile.picture ?? null,
      }),
    }
  },
});