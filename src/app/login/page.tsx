"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password");
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-[var(--primary-deep)] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Q</span>
          </div>
          <span className="font-semibold text-[15px]">QuBith LIMS</span>
        </Link>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-7">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Login to your lab</p>

          {error && (
            <div className="mb-4 p-3 text-sm bg-[#fef2f2] border border-[#fecaca] text-[var(--status-danger)] rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary-deep)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--primary-accent)] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-sm text-center text-[var(--text-secondary)] mt-5">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-[var(--primary-deep)] font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
