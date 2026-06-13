import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { LEAD_STATUSES } from '@geoscout/shared';
import { json, errorJson } from '@/lib/api';
import { db } from '@/db';
import { businesses } from '@/db/schema';
import { getBusinessDetail } from '@/lib/queries';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  if (!detail) return errorJson('Not found', 404);
  return json(detail);
}

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(5000).optional().nullable(),
  isArchived: z.boolean().optional(),
});

/** PATCH — update USER-owned fields only (status / notes / archive). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorJson('Invalid payload', 422, { issues: parsed.error.flatten() });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
  if (parsed.data.isArchived !== undefined) {
    update.isArchived = parsed.data.isArchived;
    // Keep status coherent with the archive flag.
    if (parsed.data.isArchived) update.status = 'archived';
  }

  const [row] = await db
    .update(businesses)
    .set(update)
    .where(eq(businesses.id, id))
    .returning();

  if (!row) return errorJson('Not found', 404);
  return json(row);
}
