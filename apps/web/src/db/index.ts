import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example → apps/web/.env.local');
}

// Reuse one client across HMR reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// `prepare: false` keeps us compatible with Supabase's transaction pooler (pgBouncer).
const client =
  globalForDb.pgClient ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== 'production') globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
