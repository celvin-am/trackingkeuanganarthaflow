import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db.js';

const isProduction = process.env.NODE_ENV === 'production';

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(getDb(), { provider: 'pg' }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  advanced: {
    useSecureCookies: isProduction,
    cookieDomain: isProduction ? '.celvinandra.my.id' : undefined,
    cookieSameSite: 'lax',
    cookiePath: '/',
    trustProxy: true,
  },

  oauthConfig: {
    skipStateCookieCheck: true,
  },

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://192.168.100.11:5173',
    'http://192.168.100.11:3000',
    'https://arthaflow.celvinandra.my.id',
    'https://api-arthaflow.celvinandra.my.id',
    'https://arthaflow-web-git-feat-mobile-responsive-celvin-ams-projects.vercel.app',
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