"use client";

import { useEffect, useState, useCallback } from "react";
import TaskCard from "@/components/tasks/TaskCard";

type Task = {
  _id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  dueDate?: string;
};

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load tasks.");
        return;
      }
      setTasks(data.tasks);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/tasks");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load tasks.");
          return;
        }
        setTasks(data.tasks);
      } catch {
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  async function handleStatusChange(taskId: string, status: Task["status"]) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update task.");
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status } : t))
      );
    } catch {
      setError("Failed to update task.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tasks assigned to you, across all customers.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key}>
                <h3 className="mb-2 text-sm font-semibold text-gray-500">
                  {col.label} ({columnTasks.length})
                </h3>
                <div className="space-y-2">
                  {columnTasks.length === 0 ? (
                    <p className="text-sm text-gray-300">No tasks.</p>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
