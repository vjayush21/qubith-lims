import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { hashPassword, createSessionToken, setSessionCookie, logAudit } from "@/lib/auth";
import { withAuth, jsonError } from "@/lib/api-helpers";
import { eq } from "drizzle-orm";

const signupSchema = z.object({
  labName: z.string().min(2).max(120),
  labSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  city: z.string().min(2).max(80).optional(),
  phone: z.string().min(7).max(20).optional(),
  fullName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    // Check slug uniqueness
    const [existing] = await db
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, data.labSlug))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "Lab slug already taken" }, { status: 409 });
    }

    // Check email uniqueness
    const [existingUser] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, data.email))
      .limit(1);
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Create tenant + admin user using raw SQL
    const passwordHash = await hashPassword(data.password);
    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 30 * 24 * 60 * 60; // 30 days

    const { getRawDb } = await import("@/db/client");
    const rawDb = getRawDb();

    rawDb
      .prepare(
        `INSERT INTO tenants (id, name, slug, address, city, phone, email, logo_url, nabl_accredited, plan, plan_expires_at, is_active, created_at, updated_at)
         VALUES (?, ?, ?, NULL, ?, ?, NULL, NULL, 0, 'trial', ?, 1, ?, ?)`
      )
      .run(tenantId, data.labName, data.labSlug, data.city, data.phone, expiresAt, now, now);

    rawDb
      .prepare(
        `INSERT INTO users (id, tenant_id, email, password_hash, full_name, phone, role, mci_number, is_active, last_login_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, 'lab_admin', NULL, 1, NULL, ?, ?)`
      )
      .run(userId, tenantId, data.email, passwordHash, data.fullName, now, now);

    // Create session
    const token = await createSessionToken({
      userId,
      tenantId,
      role: "lab_admin",
      email: data.email,
    });
    await setSessionCookie(token);

    await logAudit("signup", {
      tenantId,
      userId,
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    });

    return NextResponse.json({
      ok: true,
      tenant: { id: tenantId, slug: data.labSlug, name: data.labName },
      user: { id: userId, email: data.email, fullName: data.fullName, role: "lab_admin" },
    });
  } catch (err) {
    return jsonError(err);
  }
}
