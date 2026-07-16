import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDB } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, verifyPassword, roleHome } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
  }

  const db = readDB();
  const account = db.accounts.find((a) => a.username === username);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = createSessionToken(account);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    role: account.role,
    displayName: account.displayName,
    redirectTo: roleHome(account.role),
  });
}
