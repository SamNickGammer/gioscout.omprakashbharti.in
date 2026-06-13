import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, type User } from '@/db/schema';

export function json<T>(data: T, init?: number | ResponseInit) {
  const responseInit = typeof init === 'number' ? { status: init } : init;
  return NextResponse.json(data, responseInit);
}

export function errorJson(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Authenticates an extension request by its `x-api-key` header against the
 * per-user API keys. Returns the owning user (so scans/leads are attributed)
 * or null if the key is missing/unknown.
 */
export async function authenticateApiKey(req: NextRequest): Promise<User | null> {
  const provided = req.headers.get('x-api-key')?.trim();
  if (!provided) return null;
  const [user] = await db.select().from(users).where(eq(users.apiKey, provided)).limit(1);
  return user ?? null;
}
