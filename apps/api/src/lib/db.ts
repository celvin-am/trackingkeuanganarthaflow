import postgres from 'postgres';

const client = postgres('postgresql://invalid:invalid@127.0.0.1:6543/postgres', {
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 1,
});

export const db = {
  clientCreated: !!client,
} as any;