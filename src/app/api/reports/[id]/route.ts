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
      const { getRawDb } = await import("@/db/client");
      const rawDb = getRawDb();

      const report = rawDb
        .prepare(`SELECT * FROM reports WHERE id = ? AND tenant_id = ?`)
        .get(id, session.tenantId) as any;
      if (!report) {
        return { error: "Report not found" } as any;
      }

      const order = rawDb
        .prepare(`SELECT * FROM test_orders WHERE id = ?`)
        .get(report.order_id) as any;
      if (!order) {
        return { error: "Order not found" } as any;
      }

      const patient = rawDb
        .prepare(`SELECT * FROM patients WHERE id = ?`)
        .get(order.patient_id) as any;

      const tenant = rawDb
        .prepare(`SELECT * FROM tenants WHERE id = ?`)
        .get(session.tenantId) as any;

      const orderTests = rawDb
        .prepare(
          `SELECT ot.id, ot.barcode, t.name as testName, t.department
           FROM order_tests ot
           INNER JOIN tests t ON t.id = ot.test_id
           WHERE ot.order_id = ?`
        )
        .all(order.id) as any[];

      const allResults = rawDb
        .prepare(`SELECT * FROM results WHERE tenant_id = ?`)
        .all(session.tenantId) as any[];

      const resultsByOrderTest = new Map<string, any[]>();
      for (const r of allResults) {
        if (!resultsByOrderTest.has(r.order_test_id)) {
          resultsByOrderTest.set(r.order_test_id, []);
        }
        resultsByOrderTest.get(r.order_test_id)!.push(r);
      }

      const tests = orderTests.map((ot) => ({
        name: ot.testName,
        department: ot.department,
        results: resultsByOrderTest.get(ot.id) || [],
      }));

      // Build the printable HTML
      const html = buildReportHTML({ tenant, patient, order, report, tests });

      await logAudit("read_report", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `report:${report.id}`,
      });

      // For v1 we return the report data + a wa.me link for WhatsApp sharing.
      // The actual HTML can be served by the lab's browser via the web app at /orders/[id]/report.
      const patientPhone = (patient?.phone || "").replace(/\D/g, "");
      const whatsappShareUrl = patientPhone
        ? `https://wa.me/${patientPhone}?text=${encodeURIComponent(`Hi ${patient.fullName}, your ${report.report_code} report from ${tenant.name} is ready. View it here: ${process.env.NEXT_PUBLIC_APP_URL || "https://lims.qubith.in"}/orders/${order.id}/report`)}`
        : `https://wa.me/?text=${encodeURIComponent(`Report ${report.report_code} from ${tenant.name}`)}`;

      return {
        report: {
          id: report.id,
          tenantId: report.tenant_id,
          orderId: report.order_id,
          reportCode: report.report_code,
          status: report.status,
          pdfUrl: `/api/reports/${report.id}/view`,
          validatedById: report.validated_by_id,
          validatedAt: report.validated_at ? new Date(report.validated_at * 1000) : null,
          deliveredAt: report.delivered_at ? new Date(report.delivered_at * 1000) : null,
          createdAt: new Date(report.created_at * 1000),
        },
        patient,
        order,
        tests,
        pdfUrl: `/api/reports/${report.id}/view`,
        html, // Include HTML for in-app preview; web app renders it
        whatsappShareUrl,
      };
    });
  } catch (err) {
    return jsonError(err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildReportHTML({
  tenant,
  patient,
  order,
  report,
  tests,
}: {
  tenant: any;
  patient: any;
  order: any;
  report: any;
  tests: Array<{ name: string; department: string | null; results: any[] }>;
}): string {
  const resultRows = tests
    .flatMap((t) =>
      t.results.map(
        (r) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4;">${escapeHtml(t.name)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4; text-align: center; font-weight: 500;">${escapeHtml(r.value || r.numeric_value || "—")} ${escapeHtml(r.unit || "")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4; text-align: center; color: #78716c;">${escapeHtml(r.reference_range || "—")}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4; text-align: center;">
            ${r.is_critical ? '<span style="background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">CRITICAL</span>' : r.is_abnormal ? '<span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">ABNORMAL</span>' : '<span style="color: #059669; font-size: 12px;">Normal</span>'}
          </td>
        </tr>`
      )
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Report ${report.report_code}</title>
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
      <p><strong>Report #:</strong> ${report.report_code}</p>
      <p><strong>Date:</strong> ${new Date(report.created_at * 1000).toLocaleDateString("en-IN")}</p>
    </div>
  </div>

  <div class="patient-info">
    <div><strong>Patient:</strong> ${escapeHtml(patient.full_name)}</div>
    <div><strong>Patient ID:</strong> ${patient.patient_code}</div>
    <div><strong>Age/Sex:</strong> ${patient.age || "—"} ${patient.age_unit || ""} / ${patient.sex || "—"}</div>
    <div><strong>Phone:</strong> ${escapeHtml(patient.phone || "—")}</div>
    <div><strong>Ref. By:</strong> Dr. Self</div>
    <div><strong>Order #:</strong> ${order.order_code}</div>
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
