"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    ageUnit: "years",
    sex: "male",
    phone: "",
    email: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: form.age ? parseInt(form.age) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create patient");
        return;
      }
      router.push(`/orders/new?patientId=${data.patient.id}`);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/patients" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          ← Patients
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">New patient</h1>
      </div>

      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-6">
        {error && (
          <div className="mb-4 p-3 text-sm bg-[#fef2f2] border border-[#fecaca] text-[var(--status-danger)] rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Full name *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Age"
              value={form.age}
              onChange={(v) => setForm({ ...form, age: v })}
              type="number"
            />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Unit</label>
              <select
                value={form.ageUnit}
                onChange={(e) => setForm({ ...form, ageUnit: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)]"
              >
                <option value="years">Years</option>
                <option value="months">Months</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Sex</label>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)]"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          </div>
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />

          <div className="flex gap-2 pt-2">
            <Link
              href="/patients"
              className="px-4 py-2 text-sm border border-[var(--border-subtle)] rounded-lg hover:border-[var(--text-tertiary)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-[var(--primary-deep)] text-white rounded-lg hover:bg-[var(--primary-accent)] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3.5 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
      />
    </div>
  );
}
