import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { withTenant, jsonError } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { logAudit } from "@/lib/auth";

const schema2 = z.object({ orderId: z.string().uuid() });

export async function POST(req: NextRequest) {
  try {
    return await withTenant(req, async (session) => {
      const body = await req.json();
      const data = schema2.parse(body);

      // Check if report already exists (raw SQL)
      const { getRawDb } = await import("@/db/client");
      const rawDb = getRawDb();
      const existing = rawDb
        .prepare(`SELECT id FROM reports WHERE order_id = ? AND tenant_id = ?`)
        .get(data.orderId, session.tenantId) as { id: string } | undefined;
      if (existing) {
        return { reportId: existing.id };
      }

      const reportId = crypto.randomUUID();
      const reportCode = `RPT-${String(Date.now()).slice(-5)}`;
      const now = Math.floor(Date.now() / 1000);

      rawDb
        .prepare(
          `INSERT INTO reports (id, tenant_id, order_id, report_code, status, pdf_url, validated_by_id, validated_at, delivered_at, created_at)
           VALUES (?, ?, ?, ?, 'validated', NULL, ?, ?, NULL, ?)`
        )
        .run(reportId, session.tenantId, data.orderId, reportCode, session.userId, now, now);

      // Update order collection status to completed
      rawDb
        .prepare(`UPDATE test_orders SET collection_status = 'completed', updated_at = ? WHERE id = ?`)
        .run(now, data.orderId);

      await logAudit("create_report", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `report:${reportId}`,
        metadata: { reportCode, orderId: data.orderId },
      });

      return { reportId };
    });
  } catch (err) {
    return jsonError(err);
  }
}
