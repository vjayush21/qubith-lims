"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

function ReportInner() {
  const params = useParams();
  const orderId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function generateReport() {
    setCreating(true);
    try {
      // For v1, we'll auto-create a report from the order
      // In v2, this can use Puppeteer to generate actual PDF
      const res = await fetch(`/api/reports/generate-from-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.reportId) {
        const r = await fetch(`/api/reports/${data.reportId}`);
        const reportData = await r.json();
        setData(reportData);
        if (reportData.whatsappShareUrl) {
          setShareUrl(reportData.whatsappShareUrl);
        }
      } else {
        alert(data.error || "Failed to generate report");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    if (orderId) {
      fetch(`/api/test-orders/${orderId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.report) {
            fetch(`/api/reports/${d.report.id}`)
              .then((r) => r.json())
              .then((rd) => {
                setData(rd);
                if (rd.whatsappShareUrl) setShareUrl(rd.whatsappShareUrl);
              });
          }
          setLoading(false);
        });
    }
  }, [orderId]);

  if (loading) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">Loading...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href={`/orders/${orderId}`}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ← Back to order
          </Link>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-12 text-center">
          <div className="text-sm font-medium mb-2">No report yet</div>
          <div className="text-xs text-[var(--text-secondary)] mb-4">
            Generate a report from this order's results.
          </div>
          <button
            onClick={generateReport}
            disabled={creating}
            className="text-sm font-medium bg-[var(--primary-deep)] text-white px-5 py-2 rounded-lg hover:bg-[var(--primary-accent)] disabled:opacity-50"
          >
            {creating ? "Generating..." : "Generate report"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/orders/${orderId}`}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Back to order
        </Link>
        <div className="flex gap-2">
          {data.pdfUrl && (
            <a
              href={data.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium border border-[var(--border-subtle)] px-4 py-2 rounded-lg hover:border-[var(--text-tertiary)]"
            >
              View / Print
            </a>
          )}
          {shareUrl && (
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium bg-[#25D366] text-white px-4 py-2 rounded-lg hover:bg-[#1da851]"
            >
              Share on WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8 shadow-sm">
        <div className="border-b-2 border-[var(--primary-deep)] pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--primary-deep)]">{data.tenant?.name || "Lab"}</h1>
            <p className="text-xs text-[var(--text-secondary)]">{data.tenant?.city}</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-semibold">PATHOLOGY REPORT</h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono">{data.report?.reportCode}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm bg-[var(--bg-base)] p-4 rounded-lg mb-6">
          <div>
            <strong>Patient:</strong> {data.patient?.fullName}
          </div>
          <div>
            <strong>ID:</strong> <span className="font-mono">{data.patient?.patientCode}</span>
          </div>
          <div>
            <strong>Age/Sex:</strong> {data.patient?.age} {data.patient?.ageUnit} / {data.patient?.sex}
          </div>
          <div>
            <strong>Phone:</strong> {data.patient?.phone}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--primary-deep)] text-white">
              <th className="text-left py-2 px-3 text-xs">Test</th>
              <th className="text-center py-2 px-3 text-xs">Result</th>
              <th className="text-center py-2 px-3 text-xs">Reference</th>
              <th className="text-center py-2 px-3 text-xs">Flag</th>
            </tr>
          </thead>
          <tbody>
            {data.tests?.flatMap((t: any) =>
              t.results.map((r: any) => (
                <tr key={r.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2 px-3">{t.name}</td>
                  <td className="py-2 px-3 text-center font-medium">
                    {r.value || r.numericValue} {r.unit}
                  </td>
                  <td className="py-2 px-3 text-center text-[var(--text-secondary)]">
                    {r.referenceRange || "—"}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {r.isCritical ? (
                      <span className="text-[10px] px-2 py-0.5 bg-[#fee2e2] text-[var(--status-danger)] rounded-full font-medium">
                        CRITICAL
                      </span>
                    ) : r.isAbnormal ? (
                      <span className="text-[10px] px-2 py-0.5 bg-[#fef3c7] text-[var(--status-warning)] rounded-full font-medium">
                        ABNORMAL
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--status-success)]">Normal</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] flex justify-between text-xs text-[var(--text-secondary)]">
          <div>This is a computer-generated report.</div>
          <div>
            <div className="border-t border-[var(--text-primary)] w-40 pt-1 mt-4 text-right">
              Pathologist signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ReportInner />
    </Suspense>
  );
}
