"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface MeResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId: string | null;
  } | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  } | null;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/orders", label: "Orders" },
  { href: "/tests", label: "Tests" },
];

export default function LabLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
        } else {
          setMe(data);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-sm text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-col">
        <div className="p-5 border-b border-[var(--border-subtle)]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--primary-deep)] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Q</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] truncate">{me.tenant?.name}</div>
              <div className="text-[11px] text-[var(--text-tertiary)] truncate font-mono">
                {me.tenant?.slug}
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 text-[13px] rounded-lg transition-colors ${
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary-deep)] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border-subtle)]">
          <div className="px-3 py-2 text-xs">
            <div className="font-medium truncate">{me.user?.fullName}</div>
            <div className="text-[var(--text-tertiary)] truncate">{me.user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-base)] rounded-lg"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
