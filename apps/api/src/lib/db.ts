import postgres from 'postgres';

let _client: ReturnType<typeof postgres> | null = null;

export function getDbClient() {
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

export const db = {} as any;