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

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/test-orders?limit=100")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <Link
          href="/orders/new"
          className="text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-accent)]"
        >
          + New order
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-[var(--text-secondary)] py-8 text-center">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-12 text-center">
          <div className="text-sm font-medium mb-1">No orders yet</div>
          <Link
            href="/orders/new"
            className="inline-block text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-accent)] mt-2"
          >
            Create your first order
          </Link>
        </div>
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
                <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                  {o.orderCode} · {o.patientCode} · {o.collectionType}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">₹{(o.totalAmountPaise / 100).toFixed(0)}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
