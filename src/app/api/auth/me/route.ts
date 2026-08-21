import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      fullName: schema.users.fullName,
      role: schema.users.role,
      tenantId: schema.users.tenantId,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  let tenant = null;
  if (user.tenantId) {
    const [t] = await db
      .select({
        id: schema.tenants.id,
        name: schema.tenants.name,
        slug: schema.tenants.slug,
        plan: schema.tenants.plan,
      })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, user.tenantId))
      .limit(1);
    tenant = t;
  }
  return NextResponse.json({ user, tenant });
}
