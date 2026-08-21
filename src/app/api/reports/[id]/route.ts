import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { withTenant, jsonError } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { logAudit } from "@/lib/auth";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withTenant(req, async (session) => {
      const { id } = await params;

      const [report] = await db
        .select()
        .from(schema.reports)
        .where(
          and(
            eq(schema.reports.id, id),
            eq(schema.reports.tenantId, session.tenantId)
          )
        )
        .limit(1);
      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }

      const [order] = await db
        .select()
        .from(schema.testOrders)
        .where(eq(schema.testOrders.id, report.orderId))
        .limit(1);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const [patient] = await db
        .select()
        .from(schema.patients)
        .where(eq(schema.patients.id, order.patientId))
        .limit(1);

      const [tenant] = await db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, session.tenantId))
        .limit(1);

      const orderTests = await db
        .select({
          id: schema.orderTests.id,
          testName: schema.tests.name,
          department: schema.tests.department,
          barcode: schema.orderTests.barcode,
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

      const tests = orderTests.map((ot) => ({
        name: ot.testName,
        department: ot.department,
        results: resultsByOrderTest.get(ot.id) || [],
      }));

      // Generate PDF
      const dir = join(process.cwd(), "storage", "reports", session.tenantId);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      const filePath = join(dir, `${report.id}.html`);

      const html = generateReportHTML({
        tenant: tenant!,
        patient: patient!,
        order,
        report,
        tests,
      });

      await writeFile(filePath, html, "utf-8");

      // Generate actual PDF (simplified for v1 - just HTML)
      // TODO: integrate Puppeteer for actual PDF generation
      const pdfUrl = `/api/reports/${report.id}/view`;

      await logAudit("generate_report", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `report:${report.id}`,
      });

      return NextResponse.json({
        report,
        patient,
        order,
        tests,
        pdfUrl,
        whatsappShareUrl: generateWhatsAppShareUrl(patient?.phone || "", report.reportCode),
      });
    });
  } catch (err) {
    return jsonError(err);
  }
}

function generateReportHTML({
  tenant,
  patient,
  order,
  report,
  tests,
}: {
  tenant: typeof schema.tenants.$inferSelect;
  patient: typeof schema.patients.$inferSelect;
  order: typeof schema.testOrders.$inferSelect;
  report: typeof schema.reports.$inferSelect;
  tests: Array<{
    name: string;
    department: string | null;
    results: Array<typeof schema.results.$inferSelect>;
  }>;
}): string {
  const resultRows = tests
    .flatMap((t) =>
      t.results.map(
        (r) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4;">${escapeHtml(t.name)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4; text-align: center; font-weight: 500;">${escapeHtml(r.value || r.numericValue || "—")} ${escapeHtml(r.unit || "")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4; text-align: center; color: #78716c;">${escapeHtml(r.referenceRange || "—")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4; text-align: center;">
            ${r.isCritical ? '<span style="background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">CRITICAL</span>' : r.isAbnormal ? '<span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">ABNORMAL</span>' : '<span style="color: #059669; font-size: 12px;">Normal</span>'}
          </td>
        </tr>`
      )
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Report ${report.reportCode}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1c1917; font-size: 12px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; }
    .lab-info h1 { margin: 0 0 4px 0; font-size: 22px; color: #0f766e; font-weight: 600; }
    .lab-info p { margin: 2px 0; color: #57534e; font-size: 11px; }
    .report-meta { text-align: right; }
    .report-meta h2 { margin: 0 0 4px 0; font-size: 16px; color: #1c1917; }
    .report-meta p { margin: 2px 0; color: #57534e; font-size: 11px; }
    .patient-info { background: #fafaf9; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .patient-info div { display: flex; gap: 8px; }
    .patient-info strong { color: #1c1917; font-weight: 500; min-width: 80px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #0f766e; color: white; padding: 10px 12px; text-align: left; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    th.center { text-align: center; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e7e5e4; display: flex; justify-content: space-between; font-size: 11px; color: #78716c; }
    .signature { text-align: right; }
    .signature-line { border-top: 1px solid #1c1917; width: 200px; margin-left: auto; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="lab-info">
      <h1>${escapeHtml(tenant.name)}</h1>
      <p>${escapeHtml(tenant.address || "")}</p>
      <p>${escapeHtml(tenant.city || "")} ${tenant.phone ? "· " + escapeHtml(tenant.phone) : ""}</p>
    </div>
    <div class="report-meta">
      <h2>PATHOLOGY REPORT</h2>
      <p><strong>Report #:</strong> ${report.reportCode}</p>
      <p><strong>Date:</strong> ${new Date(report.createdAt).toLocaleDateString("en-IN")}</p>
    </div>
  </div>

  <div class="patient-info">
    <div><strong>Patient:</strong> ${escapeHtml(patient.fullName)}</div>
    <div><strong>Patient ID:</strong> ${patient.patientCode}</div>
    <div><strong>Age/Sex:</strong> ${patient.age || "—"} ${patient.ageUnit || ""} / ${patient.sex || "—"}</div>
    <div><strong>Phone:</strong> ${escapeHtml(patient.phone || "—")}</div>
    <div><strong>Ref. By:</strong> Dr. Self</div>
    <div><strong>Order #:</strong> ${order.orderCode}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th class="center">Result</th>
        <th class="center">Reference Range</th>
        <th class="center">Flag</th>
      </tr>
    </thead>
    <tbody>
      ${resultRows || '<tr><td colspan="4" style="text-align: center; padding: 24px; color: #a8a29e;">No results entered yet</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <p style="margin: 0;"><strong>Method:</strong> Automated analyzer</p>
      <p style="margin: 4px 0 0 0;">This is a computer-generated report. Final interpretation by the pathologist.</p>
    </div>
    <div class="signature">
      <div class="signature-line"></div>
      <p style="margin: 0;"><strong>Pathologist</strong></p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateWhatsAppShareUrl(phone: string, reportCode: string): string {
  const message = encodeURIComponent(
    `Your ${reportCode} report from QuBith LIMS is ready. View it here: ${process.env.NEXT_PUBLIC_APP_URL || "https://lims.qubith.in"}`
  );
  // wa.me link with pre-filled message
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`;
}
