import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { withTenant, jsonError } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { logAudit } from "@/lib/auth";

const createSchema = z.object({
  orderTestId: z.string().uuid(),
  value: z.string().max(200).optional(),
  numericValue: z.string().max(50).optional(),
  unit: z.string().max(30).optional(),
  referenceRange: z.string().max(100).optional(),
  isAbnormal: z.boolean().default(false),
  isCritical: z.boolean().default(false),
  remarks: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    return await withTenant(req, async (session) => {
      const body = await req.json();
      const data = createSchema.parse(body);

      // Verify order test belongs to tenant
      const [ot] = await db
        .select({
          id: schema.orderTests.id,
          orderId: schema.orderTests.orderId,
        })
        .from(schema.orderTests)
        .where(
          and(
            eq(schema.orderTests.id, data.orderTestId),
            eq(schema.orderTests.tenantId, session.tenantId)
          )
        )
        .limit(1);
      if (!ot) {
        return NextResponse.json({ error: "Order test not found" }, { status: 404 });
      }

      // Upsert result
      const [result] = await db
        .insert(schema.results)
        .values({
          tenantId: session.tenantId,
          orderTestId: data.orderTestId,
          value: data.value,
          numericValue: data.numericValue,
          unit: data.unit,
          referenceRange: data.referenceRange,
          isAbnormal: data.isAbnormal,
          isCritical: data.isCritical,
          remarks: data.remarks,
          enteredById: session.userId,
        })
        .onConflictDoUpdate({
          target: schema.results.orderTestId,
          set: {
            value: data.value,
            numericValue: data.numericValue,
            unit: data.unit,
            referenceRange: data.referenceRange,
            isAbnormal: data.isAbnormal,
            isCritical: data.isCritical,
            remarks: data.remarks,
            enteredById: session.userId,
            updatedAt: new Date(),
          },
        })
        .returning();

      // Update order test status
      await db
        .update(schema.orderTests)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(schema.orderTests.id, data.orderTestId));

      await logAudit("enter_result", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `result:${result.id}`,
        metadata: { orderTestId: data.orderTestId, isCritical: data.isCritical },
      });

      return NextResponse.json({ result });
    });
  } catch (err) {
    return jsonError(err);
  }
}
