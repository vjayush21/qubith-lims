import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { withTenant, jsonError, ApiError } from "@/lib/api-helpers";
import { eq, and, ilike, or, sql, desc } from "drizzle-orm";
import { logAudit } from "@/lib/auth";

const createSchema = z.object({
  fullName: z.string().min(2).max(120),
  age: z.number().int().min(0).max(150).optional(),
  ageUnit: z.enum(["years", "months", "days"]).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  refDoctorId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

async function nextPatientCode(tenantId: string): Promise<string> {
  // Get the last patient code for this tenant
  const [last] = await db
    .select({ code: schema.patients.patientCode })
    .from(schema.patients)
    .where(eq(schema.patients.tenantId, tenantId))
    .orderBy(desc(schema.patients.createdAt))
    .limit(1);
  let n = 1;
  if (last?.code) {
    const match = last.code.match(/P-(\d+)/);
    if (match) n = parseInt(match[1], 10) + 1;
  }
  return `P-${String(n).padStart(5, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    return await withTenant(req, async (session) => {
      const body = await req.json();
      const data = createSchema.parse(body);
      const code = await nextPatientCode(session.tenantId);
      const [patient] = await db
        .insert(schema.patients)
        .values({
          tenantId: session.tenantId,
          patientCode: code,
          fullName: data.fullName,
          age: data.age,
          ageUnit: data.ageUnit || "years",
          sex: data.sex,
          phone: data.phone,
          email: data.email,
          address: data.address,
          refDoctorId: data.refDoctorId,
          notes: data.notes,
        })
        .returning();
      await logAudit("create_patient", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `patient:${patient.id}`,
        metadata: { patientCode: patient.patientCode },
      });
      return NextResponse.json({ patient });
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    return await withTenant(req, async (session) => {
      const url = new URL(req.url);
      const q = url.searchParams.get("q");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

      let query = db
        .select()
        .from(schema.patients)
        .where(eq(schema.patients.tenantId, session.tenantId))
        .orderBy(desc(schema.patients.createdAt))
        .limit(limit);

      if (q) {
        const like = `%${q}%`;
        query = db
          .select()
          .from(schema.patients)
          .where(
            and(
              eq(schema.patients.tenantId, session.tenantId),
              or(
                ilike(schema.patients.fullName, like),
                ilike(schema.patients.phone, like),
                ilike(schema.patients.patientCode, like)
              )
            )
          )
          .orderBy(desc(schema.patients.createdAt))
          .limit(limit);
      }

      const patients = await query;
      return NextResponse.json({ patients });
    });
  } catch (err) {
    return jsonError(err);
  }
}
