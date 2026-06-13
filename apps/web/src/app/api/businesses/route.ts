import { type NextRequest } from 'next/server';
import { leadFilterSchema } from '@geoscout/shared';
import { json, errorJson } from '@/lib/api';
import { listBusinesses } from '@/lib/queries';

export const runtime = 'nodejs';

/** GET /api/businesses?…filters — session-protected (see middleware). */
export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = leadFilterSchema.safeParse(raw);
  if (!parsed.success) {
    return errorJson('Invalid filters', 422, { issues: parsed.error.flatten() });
  }
  const result = await listBusinesses(parsed.data);
  return json(result);
}
