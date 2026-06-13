import { NextResponse, type NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

/**
 * Guards the dashboard and its data APIs. The landing page (/) is public.
 * Ingest/scan-job/auth APIs are NOT matched here — they authenticate with the
 * x-api-key header or handle their own auth.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === '/login';

  if (session && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (!session && !isLogin) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/api/businesses/:path*',
    '/api/users/:path*',
    '/api/filter-templates/:path*',
    '/api/attachments/:path*',
  ],
};
