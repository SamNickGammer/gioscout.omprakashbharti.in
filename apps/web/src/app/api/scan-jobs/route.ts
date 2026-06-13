import { type NextRequest } from 'next/server';
import { openScanJobSchema } from '@geoscout/shared';
import { authenticateApiKey, errorJson, json } from '@/lib/api';
import { db } from '@/db';
import { scanJobs } from '@/db/schema';

export const runtime = 'nodejs';

/** POST /api/scan-jobs — extension opens a job at the start of a run. */
export async function POST(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (!user) return errorJson('Unauthorized', 401);

  const parsed = openScanJobSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorJson('Invalid payload', 422, { issues: parsed.error.flatten() });
  }

  const [row] = await db
    .insert(scanJobs)
    .values({
      query: parsed.data.query,
      category: parsed.data.category ?? null,
      area: parsed.data.area ?? null,
      source: parsed.data.source ?? 'extension',
      status: 'running',
      userId: user.id,
    })
    .returning({ id: scanJobs.id });

  return json({ id: row.id });
}
