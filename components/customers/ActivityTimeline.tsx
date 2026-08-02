"use client";

import { useEffect, useState } from "react";
import {
  MdPersonAdd,
  MdEdit,
  MdDelete,
  MdStickyNote2,
  MdChecklist,
  MdHistory,
} from "react-icons/md";

type TimelineEntry = {
  _id: string;
  action: string;
  details?: string;
  createdAt: string;
};

const ACTION_META: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  "customer.created": {
    icon: <MdPersonAdd size={16} />,
    label: "Customer created",
    color: "bg-green-50 text-green-600",
  },
  "customer.updated": {
    icon: <MdEdit size={16} />,
    label: "Customer updated",
    color: "bg-blue-50 text-blue-600",
  },
  "customer.deleted": {
    icon: <MdDelete size={16} />,
    label: "Customer deleted",
    color: "bg-red-50 text-red-600",
  },
  "note.created": {
    icon: <MdStickyNote2 size={16} />,
    label: "Note added",
    color: "bg-amber-50 text-amber-600",
  },
  "note.updated": {
    icon: <MdStickyNote2 size={16} />,
    label: "Note updated",
    color: "bg-amber-50 text-amber-600",
  },
  "note.deleted": {
    icon: <MdDelete size={16} />,
    label: "Note deleted",
    color: "bg-red-50 text-red-600",
  },
  "task.created": {
    icon: <MdChecklist size={16} />,
    label: "Task created",
    color: "bg-purple-50 text-purple-600",
  },
  "task.updated": {
    icon: <MdChecklist size={16} />,
    label: "Task updated",
    color: "bg-purple-50 text-purple-600",
  },
  "task.deleted": {
    icon: <MdDelete size={16} />,
    label: "Task deleted",
    color: "bg-red-50 text-red-600",
  },
};

const DEFAULT_META = {
  icon: <MdHistory size={16} />,
  label: "Activity",
  color: "bg-gray-50 text-gray-500",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityTimeline({
  customerId,
}: {
  customerId: string;
}) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTimeline() {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/${customerId}/timeline`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load activity.");
          return;
        }
        setEntries(data.entries);
      } catch {
        setError("Failed to load activity.");
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [customerId]);

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Activity</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading activity...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <ol className="space-y-4">
            {entries.map((entry) => {
              const meta = ACTION_META[entry.action] || DEFAULT_META;
              return (
                <li key={entry._id} className="flex gap-3">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${meta.color}`}
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-sm text-gray-800">
                      {meta.label}
                      {entry.details && (
                        <span className="text-gray-500">
                          {" "}
                          — {entry.details}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
