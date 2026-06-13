import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { json, errorJson } from '@/lib/api';
import { serverEnv } from '@/lib/env';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { uploadObject, publicUrlFor } from '@/lib/storage';

export const runtime = 'nodejs';

const businessIdSchema = z.string().uuid();

/**
 * Uploads a lead attachment to Supabase Storage and records it.
 * Accepts multipart/form-data: `file` + `businessId`. The file bytes pass
 * through the server (uploaded with the service-role key) — simple and avoids
 * exposing storage credentials to the browser.
 */
export async function POST(req: NextRequest) {
  if (!serverEnv.supabase.configured) {
    return errorJson('Supabase Storage is not configured', 501);
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const businessIdRaw = form?.get('businessId');

  if (!(file instanceof File) || typeof businessIdRaw !== 'string') {
    return errorJson('Expected `file` and `businessId`', 422);
  }
  const businessId = businessIdSchema.safeParse(businessIdRaw);
  if (!businessId.success) return errorJson('Invalid businessId', 422);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${businessId.data}/${crypto.randomUUID()}-${safeName}`;
  const contentType = file.type || 'application/octet-stream';

  try {
    await uploadObject(key, await file.arrayBuffer(), contentType);
  } catch (err) {
    console.error('[attachments] upload failed', err);
    return errorJson('Upload to storage failed', 502);
  }

  const [row] = await db
    .insert(attachments)
    .values({
      businessId: businessId.data,
      fileKey: key,
      fileName: file.name,
      mime: contentType,
      size: file.size,
    })
    .returning();

  return json({ ...row, url: publicUrlFor(row.fileKey) });
}
