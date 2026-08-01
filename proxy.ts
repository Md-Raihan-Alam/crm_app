import { NextRequest, NextResponse } from "next/server";

// Paths that require the user to be logged in.
const PROTECTED_PATHS = [
  "/dashboard",
  "/customers",
  "/tasks",
  "/notes",
  "/reports",
  "/settings",
];

// Paths a logged-in user shouldn't see again (login/register).
const AUTH_PATHS = ["/login", "/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session_token")?.value;

  // proxy.ts runs on the Node.js runtime in Next.js 16 (unlike the old
  // Edge-only middleware.ts), but we still keep this check lightweight —
  // token presence only. Full validation (is it valid? what role?) stays
  // in requireAuth/requireRole, called from layouts and route handlers,
  // so the real security boundary never depends on this file alone.

  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtectedPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/tasks/:path*",
    "/notes/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
