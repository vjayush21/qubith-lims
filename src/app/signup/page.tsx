"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    labName: "",
    labSlug: "",
    city: "",
    phone: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  function onLabNameChange(v: string) {
    setForm((f) => ({
      ...f,
      labName: v,
      labSlug: f.labSlug && f.labSlug.startsWith(slugify(f.labName)) ? slugify(v) : f.labSlug,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-[var(--primary-deep)] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Q</span>
          </div>
          <span className="font-semibold text-[15px]">QuBith LIMS</span>
        </Link>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-7">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Start your free trial</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            30 days. No credit card. Setup in 1 day.
          </p>

          {error && (
            <div className="mb-4 p-3 text-sm bg-[#fef2f2] border border-[#fecaca] text-[var(--status-danger)] rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3.5">
            <FormField
              label="Lab name"
              value={form.labName}
              onChange={(v) => onLabNameChange(v)}
              required
            />
            <FormField
              label="Lab URL"
              value={form.labSlug}
              onChange={(v) => setForm({ ...form, labSlug: slugify(v) })}
              prefix="lims.qubith.in/"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="City"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <FormField
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                type="tel"
              />
            </div>
            <FormField
              label="Your name"
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
              required
            />
            <FormField
              label="Email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              type="email"
              required
            />
            <FormField
              label="Password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              type="password"
              required
              minLength={8}
              hint="At least 8 characters"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary-deep)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--primary-accent)] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-center text-[var(--text-secondary)] mt-5">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--primary-deep)] font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required,
  prefix,
  hint,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  prefix?: string;
  hint?: string;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      {prefix ? (
        <div className="flex items-stretch border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus-within:border-[var(--primary-deep)] focus-within:ring-2 focus-within:ring-[var(--primary-deep)] focus-within:ring-opacity-20 transition-all overflow-hidden">
          <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-base)] px-3 flex items-center border-r border-[var(--border-subtle)] font-mono">
            {prefix}
          </span>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            minLength={minLength}
            className="flex-1 px-3 py-2 text-sm outline-none"
          />
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          className="w-full px-3.5 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
        />
      )}
      {hint && <p className="text-xs text-[var(--text-tertiary)] mt-1">{hint}</p>}
    </div>
  );
}
