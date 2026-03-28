import postgres from 'postgres';
import { env } from './env.js';

const cleanUrl = env.DATABASE_URL.split('?')[0];

const client = postgres(cleanUrl, {
  ssl: 'require',
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = {
  clientCreated: !!client,
} as any;