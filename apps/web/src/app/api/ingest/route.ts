import { type NextRequest } from 'next/server';
import { ingestPayloadSchema } from '@geoscout/shared';
import { checkIngestKey, errorJson, json } from '@/lib/api';
import { ingestBusinesses } from '@/lib/ingest';

export const runtime = 'nodejs';

/**
 * POST /api/ingest — the Chrome extension streams batches of scraped
 * businesses here. Authenticated with the shared `x-api-key` header (no
 * session cookie). Dedup/upsert handled by ingestBusinesses().
 */
export async function POST(req: NextRequest) {
  if (!checkIngestKey(req)) {
    return errorJson('Unauthorized', 401);
  }

  const parsed = ingestPayloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorJson('Invalid payload', 422, { issues: parsed.error.flatten() });
  }

  try {
    const result = await ingestBusinesses(parsed.data.businesses);
    return json(result);
  } catch (err) {
    console.error('[ingest] failed', err);
    return errorJson('Ingest failed', 500);
  }
}

// Lightweight health check for the extension's "Test connection" button.
export async function GET(req: NextRequest) {
  if (!checkIngestKey(req)) return errorJson('Unauthorized', 401);
  return json({ ok: true });
}
