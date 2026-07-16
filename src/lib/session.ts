import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./auth";

// For Route Handlers and Server Components — proxy.ts reads the cookie
// straight off NextRequest instead, since next/headers isn't usable there.
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

// proxy.ts gates page routes, but per Next's own guidance a matcher change
// can silently drop coverage — API routes that mutate state re-check the
// session themselves rather than relying on proxy alone.
export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}
