import { NextRequest, NextResponse } from "next/server";
import { withTenant, jsonError } from "@/lib/api-helpers";
import { logAudit } from "@/lib/auth";
import PDFDocument from "pdfkit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withTenant(req, async (session) => {
      const { id } = await params;
      const { getRawDb } = await import("@/db/client");
      const rawDb = getRawDb();

      // Load report
      const report = rawDb
        .prepare(`SELECT * FROM reports WHERE id = ? AND tenant_id = ?`)
        .get(id, session.tenantId) as any;
      if (!report) {
        return { error: "Report not found" } as any;
      }

      // Load order
      const order = rawDb
        .prepare(`SELECT * FROM test_orders WHERE id = ?`)
        .get(report.order_id) as any;
      if (!order) {
        return { error: "Order not found" } as any;
      }

      // Load patient
      const patient = rawDb
        .prepare(`SELECT * FROM patients WHERE id = ?`)
        .get(order.patient_id) as any;

      // Load tenant
      const tenant = rawDb
        .prepare(`SELECT * FROM tenants WHERE id = ?`)
        .get(session.tenantId) as any;

      // Load order tests with test info
      const orderTests = rawDb
        .prepare(
          `SELECT ot.id, ot.barcode, t.name as testName, t.department
           FROM order_tests ot
           INNER JOIN tests t ON t.id = ot.test_id
           WHERE ot.order_id = ?
           ORDER BY t.name`
        )
        .all(order.id) as any[];

      // Load all results
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

      await logAudit("view_report_pdf", {
        tenantId: session.tenantId,
        userId: session.userId,
        resource: `report:${report.id}`,
      });

      // Build the PDF
      const pdf = await buildReportPdf({ tenant, patient, order, report, tests: orderTests.map((ot) => ({
        name: ot.testName,
        department: ot.department,
        barcode: ot.barcode,
        results: resultsByOrderTest.get(ot.id) || [],
      })) });

      return new NextResponse(pdf as any, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${report.report_code}.pdf"`,
          "Content-Length": String((pdf as Buffer).length),
          "Cache-Control": "no-store",
        },
      });
    });
  } catch (err) {
    return jsonError(err);
  }
}

