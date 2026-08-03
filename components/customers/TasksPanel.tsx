"use client";

import { useEffect, useState, useCallback } from "react";
import { MdAdd, MdDelete } from "react-icons/md";

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  assignedTo: string;
  dueDate?: string;
};

const STATUS_STYLES: Record<Task["status"], string> = {
  pending: "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
};

export default function TasksPanel({
  customerId,
  role,
  currentUserId,
}: {
  customerId: string;
  role: "admin" | "customer";
  currentUserId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState(currentUserId);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/tasks`);
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
  }, [customerId]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchTasks();
    };
    fetchData();
  }, [fetchTasks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/customers/${customerId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, assignedTo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create task.");
        return;
      }

      setTitle("");
      setShowForm(false);
      await fetchTasks();
    } catch {
      setError("Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  }

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

  async function handleDelete(taskId: string) {
    const confirmed = window.confirm(
      "Delete this task? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete task.");
        return;
      }

      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch {
      setError("Failed to delete task.");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        {role === "admin" && (
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <MdAdd size={16} />
            New Task
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-4 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            className="flex-1 rounded-lg text-black border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-gray-400">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks yet.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {task.title}
                </p>
                {task.dueDate && (
                  <p className="text-xs text-gray-400">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={task.status}
                  onChange={(e) =>
                    handleStatusChange(
                      task._id,
                      e.target.value as Task["status"]
                    )
                  }
                  className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize focus:outline-none ${
                    STATUS_STYLES[task.status]
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                {role === "admin" && (
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label="Delete task"
                  >
                    <MdDelete size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
