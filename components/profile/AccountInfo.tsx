"use client";

import { useEffect, useState } from "react";

type CustomerRecord = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "lead" | "active" | "inactive";
};

export default function AccountInfo() {
  const [record, setRecord] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAccount() {
      try {
        const res = await fetch("/api/account");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load account info.");
          return;
        }
        setRecord(data.customer);
      } catch {
        setError("Failed to load account info.");
      } finally {
        setLoading(false);
      }
    }
    fetchAccount();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-400">Loading account info...</p>
      </div>
    );
  }

  if (error || !record) {
    return null; // silently omit — an Admin viewing their own profile has no such record, which is expected, not an error to surface
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Customer Record</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          Managed by your account administrator.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Company</p>
          <p className="mt-0.5 text-gray-900">{record.company || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Phone</p>
          <p className="mt-0.5 text-gray-900">{record.phone || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <p className="mt-0.5 capitalize text-gray-900">{record.status}</p>
        </div>
      </div>
    </div>
  );
}