async function buildReportPdf({
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
  tests: Array<{ name: string; department: string | null; barcode: string; results: any[] }>;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Report ${report.report_code}`,
          Author: tenant.name,
          Subject: "Pathology Report",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const TEAL = "#0f766e";
      const GRAY_LIGHT = "#fafaf9";
      const GRAY_BORDER = "#e7e5e4";
      const GRAY_TEXT = "#57534e";
      const RED = "#dc2626";
      const ORANGE = "#d97706";
      const GREEN = "#059669";

      const leftMargin = 50;
      const rightMargin = doc.page.width - 50;
      const contentWidth = rightMargin - leftMargin;

      // ====== HEADER ======
      const headerY = 50;

      // Lab name (left, big)
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(TEAL)
        .text(tenant.name, leftMargin, headerY, { width: 280 });

      // Lab address
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(GRAY_TEXT)
        .text(tenant.address || "", leftMargin, headerY + 26, { width: 280 });
      if (tenant.city) {
        doc.text(
          `${tenant.city}${tenant.phone ? " · " + tenant.phone : ""}`,
          leftMargin,
          headerY + 40,
          { width: 280 }
        );
      }

      // "PATHOLOGY REPORT" (right)
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#1c1917")
        .text("PATHOLOGY REPORT", leftMargin + 320, headerY, { width: contentWidth - 320, align: "right" });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(GRAY_TEXT)
        .text(`Report #: ${report.report_code}`, leftMargin + 320, headerY + 22, { width: contentWidth - 320, align: "right" });

      const reportDate = new Date(report.created_at * 1000);
      doc.text(
        `Date: ${reportDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`,
        leftMargin + 320,
        headerY + 36,
        { width: contentWidth - 320, align: "right" }
      );

      // Divider
      doc
        .moveTo(leftMargin, headerY + 70)
        .lineTo(rightMargin, headerY + 70)
        .lineWidth(2)
        .strokeColor(TEAL)
        .stroke();

      // ====== PATIENT INFO ======
      const patientY = headerY + 90;
      const boxHeight = 70;
      doc
        .roundedRect(leftMargin, patientY, contentWidth, boxHeight, 6)
        .fillOpacity(1)
        .fillAndStroke(GRAY_LIGHT, GRAY_BORDER);

      doc.fillOpacity(1).fillColor("#1c1917");

      const col1X = leftMargin + 14;
      const col2X = leftMargin + contentWidth / 2 + 6;
      const labelW = 80;

      const drawKV = (x: number, y: number, label: string, value: string) => {
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#1c1917").text(label, x, y, { width: labelW });
        doc.font("Helvetica").fillColor(GRAY_TEXT).text(value || "—", x + labelW, y, { width: 180 });
      };

      drawKV(col1X, patientY + 12, "Patient:", patient.full_name);
      drawKV(col2X, patientY + 12, "Patient ID:", patient.patient_code);
      drawKV(col1X, patientY + 30, "Age / Sex:", `${patient.age || "—"} ${patient.age_unit || ""} / ${patient.sex || "—"}`);
      drawKV(col2X, patientY + 30, "Phone:", patient.phone || "—");
      drawKV(col1X, patientY + 48, "Ref. By:", "Dr. Self");
      drawKV(col2X, patientY + 48, "Order #:", order.order_code);

      // ====== RESULTS TABLE ======
      const tableY = patientY + boxHeight + 24;
      const colWidths = {
        test: contentWidth * 0.40,
        result: contentWidth * 0.20,
        range: contentWidth * 0.25,
        flag: contentWidth * 0.15,
      };
      const colXs = {
        test: leftMargin,
        result: leftMargin + colWidths.test,
        range: leftMargin + colWidths.test + colWidths.result,
        flag: leftMargin + colWidths.test + colWidths.result + colWidths.range,
      };

      // Table header
      const headerH = 26;
      doc.rect(leftMargin, tableY, contentWidth, headerH).fill(TEAL);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);

      doc.text("TEST NAME", colXs.test + 8, tableY + 9, { width: colWidths.test - 8 });
      doc.text("RESULT", colXs.result, tableY + 9, { width: colWidths.result, align: "center" });
      doc.text("REFERENCE RANGE", colXs.range, tableY + 9, { width: colWidths.range, align: "center" });
      doc.text("FLAG", colXs.flag, tableY + 9, { width: colWidths.flag, align: "center" });

      // Table rows
      let currentY = tableY + headerH;
      const rowH = 22;
      doc.font("Helvetica").fontSize(9);

      // Flatten results (one row per result)
      const allRows: Array<{ testName: string; value: string; unit: string; range: string; isCritical: boolean; isAbnormal: boolean }> = [];
      for (const t of tests) {
        if (t.results.length === 0) {
          allRows.push({
            testName: t.name,
            value: "—",
            unit: "",
            range: "—",
            isCritical: false,
            isAbnormal: false,
          });
        } else {
          for (const r of t.results) {
            allRows.push({
              testName: t.name,
              value: r.value || r.numeric_value || "—",
              unit: r.unit || "",
              range: r.reference_range || "—",
              isCritical: r.is_critical === 1,
              isAbnormal: r.is_abnormal === 1,
            });
          }
        }
      }

      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];

        // Page break check (footer area at ~750)
        if (currentY + rowH > doc.page.height - 80) {
          // Simple header on new page
          doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY_TEXT);
          doc.text(
            `${tenant.name} — ${report.report_code} (continued)`,
            leftMargin,
            50,
            { width: contentWidth, align: "right" }
          );
          doc
            .moveTo(leftMargin, 65)
            .lineTo(rightMargin, 65)
            .strokeColor(GRAY_BORDER)
            .stroke();
          currentY = 80;
        }

        // Alternating row bg
        if (i % 2 === 0) {
          doc.rect(leftMargin, currentY, contentWidth, rowH).fill("#f9fafb");
        }
        doc.fillColor("#1c1917").font("Helvetica").fontSize(9);

        doc.text(row.testName, colXs.test + 8, currentY + 6, { width: colWidths.test - 8 });
        doc.text(`${row.value}${row.unit ? " " + row.unit : ""}`, colXs.result, currentY + 6, { width: colWidths.result, align: "center" });
        doc.fillColor(GRAY_TEXT).text(row.range, colXs.range, currentY + 6, { width: colWidths.range, align: "center" });

        // Flag (badge or text)
        if (row.isCritical) {
          doc
            .rect(colXs.flag + 30, currentY + 5, 60, 14)
            .fillColor(RED)
            .fill();
          doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7).text(
            "CRITICAL",
            colXs.flag + 30,
            currentY + 9,
            { width: 60, align: "center" }
          );
        } else if (row.isAbnormal) {
          doc
            .rect(colXs.flag + 30, currentY + 5, 60, 14)
            .fillColor(ORANGE)
            .fill();
          doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7).text(
            "ABNORMAL",
            colXs.flag + 30,
            currentY + 9,
            { width: 60, align: "center" }
          );
        } else {
          doc.fillColor(GREEN).text("Normal", colXs.flag, currentY + 6, { width: colWidths.flag, align: "center" });
        }

        // Row separator
        doc
          .moveTo(leftMargin, currentY + rowH)
          .lineTo(rightMargin, currentY + rowH)
          .strokeColor(GRAY_BORDER)
          .lineWidth(0.5)
          .stroke();

        currentY += rowH;
      }

      // ====== FOOTER ======
      const footerY = doc.page.height - 60;

      doc
        .moveTo(leftMargin, footerY)
        .lineTo(rightMargin, footerY)
        .strokeColor(GRAY_BORDER)
        .stroke();

      doc.font("Helvetica-Bold").fontSize(8).fillColor("#1c1917");
      doc.text("Method:", leftMargin, footerY + 10);
      doc.font("Helvetica").fillColor(GRAY_TEXT).text("Automated analyzer", leftMargin + 50, footerY + 10);

      doc
        .font("Helvetica-Oblique")
        .fontSize(7)
        .fillColor(GRAY_TEXT)
        .text(
          "Computer-generated report. Final interpretation by the pathologist.",
          leftMargin,
          footerY + 26
        );

      // Signature
      const sigX = rightMargin - 180;
      doc
        .moveTo(sigX, footerY + 10)
        .lineTo(rightMargin, footerY + 10)
        .lineWidth(0.5)
        .strokeColor("#1c1917")
        .stroke();
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#1c1917").text(
        "Pathologist",
        sigX,
        footerY + 14,
        { width: 180, align: "right" }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
