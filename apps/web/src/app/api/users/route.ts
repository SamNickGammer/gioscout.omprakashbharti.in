import { type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { asc, sql } from 'drizzle-orm';
import { createUserSchema } from '@geoscout/shared';
import { json, errorJson } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { generateApiKey } from '@/lib/keys';
import { db } from '@/db';
import { users } from '@/db/schema';

export const runtime = 'nodejs';

/** GET /api/users — any signed-in user; returns public fields for attribution UIs. */
export async function GET() {
  const session = await getSession();
  if (!session) return errorJson('Unauthorized', 401);

  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .orderBy(asc(users.name));
  return json(rows);
}

/** POST /api/users — ADMIN only; creates a teammate with a fresh API key. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorJson('Unauthorized', 401);
  if (session.role !== 'admin') return errorJson('Admins only', 403);

  const parsed = createUserSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorJson('Invalid payload', 422, { issues: parsed.error.flatten() });
  }

  const { email, name, password, role } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1);
  if (existing) return errorJson('A user with that email already exists', 409);

  const [row] = await db
    .insert(users)
    .values({
      email,
      name,
      role,
      passwordHash: bcrypt.hashSync(password, 10),
      apiKey: generateApiKey(),
    })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

  return json(row);
}
