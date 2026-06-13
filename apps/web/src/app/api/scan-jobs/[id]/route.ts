import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { closeScanJobSchema } from '@geoscout/shared';
import { authenticateApiKey, errorJson, json } from '@/lib/api';
import { db } from '@/db';
import { scanJobs } from '@/db/schema';

export const runtime = 'nodejs';

/** PATCH /api/scan-jobs/:id — extension closes a job with final counts. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticateApiKey(req);
  if (!user) return errorJson('Unauthorized', 401);

  const { id } = await params;
  const parsed = closeScanJobSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorJson('Invalid payload', 422, { issues: parsed.error.flatten() });
  }

  const { status, foundCount, newCount, updatedCount } = parsed.data;
  await db
    .update(scanJobs)
    .set({
      status,
      foundCount: foundCount ?? 0,
      newCount: newCount ?? 0,
      updatedCount: updatedCount ?? 0,
      completedAt: new Date(),
    })
    .where(eq(scanJobs.id, id));

  return json({ ok: true });
}
