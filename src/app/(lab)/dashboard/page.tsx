"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderRow {
  id: string;
  orderCode: string;
  patientName: string;
  patientCode: string;
  totalAmountPaise: number;
  paidAmountPaise: number;
  paymentStatus: string;
  collectionType: string;
  collectionStatus: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/test-orders?limit=10")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      });
  }, []);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + (o.paidAmountPaise || 0),
    0
  ) / 100;

  const pendingOrders = orders.filter((o) => o.collectionStatus !== "completed").length;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-[var(--border-subtle)] rounded-xl overflow-hidden mb-8">
        <Stat label="Today's orders" value={String(todayOrders.length)} />
        <Stat label="Today's revenue" value={`₹${todayRevenue.toFixed(0)}`} />
        <Stat label="Pending" value={String(pendingOrders)} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Quick actions</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <ActionCard
          href="/patients/new"
          title="New patient"
          subtitle="Register a new patient"
        />
        <ActionCard href="/orders/new" title="New order" subtitle="Order tests for a patient" />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Recent orders</h2>
        <Link
          href="/orders"
          className="text-xs text-[var(--primary-deep)] hover:underline"
        >
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-[var(--text-secondary)] py-8 text-center">Loading...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          body="Create your first order to get started."
          action={{ href: "/orders/new", label: "New order" }}
        />
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-base)]"
            >
              <div>
                <div className="text-sm font-medium">{o.patientName}</div>
                <div className="text-xs text-[var(--text-tertiary)] font-mono">
                  {o.orderCode} · {o.patientCode}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">₹{(o.totalAmountPaise / 100).toFixed(0)}</div>
                <StatusBadge status={o.collectionStatus} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-elevated)] p-5">
      <div className="text-xs text-[var(--text-secondary)] mb-1">{label}</div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function ActionCard({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="block bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--text-tertiary)] transition-colors"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-[#fef3c7] text-[var(--status-warning)]",
    completed: "bg-[#d1fae5] text-[var(--status-success)]",
    scheduled: "bg-[#dbeafe] text-[var(--status-info)]",
  };
  return (
    <span
      className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
        colors[status] || "bg-[#f5f5f4] text-[var(--text-secondary)]"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-12 text-center">
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-xs text-[var(--text-secondary)] mb-4">{body}</div>
      {action && (
        <Link
          href={action.href}
          className="inline-block text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-accent)]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
