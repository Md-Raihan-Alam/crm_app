"use client";

import { useEffect, useState, useCallback } from "react";
import TaskCard from "@/components/tasks/TaskCard";

type Task = {
  _id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  dueDate?: string;
  assigneeName?: string;
  customerName?: string;
};

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tasksRes, profileRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/profile"),
      ]);
      const tasksData = await tasksRes.json();
      const profileData = await profileRes.json();

      if (!tasksRes.ok) {
        setError(tasksData.error || "Failed to load tasks.");
        return;
      }

      setTasks(tasksData.tasks);
      setIsAdmin(profileData.user?.role === "admin");
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await fetchTasks();
    };
    fetchData();
  }, [fetchTasks]);

  async function handleStatusChange(taskId: string, status: Task["status"]) {
    setUpdatingTaskId(taskId);
    setError("");
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
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        {isAdmin ? "All Tasks" : "My Tasks"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {isAdmin
          ? "Every task across all customers and assignees."
          : "Tasks assigned to you, across all customers."}
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
                        updating={updatingTaskId === task._id}
                        showAssignee={isAdmin}
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
