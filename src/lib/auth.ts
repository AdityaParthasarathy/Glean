import crypto from "crypto";
import type { Account, Role } from "./types";

export const SESSION_COOKIE = "glean_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Demo-only fallback — override with a real SESSION_SECRET env var outside
// of this hackathon context. There's no other secret-management infra here.
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "glean-demo-session-secret-do-not-use-in-production";

export interface SessionPayload {
  accountId: string;
  role: Role;
  retailerId: string | null;
  ngoId: string | null;
  displayName: string;
  exp: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedBuffer = crypto.scryptSync(password, salt, 64);
  return (
    hashBuffer.length === suppliedBuffer.length &&
    crypto.timingSafeEqual(hashBuffer, suppliedBuffer)
  );
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
}

// Stateless signed session token: base64url(payload).base64url(hmac). Role
// and scoped ids are embedded so proxy.ts can authorize routes without a DB
// read on every request.
export function createSessionToken(account: Account): string {
  const payload: SessionPayload = {
    accountId: account.id,
    role: account.role,
    retailerId: account.retailerId,
    ngoId: account.ngoId,
    displayName: account.displayName,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(
  token: string | undefined | null
): SessionPayload | null {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expected = sign(encoded);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function roleHome(role: Role): string {
  if (role === "admin") return "/glean";
  if (role === "retailer") return "/retailer";
  return "/ngo";
}
