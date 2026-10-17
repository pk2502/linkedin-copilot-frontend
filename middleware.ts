import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/navigation";

const PUBLIC_ROUTES = ["/login", "/register"];
const PROTECTED_PREFIX = "/dashboard";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // ac_session is a presence flag set by the client; access_token is the
  // legacy cookie from before it existed (remove the fallback after 2026-10-23,
  // once every session has refreshed or expired).
  const token = request.cookies.has("ac_session") || request.cookies.has("access_token");

  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isPublicAuth = PUBLIC_ROUTES.includes(pathname);

  // No token + trying to access protected route → redirect to login
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Has token + trying to access login/register → go to ?next= (same-site only) or dashboard
  if (isPublicAuth && token) {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(request.nextUrl.searchParams.get("next"));
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
