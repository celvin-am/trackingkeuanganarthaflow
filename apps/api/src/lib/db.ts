import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema/index.js';

type AppDb = PostgresJsDatabase<typeof schema>;

let _client: ReturnType<typeof postgres> | null = null;
let _db: AppDb | null = null;

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

export function getDb(): AppDb {
  if (!_db) {
    _db = drizzle(getDbClient(), { schema });
  }

  return _db;
}

export const db: AppDb = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});