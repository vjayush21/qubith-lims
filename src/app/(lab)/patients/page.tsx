"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  age: number | null;
  ageUnit: string | null;
  sex: string | null;
  phone: string | null;
  createdAt: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/patients?q=${encodeURIComponent(q)}&limit=100`)
        .then((r) => r.json())
        .then((data) => {
          setPatients(data.patients || []);
          setLoading(false);
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
        <Link
          href="/patients/new"
          className="text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-accent)]"
        >
          + New patient
        </Link>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, phone, or patient code..."
        className="w-full px-3.5 py-2.5 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] mb-4 focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
      />

      {loading ? (
        <div className="text-sm text-[var(--text-secondary)] py-8 text-center">Loading...</div>
      ) : patients.length === 0 ? (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-12 text-center">
          <div className="text-sm font-medium mb-1">No patients found</div>
          <div className="text-xs text-[var(--text-secondary)] mb-4">
            {q ? "Try a different search." : "Start by registering your first patient."}
          </div>
          <Link
            href="/patients/new"
            className="inline-block text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-accent)]"
          >
            + New patient
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          {patients.map((p) => (
            <Link
              key={p.id}
              href={`/orders/new?patientId=${p.id}`}
              className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-base)]"
            >
              <div>
                <div className="text-sm font-medium">{p.fullName}</div>
                <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                  {p.patientCode}
                  {p.age ? ` · ${p.age} ${p.ageUnit || ""}` : ""}
                  {p.sex ? ` · ${p.sex}` : ""}
                </div>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{p.phone || ""}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
