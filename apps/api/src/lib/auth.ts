import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db.js';

const authBaseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
const isProductionCustomDomain =
  authBaseUrl === 'https://api-arthaflow.celvinandra.my.id';
const isPreviewVercel = authBaseUrl.includes('.vercel.app');

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(getDb(), { provider: 'pg' }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: authBaseUrl,

  advanced: {
    useSecureCookies: true,
    cookieDomain: isProductionCustomDomain ? '.celvinandra.my.id' : undefined,
    cookieSameSite: isPreviewVercel ? 'none' : 'lax',
    cookiePath: '/',
    trustProxy: true,
  },

  oauthConfig: {
    skipStateCookieCheck: true,
  },

  emailAndPassword: {
    enabled: true,
  },

  bearerAuth: {
    enabled: true,
  },

  trustedOrigins: [
    'https://arthaflow.celvinandra.my.id',
    'https://api-arthaflow.celvinandra.my.id',
    'https://arthaflow-web-git-feat-mobile-responsive-celvin-ams-projects.vercel.app',
    'https://arthaflow-api-git-feat-mobile-responsive-celvin-ams-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://192.168.100.11:5173',
    'http://192.168.100.11:3000',
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