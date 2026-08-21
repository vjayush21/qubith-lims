import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTenant, jsonError } from "@/lib/api-helpers";
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

      const { getRawDb } = await import("@/db/client");
      const rawDb = getRawDb();

      // Verify order test belongs to tenant
      const ot = rawDb
        .prepare(`SELECT id, order_id FROM order_tests WHERE id = ? AND tenant_id = ?`)
        .get(data.orderTestId, session.tenantId) as { id: string; order_id: string } | undefined;
      if (!ot) {
        return { error: "Order test not found" } as any;
      }

      const now = Math.floor(Date.now() / 1000);
      const resultId = crypto.randomUUID();

      // Upsert result
      rawDb
        .prepare(
          `INSERT INTO results (id, tenant_id, order_test_id, value, numeric_value, unit, reference_range, is_abnormal, is_critical, remarks, entered_by_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(order_test_id) DO UPDATE SET
             value = excluded.value,
             numeric_value = excluded.numeric_value,
             unit = excluded.unit,
             reference_range = excluded.reference_range,
             is_abnormal = excluded.is_abnormal,
             is_critical = excluded.is_critical,
             remarks = excluded.remarks,
             entered_by_id = excluded.entered_by_id,
             updated_at = excluded.updated_at`
        )
        .run(
          resultId,
          session.tenantId,
          data.orderTestId,
          data.value ?? null,
          data.numericValue ?? null,
          data.unit ?? null,
          data.referenceRange ?? null,
          data.isAbnormal ? 1 : 0,
          data.isCritical ? 1 : 0,
          data.remarks ?? null,
          session.userId,
          now,
          now
        );

      // Update order test status
      rawDb
        .prepare(`UPDATE order_tests SET status = 'in_progress', updated_at = ? WHERE id = ?`)
        .run(now, data.orderTestId);

      await logAudit("enter_result", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `result:${resultId}`,
        metadata: { orderTestId: data.orderTestId, isCritical: data.isCritical },
      });

      const result = {
        id: resultId,
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
        createdAt: new Date(now * 1000),
      };

      return { result };
    });
  } catch (err) {
    return jsonError(err);
  }
}
