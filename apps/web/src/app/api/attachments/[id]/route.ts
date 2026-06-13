import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { json, errorJson } from '@/lib/api';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { deleteObject } from '@/lib/r2';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
  if (!row) return errorJson('Not found', 404);

  try {
    await deleteObject(row.fileKey);
  } catch (err) {
    console.error('[attachments] R2 delete failed', err);
  }
  await db.delete(attachments).where(eq(attachments.id, id));
  return json({ ok: true });
}
