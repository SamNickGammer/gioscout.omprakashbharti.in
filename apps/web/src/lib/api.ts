import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from './env';

export function json<T>(data: T, init?: number | ResponseInit) {
  const responseInit = typeof init === 'number' ? { status: init } : init;
  return NextResponse.json(data, responseInit);
}

export function errorJson(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Validates the extension's shared ingest API key (timing-safe-ish). */
export function checkIngestKey(req: NextRequest): boolean {
  const provided = req.headers.get('x-api-key') ?? '';
  const expected = serverEnv.ingestApiKey;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
