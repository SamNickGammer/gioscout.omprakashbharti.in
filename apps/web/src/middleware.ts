import { NextResponse, type NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

/**
 * Guards the dashboard and its data APIs. The /api/ingest and scan-job routes
 * are intentionally NOT matched here — they authenticate with the x-api-key
 * header (the extension has no session cookie).
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const { pathname } = req.nextUrl;

  const isLogin = pathname === '/login';

  if (!session && !isLogin) {
    // Protected API routes get a 401 JSON; pages get redirected to login.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (session && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except: ingest/scan-job APIs, auth API, next internals, assets.
  matcher: [
    '/((?!api/ingest|api/scan-jobs|api/auth|_next/static|_next/image|favicon.ico|logo.png|logofull.png|.*\\.png$).*)',
  ],
};
