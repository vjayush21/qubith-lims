import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { withTenant, jsonError } from "@/lib/api-helpers";
import { eq, and, desc } from "drizzle-orm";

const createSchema = z.object({
  code: z.string().min(1).max(40).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(2).max(120),
  department: z.string().max(60).optional(),
  sampleType: z.string().max(40).optional(),
  pricePaise: z.number().int().min(0),
  tatHours: z.number().int().min(1).max(168).default(24),
});

export async function POST(req: NextRequest) {
  try {
    return await withTenant(req, async (session) => {
      const body = await req.json();
      const data = createSchema.parse(body);
      const [test] = await db
        .insert(schema.tests)
        .values({
          tenantId: session.tenantId,
          code: data.code,
          name: data.name,
          department: data.department,
          sampleType: data.sampleType,
          pricePaise: data.pricePaise,
          tatHours: data.tatHours,
        })
        .onConflictDoUpdate({
          target: [schema.tests.tenantId, schema.tests.code],
          set: {
            name: data.name,
            department: data.department,
            sampleType: data.sampleType,
            pricePaise: data.pricePaise,
            tatHours: data.tatHours,
          },
        })
        .returning();
      return NextResponse.json({ test });
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    return await withTenant(req, async (session) => {
      const tests = await db
        .select()
        .from(schema.tests)
        .where(
          and(
            eq(schema.tests.tenantId, session.tenantId),
            eq(schema.tests.isActive, true)
          )
        )
        .orderBy(schema.tests.name);
      return NextResponse.json({ tests });
    });
  } catch (err) {
    return jsonError(err);
  }
}
