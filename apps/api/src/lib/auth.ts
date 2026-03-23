import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  // 1. Pastikan baseURL nembak endpoint auth lengkap
  baseURL: `${env.BETTER_AUTH_URL}/api/auth`,

  advanced: {
    cookiePrefix: "arthaflow",
    crossSite: true,
    useSecureCookies: true,
    // 🔥 BARIS SAKTI: Biar cookie bisa dibaca di rute lain (kayak /api/settings)
    cookiePath: "/",
  },

  // 2. Izin domain frontend
  trustedOrigins: [env.FRONTEND_URL],

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        // 🔥 BARIS SAKTI: Paksa Google balikin user ke WEB, bukan ke API
        mapUserToProfile: true, // Kadang butuh ini buat konsistensi data
        callbackURL: `${env.FRONTEND_URL}/dashboard`,
      }
    } : {})
  },
});