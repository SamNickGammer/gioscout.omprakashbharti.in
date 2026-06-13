import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { serverEnv } from '@/lib/env';
import { signSession, setSessionCookie } from '@/lib/auth';

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
  const emailOk = email.toLowerCase() === serverEnv.authEmail.toLowerCase();
  const passwordOk = await bcrypt.compare(password, serverEnv.authPasswordHash);

  // Constant-ish response regardless of which check failed.
  if (!emailOk || !passwordOk) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = await signSession({ email: serverEnv.authEmail });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
