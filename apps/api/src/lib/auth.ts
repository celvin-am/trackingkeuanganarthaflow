import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db.js';

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(getDb(), { provider: 'pg' }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: "https://api-arthaflow.celvinandra.my.id",

  advanced: {
    useSecureCookies: true,
    cookieDomain: ".celvinandra.my.id",
    cookieSameSite: "Lax",
    cookiePath: "/",
    trustProxy: true,
  },

  oauthConfig: {
    skipStateCookieCheck: true,
  },

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    "https://arthaflow.celvinandra.my.id",
    "https://api-arthaflow.celvinandra.my.id",
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