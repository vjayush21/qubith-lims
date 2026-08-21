import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { withTenant, jsonError } from "@/lib/api-helpers";
import { eq, and, desc } from "drizzle-orm";
import { logAudit } from "@/lib/auth";

const createSchema = z.object({
  patientId: z.string().uuid(),
  testIds: z.array(z.string().uuid()).min(1).max(30),
  collectionType: z.enum(["walk_in", "home"]).default("walk_in"),
  collectionCenter: z.string().max(120).optional(),
  homeAddress: z.string().max(500).optional(),
  scheduledAt: z.string().datetime().optional(),
  phlebotomistId: z.string().uuid().optional(),
  paymentStatus: z.enum(["pending", "partial", "paid"]).default("pending"),
  paidAmountPaise: z.number().int().min(0).default(0),
});

async function nextOrderCode(tenantId: string): Promise<string> {
  const [last] = await db
    .select({ code: schema.testOrders.orderCode })
    .from(schema.testOrders)
    .where(eq(schema.testOrders.tenantId, tenantId))
    .orderBy(desc(schema.testOrders.createdAt))
    .limit(1);
  let n = 1;
  if (last?.code) {
    const match = last.code.match(/ORD-(\d+)/);
    if (match) n = parseInt(match[1], 10) + 1;
  }
  return `ORD-${String(n).padStart(5, "0")}`;
}

function nextBarcode(): string {
  // Simple timestamp-based barcode
  return `L${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    return await withTenant(req, async (session) => {
      const body = await req.json();
      const data = createSchema.parse(body);

      const { getRawDb } = await import("@/db/client");
      const rawDb = getRawDb();

      // Verify patient belongs to tenant
      const patient = rawDb
        .prepare(`SELECT * FROM patients WHERE id = ? AND tenant_id = ?`)
        .get(data.patientId, session.tenantId) as any;
      if (!patient) {
        return { error: "Patient not found" } as any;
      }

      // Verify tests belong to tenant
      const tests = rawDb
        .prepare(
          `SELECT * FROM tests WHERE tenant_id = ? AND is_active = 1`
        )
        .all(session.tenantId) as any[];
      const validTestIds = new Set(tests.map((t) => t.id));
      const testMap = new Map(tests.map((t) => [t.id, t]));
      const invalid = data.testIds.filter((id: string) => !validTestIds.has(id));
      if (invalid.length > 0) {
        return { error: "Some tests not found in this lab", invalid } as any;
      }

      // Calculate total
      const totalPaise = data.testIds.reduce((sum: number, id: string) => {
        return sum + (testMap.get(id)?.price_paise || 0);
      }, 0);

      const orderCode = await nextOrderCode(session.tenantId);
      const orderId = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      // Create order
      rawDb
        .prepare(
          `INSERT INTO test_orders (id, tenant_id, order_code, patient_id, collection_type, collection_center, home_address, scheduled_at, phlebotomist_id, collection_status, total_amount_paise, paid_amount_paise, payment_status, ordered_by_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          orderId,
          session.tenantId,
          orderCode,
          data.patientId,
          data.collectionType,
          data.collectionCenter ?? null,
          data.homeAddress ?? null,
          data.scheduledAt ? Math.floor(new Date(data.scheduledAt).getTime() / 1000) : null,
          data.phlebotomistId ?? null,
          data.collectionType === "walk_in" ? "pending" : "scheduled",
          totalPaise,
          data.paidAmountPaise,
          data.paymentStatus,
          session.userId,
          now,
          now
        );

      // Create order_tests
      const createdOrderTests: any[] = [];
      for (const testId of data.testIds) {
        const otId = crypto.randomUUID();
        const barcode = nextBarcode();
        rawDb
          .prepare(
            `INSERT INTO order_tests (id, tenant_id, order_id, test_id, status, price_paise, barcode, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'registered', ?, ?, ?, ?)`
          )
          .run(otId, session.tenantId, orderId, testId, testMap.get(testId)!.price_paise, barcode, now, now);
        createdOrderTests.push({ id: otId, testId, status: "registered", pricePaise: testMap.get(testId)!.price_paise, barcode });
      }

      const order = {
        id: orderId,
        tenantId: session.tenantId,
        orderCode,
        patientId: data.patientId,
        totalAmountPaise: totalPaise,
        paidAmountPaise: data.paidAmountPaise,
        paymentStatus: data.paymentStatus,
        collectionStatus: data.collectionType === "walk_in" ? "pending" : "scheduled",
        createdAt: new Date(now * 1000),
      };

      await logAudit("create_order", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `order:${orderId}`,
        metadata: {
          orderCode,
          testCount: data.testIds.length,
          totalAmountPaise: totalPaise,
        },
      });

      return { order, orderTests: createdOrderTests };
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    return await withTenant(req, async (session) => {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

      const { getRawDb } = await import("@/db/client");
      const rawDb = getRawDb();
      const orders = rawDb
        .prepare(
          `SELECT o.id, o.order_code as orderCode, o.patient_id as patientId, p.full_name as patientName, p.patient_code as patientCode,
                  o.total_amount_paise as totalAmountPaise, o.paid_amount_paise as paidAmountPaise, o.payment_status as paymentStatus,
                  o.collection_type as collectionType, o.collection_status as collectionStatus, o.created_at as createdAt
           FROM test_orders o
           INNER JOIN patients p ON p.id = o.patient_id
           WHERE o.tenant_id = ?
           ORDER BY o.created_at DESC
           LIMIT ?`
        )
        .all(session.tenantId, limit);
      return { orders };
    });
  } catch (err) {
    return jsonError(err);
  }
}
