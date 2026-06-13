import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { json, errorJson } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';

export const runtime = 'nodejs';

/** DELETE /api/users/:id — ADMIN only; can't delete yourself. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return errorJson('Unauthorized', 401);
  if (session.role !== 'admin') return errorJson('Admins only', 403);

  const { id } = await params;
  if (id === session.userId) return errorJson("You can't delete your own account", 400);

  await db.delete(users).where(eq(users.id, id));
  return json({ ok: true });
}
