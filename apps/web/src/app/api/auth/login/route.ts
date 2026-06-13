import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { signSession, setSessionCookie } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1);

  // Always run a compare to avoid leaking whether the email exists via timing.
  const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const passwordOk = await bcrypt.compare(password, hash);

  if (!user || !passwordOk) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
