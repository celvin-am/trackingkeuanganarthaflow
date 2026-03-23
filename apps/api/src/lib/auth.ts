import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),

  // 🔥 baseURL harus nembak domain WEB (karena lewat proxy)
  baseURL: "https://arthaflow-web.vercel.app/api/auth",

  advanced: {
    cookiePrefix: "arthaflow",
    useSecureCookies: true,
    cookieSameSite: "Lax", // Proxy bikin ini jadi Same-Site, jadi aman pake Lax
    cookiePath: "/",
    // 🔥 WAJIB: Biar Better Auth percaya sama header dari Vercel Proxy
    trustProxy: true,
  },

  trustedOrigins: ["https://arthaflow-web.vercel.app"],

  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      mapUserToProfile: true,
    }
  },
});