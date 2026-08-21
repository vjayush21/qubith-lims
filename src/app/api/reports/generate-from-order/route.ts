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

      // Check if report already exists
      const [existing] = await db
        .select()
        .from(schema.reports)
        .where(
          and(
            eq(schema.reports.orderId, data.orderId),
            eq(schema.reports.tenantId, session.tenantId)
          )
        )
        .limit(1);
      if (existing) {
        return NextResponse.json({ reportId: existing.id });
      }

      // Generate report code
      const [count] = await db
        .select({ id: schema.reports.id })
        .from(schema.reports)
        .where(eq(schema.reports.tenantId, session.tenantId));
      const reportCode = `RPT-${String(Date.now()).slice(-5)}`;

      const [report] = await db
        .insert(schema.reports)
        .values({
          tenantId: session.tenantId,
          orderId: data.orderId,
          reportCode,
          status: "validated",
          validatedById: session.userId,
          validatedAt: new Date(),
        })
        .returning();

      // Update order collection status to completed
      await db
        .update(schema.testOrders)
        .set({ collectionStatus: "completed", updatedAt: new Date() })
        .where(eq(schema.testOrders.id, data.orderId));

      await logAudit("create_report", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `report:${report.id}`,
        metadata: { reportCode, orderId: data.orderId },
      });

      return NextResponse.json({ reportId: report.id });
    });
  } catch (err) {
    return jsonError(err);
  }
}
