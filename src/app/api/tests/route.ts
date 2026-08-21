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
      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);
      const { getRawDb } = await import("@/db/client");
      const rawDb = getRawDb();
      rawDb
        .prepare(
          `INSERT INTO tests (id, tenant_id, code, name, department, sample_type, price_paise, tat_hours, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
           ON CONFLICT (tenant_id, code) DO UPDATE SET
             name = excluded.name,
             department = excluded.department,
             sample_type = excluded.sample_type,
             price_paise = excluded.price_paise,
             tat_hours = excluded.tat_hours`
        )
        .run(
          id,
          session.tenantId,
          data.code,
          data.name,
          data.department ?? null,
          data.sampleType ?? null,
          data.pricePaise,
          data.tatHours,
          now
        );
      const test = {
        id,
        tenantId: session.tenantId,
        code: data.code,
        name: data.name,
        department: data.department ?? null,
        sampleType: data.sampleType ?? null,
        pricePaise: data.pricePaise,
        tatHours: data.tatHours,
        isActive: true,
        createdAt: new Date(now * 1000),
      };
      return { test };
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
