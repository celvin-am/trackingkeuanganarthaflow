import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getDbClient() {
  if (!_client) {
    _client = postgres(process.env.DATABASE_URL!, {
      ssl: 'require',
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  return _client;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getDbClient());
  }

  return _db;
}

export const db = {} as any;