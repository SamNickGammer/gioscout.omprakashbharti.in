import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { json, errorJson } from '@/lib/api';
import { serverEnv } from '@/lib/env';
import { presignUpload } from '@/lib/r2';

export const runtime = 'nodejs';

const bodySchema = z.object({
  businessId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mime: z.string().min(1).max(128),
});

/** Returns a presigned PUT URL so the browser uploads directly to R2. */
export async function POST(req: NextRequest) {
  if (!serverEnv.r2.configured) {
    return errorJson('R2 storage is not configured', 501);
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorJson('Invalid payload', 422);

  const { businessId, fileName, mime } = parsed.data;
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  // No Date.now()/random available reliably; derive uniqueness from a UUID.
  const key = `attachments/${businessId}/${crypto.randomUUID()}-${safeName}`;

  const uploadUrl = await presignUpload(key, mime);
  return json({ uploadUrl, key });
}
