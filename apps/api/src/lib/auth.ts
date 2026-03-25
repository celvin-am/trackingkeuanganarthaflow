import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),

  // 🔥 baseURL HARUS nembak domain API lo sendiri (Bukan WEB!)
  baseURL: "https://arthaflow-api.vercel.app/api/auth",

  advanced: {
    useSecureCookies: true,
    // 🔥 Ganti ke "None" biar Cookie bisa nyebrang dari API ke WEB
    cookieSameSite: "None",
    cookiePath: "/",
    // 🔥 trustProxy set ke true tetep aman di Vercel
    trustProxy: true,
  },

  // 🔥 Tambahin domain WEB lo di sini biar diijinin akses
  trustedOrigins: ["https://arthaflow-web.vercel.app"],

  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      // 🔥 Pastiin mapUserToProfile aktif biar email ketarik
      mapUserToProfile: true,
    }
  },
});