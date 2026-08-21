"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Test {
  id: string;
  code: string;
  name: string;
  department: string | null;
  sampleType: string | null;
  pricePaise: number;
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", department: "", sampleType: "", priceRupees: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadTests() {
    setLoading(true);
    const r = await fetch("/api/tests");
    const data = await r.json();
    setTests(data.tests || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTests();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase().replace(/\s+/g, "-"),
          name: form.name,
          department: form.department || undefined,
          sampleType: form.sampleType || undefined,
          pricePaise: Math.round(parseFloat(form.priceRupees) * 100),
          tatHours: 24,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add test");
        return;
      }
      setForm({ code: "", name: "", department: "", sampleType: "", priceRupees: "" });
      setShowAdd(false);
      loadTests();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Test catalog</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-accent)]"
        >
          {showAdd ? "Cancel" : "+ Add test"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={onAdd}
          className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5 mb-4 space-y-3"
        >
          {error && (
            <div className="p-3 text-sm bg-[#fef2f2] border border-[#fecaca] text-[var(--status-danger)] rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Code (e.g. CBC)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
              className="px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)]"
            />
            <input
              placeholder="Name (e.g. Complete Blood Count)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)]"
            />
            <input
              placeholder="Department (Hematology)"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)]"
            />
            <input
              placeholder="Sample type (Blood)"
              value={form.sampleType}
              onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
              className="px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)]"
            />
            <input
              placeholder="Price (₹)"
              value={form.priceRupees}
              onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
              type="number"
              step="0.01"
              required
              className="px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] col-span-2"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-accent)] disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save test"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-[var(--text-secondary)] py-8 text-center">Loading...</div>
      ) : tests.length === 0 ? (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-12 text-center">
          <div className="text-sm font-medium mb-1">No tests in your catalog</div>
          <div className="text-xs text-[var(--text-secondary)] mb-4">
            Add tests to start creating orders.
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          {tests.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] last:border-0"
            >
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                  {t.code}
                  {t.department ? ` · ${t.department}` : ""}
                  {t.sampleType ? ` · ${t.sampleType}` : ""}
                </div>
              </div>
              <div className="text-sm font-medium">₹{(t.pricePaise / 100).toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
