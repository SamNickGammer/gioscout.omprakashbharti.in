import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { serverEnv } from './env';

export const SESSION_COOKIE = 'geoscout_session';
const ALG = 'HS256';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  email: string;
}

function secretKey() {
  return new TextEncoder().encode(serverEnv.jwtSecret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

/** Edge-safe verification (used by middleware and server components). */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
    if (typeof payload.email === 'string') return { email: payload.email };
    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const SESSION_MAX_AGE = MAX_AGE;
