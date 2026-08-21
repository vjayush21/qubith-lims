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

      // Verify patient belongs to tenant
      const [patient] = await db
        .select()
        .from(schema.patients)
        .where(
          and(
            eq(schema.patients.id, data.patientId),
            eq(schema.patients.tenantId, session.tenantId)
          )
        )
        .limit(1);
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      // Verify tests belong to tenant
      const tests = await db
        .select()
        .from(schema.tests)
        .where(
          and(
            eq(schema.tests.tenantId, session.tenantId),
            eq(schema.tests.isActive, true)
          )
        );
      const validTestIds = new Set(tests.map((t) => t.id));
      const testMap = new Map(tests.map((t) => [t.id, t]));
      const invalid = data.testIds.filter((id) => !validTestIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: "Some tests not found in this lab", invalid },
          { status: 400 }
        );
      }

      // Calculate total
      const totalPaise = data.testIds.reduce((sum, id) => {
        return sum + (testMap.get(id)?.pricePaise || 0);
      }, 0);

      const orderCode = await nextOrderCode(session.tenantId);

      // Create order
      const [order] = await db
        .insert(schema.testOrders)
        .values({
          tenantId: session.tenantId,
          orderCode,
          patientId: data.patientId,
          collectionType: data.collectionType,
          collectionCenter: data.collectionCenter,
          homeAddress: data.homeAddress,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          phlebotomistId: data.phlebotomistId,
          totalAmountPaise: totalPaise,
          paidAmountPaise: data.paidAmountPaise,
          paymentStatus: data.paymentStatus,
          orderedById: session.userId,
          collectionStatus: data.collectionType === "walk_in" ? "pending" : "scheduled",
        })
        .returning();

      // Create order_tests
      const orderTests = data.testIds.map((testId) => ({
        tenantId: session.tenantId,
        orderId: order.id,
        testId,
        status: "registered" as const,
        pricePaise: testMap.get(testId)!.pricePaise,
        barcode: nextBarcode(),
      }));

      const createdOrderTests = await db
        .insert(schema.orderTests)
        .values(orderTests)
        .returning();

      await logAudit("create_order", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `order:${order.id}`,
        metadata: {
          orderCode,
          testCount: data.testIds.length,
          totalAmountPaise: totalPaise,
        },
      });

      return NextResponse.json({ order, orderTests: createdOrderTests });
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

      const orders = await db
        .select({
          id: schema.testOrders.id,
          orderCode: schema.testOrders.orderCode,
          patientId: schema.testOrders.patientId,
          patientName: schema.patients.fullName,
          patientCode: schema.patients.patientCode,
          totalAmountPaise: schema.testOrders.totalAmountPaise,
          paidAmountPaise: schema.testOrders.paidAmountPaise,
          paymentStatus: schema.testOrders.paymentStatus,
          collectionType: schema.testOrders.collectionType,
          collectionStatus: schema.testOrders.collectionStatus,
          createdAt: schema.testOrders.createdAt,
        })
        .from(schema.testOrders)
        .innerJoin(schema.patients, eq(schema.patients.id, schema.testOrders.patientId))
        .where(eq(schema.testOrders.tenantId, session.tenantId))
        .orderBy(desc(schema.testOrders.createdAt))
        .limit(limit);

      return NextResponse.json({ orders });
    });
  } catch (err) {
    return jsonError(err);
  }
}
