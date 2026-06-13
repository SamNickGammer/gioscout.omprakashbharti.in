import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { json, errorJson } from '@/lib/api';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { publicUrlFor } from '@/lib/r2';

export const runtime = 'nodejs';

const bodySchema = z.object({
  businessId: z.string().uuid(),
  key: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mime: z.string().max(128).optional(),
  size: z.number().int().min(0).optional(),
});

/** Records an attachment row after a successful R2 upload. */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorJson('Invalid payload', 422);

  const { businessId, key, fileName, mime, size } = parsed.data;
  const [row] = await db
    .insert(attachments)
    .values({ businessId, fileKey: key, fileName, mime: mime ?? null, size: size ?? null })
    .returning();

  return json({ ...row, url: publicUrlFor(row.fileKey) });
}
