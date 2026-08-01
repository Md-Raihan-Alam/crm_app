"use client";

type Task = {
  _id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  dueDate?: string;
};

const STATUS_STYLES: Record<Task["status"], string> = {
  pending: "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
};

export default function TaskCard({
  task,
  onStatusChange,
}: {
  task: Task;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-gray-800">{task.title}</p>
        {task.dueDate && (
          <p className="text-xs text-gray-400">
            Due {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>
      <select
        value={task.status}
        onChange={(e) =>
          onStatusChange(task._id, e.target.value as Task["status"])
        }
        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize focus:outline-none ${
          STATUS_STYLES[task.status]
        }`}
      >
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
