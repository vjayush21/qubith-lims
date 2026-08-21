"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface OrderTest {
  id: string;
  testId: string;
  testCode: string;
  testName: string;
  department: string | null;
  status: string;
  barcode: string;
  pricePaise: number;
  results: Array<{
    id: string;
    value: string | null;
    numericValue: string | null;
    unit: string | null;
    referenceRange: string | null;
    isAbnormal: boolean;
    isCritical: boolean;
    remarks: string | null;
  }>;
}

function OrderDetailInner() {
  const router = useParams();
  const r = useRouter();
  const orderId = router.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/test-orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">Loading...</div>;
  }
  if (!data?.order) {
    return <div className="p-8 text-sm text-[var(--status-danger)]">Order not found</div>;
  }

  const { order, patient, orderTests, report } = data;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/orders" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          ← Orders
        </Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-semibold tracking-tight font-mono">{order.orderCode}</h1>
          <div className="text-2xl font-semibold">₹{(order.totalAmountPaise / 100).toFixed(0)}</div>
        </div>
      </div>

      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-[var(--text-tertiary)]">Patient</div>
            <div className="font-medium">{patient?.fullName}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-tertiary)]">Patient ID</div>
            <div className="font-mono">{patient?.patientCode}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-tertiary)]">Age / Sex</div>
            <div>{patient?.age || "—"} {patient?.ageUnit} · {patient?.sex || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-tertiary)]">Phone</div>
            <div>{patient?.phone || "—"}</div>
          </div>
        </div>
      </div>

      <h2 className="text-sm font-medium mb-3">Tests</h2>
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden mb-4">
        {orderTests.map((ot: OrderTest) => (
          <div key={ot.id} className="border-b border-[var(--border-subtle)] last:border-0 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">{ot.testName}</div>
                <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                  {ot.testCode} · {ot.barcode} · ₹{(ot.pricePaise / 100).toFixed(0)}
                </div>
              </div>
              <div className="text-xs px-2 py-0.5 bg-[var(--bg-base)] rounded-full text-[var(--text-secondary)]">
                {ot.status}
              </div>
            </div>

            {ot.results.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 text-sm bg-[var(--bg-base)] rounded-lg p-3">
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Value</div>
                  <div className="font-medium">{ot.results[0].value || ot.results[0].numericValue}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Unit</div>
                  <div>{ot.results[0].unit || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Reference</div>
                  <div>{ot.results[0].referenceRange || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Flag</div>
                  <div>
                    {ot.results[0].isCritical ? (
                      <span className="px-2 py-0.5 bg-[#fee2e2] text-[var(--status-danger)] text-[10px] font-medium rounded-full">
                        CRITICAL
                      </span>
                    ) : ot.results[0].isAbnormal ? (
                      <span className="px-2 py-0.5 bg-[#fef3c7] text-[var(--status-warning)] text-[10px] font-medium rounded-full">
                        ABNORMAL
                      </span>
                    ) : (
                      <span className="text-[var(--status-success)] text-xs">Normal</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <ResultEntry
                orderTestId={ot.id}
                onSaved={() => {
                  fetch(`/api/test-orders/${orderId}`)
                    .then((r) => r.json())
                    .then((d) => setData(d));
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/orders/${orderId}/report`}
          className="text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-accent)]"
        >
          {report ? "View report" : "Generate report"}
        </Link>
      </div>
    </div>
  );
}

function ResultEntry({
  orderTestId,
  onSaved,
}: {
  orderTestId: string;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [referenceRange, setReferenceRange] = useState("");
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!value) return;
    setSaving(true);
    try {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderTestId,
          value,
          unit: unit || undefined,
          referenceRange: referenceRange || undefined,
          isAbnormal,
          isCritical,
        }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[var(--bg-base)] rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <input
          placeholder="Result value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="px-2.5 py-1.5 text-sm border border-[var(--border-subtle)] rounded bg-[var(--bg-elevated)]"
        />
        <input
          placeholder="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="px-2.5 py-1.5 text-sm border border-[var(--border-subtle)] rounded bg-[var(--bg-elevated)]"
        />
        <input
          placeholder="Reference range"
          value={referenceRange}
          onChange={(e) => setReferenceRange(e.target.value)}
          className="px-2.5 py-1.5 text-sm border border-[var(--border-subtle)] rounded bg-[var(--bg-elevated)]"
        />
        <button
          onClick={save}
          disabled={saving || !value}
          className="text-xs font-medium bg-[var(--primary-deep)] text-white px-3 py-1.5 rounded hover:bg-[var(--primary-accent)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="flex gap-3 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isAbnormal}
            onChange={(e) => setIsAbnormal(e.target.checked)}
            className="accent-[var(--status-warning)]"
          />
          Abnormal
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isCritical}
            onChange={(e) => setIsCritical(e.target.checked)}
            className="accent-[var(--status-danger)]"
          />
          Critical
        </label>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <OrderDetailInner />
    </Suspense>
  );
}
