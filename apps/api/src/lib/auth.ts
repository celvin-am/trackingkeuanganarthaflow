import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from './env.js';
import { db } from './db.js';

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: "https://api-arthaflow.celvinandra.my.id",
  secret: env.BETTER_AUTH_SECRET,

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

  emailAndPassword: { enabled: true },

  trustedOrigins: [
    "https://arthaflow.celvinandra.my.id",
    "https://api-arthaflow.celvinandra.my.id",
  ],

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => ({
        name: profile.name,
        email: profile.email,
        emailVerified: profile.email_verified ?? false,
        image: profile.picture ?? null,
      }),
    }
  },
});