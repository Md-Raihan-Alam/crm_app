"use client";

import { MdPerson } from "react-icons/md";

type Task = {
  _id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  dueDate?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  customerName?: string;
};

const STATUS_STYLES: Record<Task["status"], string> = {
  pending: "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
};

export default function TaskCard({
  task,
  onStatusChange,
  updating,
  showAssignee = false,
}: {
  task: Task;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  updating: boolean;
  showAssignee?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">
          {task.title}
        </p>

        {task.customerName && (
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {task.customerName}
          </p>
        )}

        {showAssignee && task.assigneeName && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
            <MdPerson size={12} />
            {task.assigneeName}
          </p>
        )}

        {task.dueDate && (
          <p className="mt-0.5 text-xs text-gray-400">
            Due {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <select
        value={task.status}
        onChange={(e) =>
          onStatusChange(task._id, e.target.value as Task["status"])
        }
        disabled={updating}
        className={`ml-3 flex-shrink-0 rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize focus:outline-none disabled:opacity-50 ${
          STATUS_STYLES[task.status]
        }`}
      >
        <option value="pending">{updating ? "Updating..." : "Pending"}</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
