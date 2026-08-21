import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { withTenant, jsonError } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { logAudit } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withTenant(req, async (session) => {
      const { id } = await params;

      const [order] = await db
        .select()
        .from(schema.testOrders)
        .where(
          and(
            eq(schema.testOrders.id, id),
            eq(schema.testOrders.tenantId, session.tenantId)
          )
        )
        .limit(1);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const [patient] = await db
        .select()
        .from(schema.patients)
        .where(eq(schema.patients.id, order.patientId))
        .limit(1);

      const orderTests = await db
        .select({
          id: schema.orderTests.id,
          testId: schema.orderTests.testId,
          testCode: schema.tests.code,
          testName: schema.tests.name,
          department: schema.tests.department,
          status: schema.orderTests.status,
          barcode: schema.orderTests.barcode,
          pricePaise: schema.orderTests.pricePaise,
        })
        .from(schema.orderTests)
        .innerJoin(schema.tests, eq(schema.tests.id, schema.orderTests.testId))
        .where(eq(schema.orderTests.orderId, order.id));

      const results = await db
        .select()
        .from(schema.results)
        .where(eq(schema.results.tenantId, session.tenantId));

      const resultsByOrderTest = new Map<string, typeof results>();
      for (const r of results) {
        if (!resultsByOrderTest.has(r.orderTestId)) {
          resultsByOrderTest.set(r.orderTestId, []);
        }
        resultsByOrderTest.get(r.orderTestId)!.push(r);
      }

      const orderTestsWithResults = orderTests.map((ot) => ({
        ...ot,
        results: resultsByOrderTest.get(ot.id) || [],
      }));

      const [report] = await db
        .select()
        .from(schema.reports)
        .where(eq(schema.reports.orderId, order.id))
        .limit(1);

      await logAudit("read_order", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `order:${order.id}`,
      });

      return NextResponse.json({ order, patient, orderTests: orderTestsWithResults, report });
    });
  } catch (err) {
    return jsonError(err);
  }
}
