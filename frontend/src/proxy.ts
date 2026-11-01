import { NextResponse, type NextRequest } from "next/server";
import { ROLE_COOKIE, homePathForRole, isRole } from "@/lib/session";
import type { Role } from "@/types/api";
 
const BUYER_PATHS = ["/cart", "/checkout", "/orders", "/account"];
 
const startsWithPath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);
 
/** Which role a path belongs to, or null for public pages */
function requiredRole(pathname: string): Role | null {
  if (startsWithPath(pathname, "/seller")) return "seller";
  if (startsWithPath(pathname, "/admin")) return "admin";
  if (BUYER_PATHS.some((base) => startsWithPath(pathname, base))) return "buyer";
  return null;
}
 
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
 
  const needed = requiredRole(pathname);
  if (!needed) return NextResponse.next();
 
  const cookie = request.cookies.get(ROLE_COOKIE)?.value;
 
  // not logged in: send to login, and come back here afterwards
  if (!isRole(cookie)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
 
  // logged in as the wrong role: send to their own home page
  if (cookie !== needed) {
    return NextResponse.redirect(new URL(homePathForRole(cookie), request.url));
  }
 
  return NextResponse.next();
}
 
// runs only on the private sections, never on public pages or static files
export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/account/:path*",
    "/seller/:path*",
    "/admin/:path*",
  ],
};
 
