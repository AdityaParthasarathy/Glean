import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, roleHome } from "@/lib/auth";
import type { Role } from "@/lib/types";

// Each protected route belongs to exactly one role — no overlap, even for
// admin. The Glean dispatch console already is the cross-cutting "superset"
// view (all retailers, all NGOs), so admin doesn't need to also log into
// /retailer or /ngo.
const ROUTE_ROLE: Record<string, Role> = {
  "/retailer": "retailer",
  "/glean": "admin",
  "/ngo": "ngo",
};

function requiredRoleFor(pathname: string): Role | null {
  for (const [prefix, role] of Object.entries(ROUTE_ROLE)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }
  return null;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL(roleHome(session.role), request.url));
    }
    return NextResponse.next();
  }

  const requiredRole = requiredRoleFor(pathname);
  if (!requiredRole) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.role !== requiredRole) {
    return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/retailer/:path*", "/glean/:path*", "/ngo/:path*", "/login"],
};
