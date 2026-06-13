import { type NextRequest } from 'next/server';
import { ingestPayloadSchema } from '@geoscout/shared';
import { authenticateApiKey, errorJson, json } from '@/lib/api';
import { ingestBusinesses } from '@/lib/ingest';

export const runtime = 'nodejs';

/**
 * POST /api/ingest — the Chrome extension streams batches of scraped
 * businesses here. Authenticated by the per-user `x-api-key`; the matched user
 * is credited as the lead's creator.
 */
export async function POST(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (!user) return errorJson('Unauthorized', 401);

  const parsed = ingestPayloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorJson('Invalid payload', 422, { issues: parsed.error.flatten() });
  }

  try {
    const result = await ingestBusinesses(parsed.data.businesses, user.id);
    return json(result);
  } catch (err) {
    console.error('[ingest] failed', err);
    return errorJson('Ingest failed', 500);
  }
}

// Lightweight health check for the extension's "Test connection" button.
export async function GET(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (!user) return errorJson('Unauthorized', 401);
  return json({ ok: true, user: { name: user.name, email: user.email } });
}
