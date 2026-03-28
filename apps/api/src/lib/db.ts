import { env } from './env.js';

export const db = {
  hasDatabaseUrl: !!env.DATABASE_URL,
} as any;