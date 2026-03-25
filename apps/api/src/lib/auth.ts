import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),

  // ✅ Base URL API (tanpa /api/auth)
  baseURL: "https://arthaflow-api.vercel.app",

  secret: env.BETTER_AUTH_SECRET,

  advanced: {
    useSecureCookies: true,
    cookieSameSite: "None",   // ✅ Wajib untuk cross-domain cookie
    cookiePath: "/",
    trustProxy: true,
    generateId: () => crypto.randomUUID(), // ✅ Pastiin ID generation konsisten
    crossSubdomainCookies: {
      enabled: false,         // ✅ Beda domain (bukan subdomain), jadi false
    },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: "none",       // ✅ lowercase "none" untuk cookie attributes
      partitioned: true,      // ✅ Fix untuk Chrome CHIPS policy (third-party cookie)
    },
  },

  // ✅ Semua origin yang diizinkan — include API sendiri biar callback bisa jalan
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