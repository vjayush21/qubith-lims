"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Test {
  id: string;
  code: string;
  name: string;
  department: string | null;
  pricePaise: number;
}

interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  age: number | null;
  sex: string | null;
}

function NewOrderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedPatientId = params.get("patientId");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [patientId, setPatientId] = useState(preselectedPatientId || "");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [collectionType, setCollectionType] = useState<"walk_in" | "home">("walk_in");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/patients?limit=200").then((r) => r.json()),
      fetch("/api/tests").then((r) => r.json()),
    ]).then(([p, t]) => {
      setPatients(p.patients || []);
      setTests(t.tests || []);
      setLoading(false);
    });
  }, []);

  const selectedPatient = patients.find((p) => p.id === patientId);
  const total = Array.from(selectedTests).reduce((sum, id) => {
    const t = tests.find((tt) => tt.id === id);
    return sum + (t?.pricePaise || 0);
  }, 0);

  async function onSubmit() {
    if (!patientId || selectedTests.size === 0) {
      setError("Pick a patient and at least one test");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/test-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          testIds: Array.from(selectedTests),
          collectionType,
          paymentStatus: "pending",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create order");
        return;
      }
      router.push(`/orders/${data.order.id}`);
    } catch (err) {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/orders" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          ← Orders
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">New order</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm bg-[#fef2f2] border border-[#fecaca] text-[var(--status-danger)] rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Patient picker */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5">
            <h2 className="text-sm font-medium mb-3">Patient</h2>
            {preselectedPatientId && selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-[var(--primary-soft)] rounded-lg">
                <div>
                  <div className="text-sm font-medium">{selectedPatient.fullName}</div>
                  <div className="text-xs text-[var(--text-secondary)] font-mono">
                    {selectedPatient.patientCode}
                    {selectedPatient.age ? ` · ${selectedPatient.age}y` : ""}
                    {selectedPatient.sex ? ` · ${selectedPatient.sex}` : ""}
                  </div>
                </div>
                <Link href="/orders/new" className="text-xs text-[var(--primary-deep)] hover:underline">
                  Change
                </Link>
              </div>
            ) : (
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)]"
              >
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} — {p.patientCode}
                  </option>
                ))}
              </select>
            )}
            {!preselectedPatientId && (
              <Link
                href="/patients/new"
                className="text-xs text-[var(--primary-deep)] hover:underline mt-2 inline-block"
              >
                + Register a new patient
              </Link>
            )}
          </div>

          {/* Test picker */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5">
            <h2 className="text-sm font-medium mb-3">Tests</h2>
            {tests.length === 0 ? (
              <div className="text-sm text-[var(--text-secondary)] py-4">
                No tests in your catalog.{" "}
                <Link href="/tests" className="text-[var(--primary-deep)] hover:underline">
                  Add tests
                </Link>{" "}
                first.
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {tests.map((t) => {
                  const selected = selectedTests.has(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors ${
                        selected
                          ? "border-[var(--primary-deep)] bg-[var(--primary-soft)]"
                          : "border-transparent hover:bg-[var(--bg-base)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const next = new Set(selectedTests);
                            if (e.target.checked) next.add(t.id);
                            else next.delete(t.id);
                            setSelectedTests(next);
                          }}
                          className="w-4 h-4 accent-[var(--primary-deep)]"
                        />
                        <div>
                          <div className="text-sm font-medium">{t.name}</div>
                          <div className="text-xs text-[var(--text-tertiary)] font-mono">
                            {t.code} {t.department ? `· ${t.department}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">₹{(t.pricePaise / 100).toFixed(0)}</div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5 sticky top-6">
            <h2 className="text-sm font-medium mb-3">Summary</h2>
            <div className="text-xs text-[var(--text-secondary)] mb-3">
              {selectedTests.size} test{selectedTests.size !== 1 ? "s" : ""} selected
            </div>
            <div className="flex items-baseline justify-between border-t border-[var(--border-subtle)] pt-3">
              <span className="text-sm">Total</span>
              <span className="text-2xl font-semibold tracking-tight">₹{(total / 100).toFixed(0)}</span>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] block">Collection</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCollectionType("walk_in")}
                  className={`flex-1 text-xs py-1.5 rounded-lg border ${
                    collectionType === "walk_in"
                      ? "border-[var(--primary-deep)] bg-[var(--primary-soft)] text-[var(--primary-deep)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  Walk-in
                </button>
                <button
                  type="button"
                  onClick={() => setCollectionType("home")}
                  className={`flex-1 text-xs py-1.5 rounded-lg border ${
                    collectionType === "home"
                      ? "border-[var(--primary-deep)] bg-[var(--primary-soft)] text-[var(--primary-deep)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  Home
                </button>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting || !patientId || selectedTests.size === 0}
              className="w-full mt-5 bg-[var(--primary-deep)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--primary-accent)] disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <NewOrderInner />
    </Suspense>
  );
}
