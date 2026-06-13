import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { json, errorJson } from '@/lib/api';
import { db } from '@/db';
import { filterTemplates } from '@/db/schema';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(filterTemplates).where(eq(filterTemplates.id, id));
  return json({ ok: true });
}
