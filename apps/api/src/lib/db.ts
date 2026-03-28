import postgres from 'postgres';

export const db = {
  postgresLoaded: typeof postgres === 'function',
} as any;