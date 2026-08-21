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

    // Create tenant + admin user in a transaction
    const passwordHash = await hashPassword(data.password);
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: data.labName,
        slug: data.labSlug,
        city: data.city,
        phone: data.phone,
        plan: "trial",
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .returning();

    const [user] = await db
      .insert(schema.users)
      .values({
        tenantId: tenant.id,
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: "lab_admin",
      })
      .returning();

    // Create session
    const token = await createSessionToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email,
    });
    await setSessionCookie(token);

    await logAudit("signup", {
      tenantId: tenant.id,
      userId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    });

    return NextResponse.json({
      ok: true,
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    return jsonError(err);
  }
}
