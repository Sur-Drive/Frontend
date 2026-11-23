import { NextResponse, type NextRequest } from "next/server";

const LOGIN_ROUTES = ["/signin", "/login"];

// Route protection: /admin/* requires an accessToken cookie. The login routes
// sit in the matcher too so authenticated users are bounced to the admin home
// instead of seeing the sign-in form again.
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get("accessToken")?.value);
  const { pathname } = request.nextUrl;

  if (LOGIN_ROUTES.includes(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/signin", "/login"],
};