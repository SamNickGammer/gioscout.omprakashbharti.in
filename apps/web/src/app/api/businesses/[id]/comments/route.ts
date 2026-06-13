import { type NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { addCommentSchema } from '@geoscout/shared';
import { json, errorJson } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { leadComments, users } from '@/db/schema';

export const runtime = 'nodejs';

/** GET — the comment thread for a lead, with author names. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = await db
    .select({
      id: leadComments.id,
      body: leadComments.body,
      createdAt: leadComments.createdAt,
      authorId: leadComments.userId,
      authorName: users.name,
    })
    .from(leadComments)
    .leftJoin(users, eq(leadComments.userId, users.id))
    .where(eq(leadComments.businessId, id))
    .orderBy(asc(leadComments.createdAt));
  return json(rows);
}

/** POST — add a comment, attributed to the signed-in user. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return errorJson('Unauthorized', 401);

  const { id } = await params;
  const parsed = addCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorJson('Invalid payload', 422);

  const [row] = await db
    .insert(leadComments)
    .values({ businessId: id, userId: session.userId, body: parsed.data.body })
    .returning();

  return json({ ...row, authorName: session.name });
}
