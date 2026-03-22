import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
  console.warn('--- WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Social login will be disabled. ---');
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  // --- BARIS SAKTI PENYEMBUH INVALID ORIGIN ---
  trustedOrigins: [env.FRONTEND_URL],
  // -------------------------------------------

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }
    } : {})
  },
});