import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  baseURL: `${env.BETTER_AUTH_URL}/api/auth`,

  advanced: {
    cookiePrefix: "arthaflow",
    crossSite: true,
    useSecureCookies: true,
    cookiePath: "/",
  },

  // Izin domain frontend lo
  trustedOrigins: [env.FRONTEND_URL],

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        mapUserToProfile: true,
        // Biarkan Better Auth handle rute callback secara internal
      }
    } : {})
  },
});