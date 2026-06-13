import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from './env';

let admin: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the SERVICE ROLE key. Used for storage
 * (upload/delete) — never expose this key to the browser. The dashboard data
 * itself goes through Drizzle/Postgres directly, not this client.
 */
export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  admin = createClient(serverEnv.supabase.url, serverEnv.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
