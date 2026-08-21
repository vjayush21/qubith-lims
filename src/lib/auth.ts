import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-jwt-secret-change-me-in-real-deployments-3f9a8b2c1e"
);
const COOKIE_NAME = "lims_session";
const SESSION_DAYS = 7;

export interface SessionPayload {
  userId: string;
  tenantId: string | null;
  role: string;
  email: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      tenantId: (payload.tenantId as string) || null,
      role: payload.role as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function loginUser(email: string, password: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  if (!user || !user.passwordHash || !user.isActive) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));
  return user;
}

export async function logAudit(
  action: string,
  opts: {
    tenantId?: string | null;
    userId?: string | null;
    resource?: string | null;
    metadata?: unknown;
    ipAddress?: string | null;
    userAgent?: string | null;
  } = {}
) {
  // Use raw SQL to bypass Drizzle's parameter binding issues
  const { getRawDb } = await import("@/db/client");
  const rawDb = getRawDb();
  const now = Math.floor(Date.now() / 1000);
  rawDb
    .prepare(
      `INSERT INTO audit_logs (id, tenant_id, user_id, action, resource, metadata, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      crypto.randomUUID(),
      opts.tenantId ?? null,
      opts.userId ?? null,
      action,
      opts.resource ?? null,
      opts.metadata ? JSON.stringify(opts.metadata) : null,
      opts.ipAddress ?? null,
      opts.userAgent ?? null,
      now
    );
}
