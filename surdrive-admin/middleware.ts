import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_PATH = '/admin';

/**
 * Protects all /admin/* routes: requires an `accessToken` cookie.
 * Missing/invalid -> redirect to /signin. /signin itself is never blocked.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(ADMIN_PATH)) {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matches /admin and everything under it. Does not touch /signin.
  matcher: ['/admin/:path*'],
};