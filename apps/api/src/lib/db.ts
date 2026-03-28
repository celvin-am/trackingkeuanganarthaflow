import postgres from 'postgres';
import { env } from './env.js';

const client = postgres(env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = {
  clientCreated: !!client,
} as any;