"use client";

import { useEffect, useState } from "react";

type StatusCount = { _id: string; count: number };

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

export default function ReportsView() {
  const [customersByStatus, setCustomersByStatus] = useState<StatusCount[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load reports.");
          return;
        }
        setCustomersByStatus(data.customersByStatus);
        setTasksByStatus(data.tasksByStatus);
      } catch {
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      <p className="mt-1 text-sm text-gray-500">
        Basic breakdowns across your CRM data.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <ReportCard title="Customers by Status" data={customersByStatus} />
          <ReportCard title="Tasks by Status" data={tasksByStatus} />
        </div>
      )}
    </div>
  );
}

function ReportCard({ title, data }: { title: string; data: StatusCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400">No data yet.</p>
        ) : (
          data.map((item) => {
            const percent =
              total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item._id}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {STATUS_LABELS[item._id] || item._id}
                  </span>
                  <span className="font-medium text-gray-900">
                    {item.count}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
