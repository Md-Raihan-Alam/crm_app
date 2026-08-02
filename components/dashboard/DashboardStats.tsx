"use client";

import { useEffect, useState } from "react";

type AdminStats = {
  totalCustomers: number;
  openTasks: number;
  activeLeads: number;
  notesThisWeek: number;
};

type CustomerStats = {
  myOpenTasks: number;
  myNotes: number;
};

export default function DashboardStats({
  role,
}: {
  role: "admin" | "customer";
}) {
  const [stats, setStats] = useState<AdminStats | CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards =
    role === "admin"
      ? [
          {
            label: "Total Customers",
            value: (stats as AdminStats)?.totalCustomers,
          },
          { label: "Open Tasks", value: (stats as AdminStats)?.openTasks },
          { label: "Active Leads", value: (stats as AdminStats)?.activeLeads },
          {
            label: "Notes This Week",
            value: (stats as AdminStats)?.notesThisWeek,
          },
        ]
      : [
          {
            label: "My Open Tasks",
            value: (stats as CustomerStats)?.myOpenTasks,
          },
          { label: "My Notes", value: (stats as CustomerStats)?.myNotes },
        ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {loading ? "—" : card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
