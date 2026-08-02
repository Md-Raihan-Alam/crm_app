"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdArrowBack, MdEdit, MdDelete, MdSave, MdClose } from "react-icons/md";
import NotesPanel from "@/components/customers/NotesPanel";
import TasksPanel from "@/components/customers/TasksPanel";
import ActivityTimeline from "@/components/customers/ActivityTimeline";

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "lead" | "active" | "inactive";
};

export default function CustomerDetailClient({
  id,
  currentUserId,
  role,
}: {
  id: string;
  currentUserId: string;
  role: "admin" | "customer";
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCustomer() {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load customer.");
          return;
        }

        setCustomer(data.customer);
        setForm(data.customer);
      } catch {
        setError("Failed to load customer.");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update customer.");
        setSaving(false);
        return;
      }

      setCustomer(data.customer);
      setForm(data.customer);
      setEditing(false);
    } catch {
      setError("Failed to update customer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${customer?.name}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete customer.");
        setDeleting(false);
        return;
      }

      router.push("/customers");
      router.refresh();
    } catch {
      setError("Failed to delete customer.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <p className="px-4 py-10 text-center text-sm text-gray-400">Loading...</p>
    );
  }

  if (error && !customer) {
    return (
      <p className="px-4 py-10 text-center text-sm text-red-600">{error}</p>
    );
  }

  if (!customer) return null;

  return (
    <div className="max-w-lg">
      <Link
        href="/customers"
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <MdArrowBack size={16} />
        Back to Customers
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          {customer.name}
        </h1>
        {!editing && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <MdEdit size={16} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <MdDelete size={16} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Field
          label="Name"
          name="name"
          value={form.name}
          editing={editing}
          onChange={handleChange}
        />
        <Field
          label="Email"
          name="email"
          value={form.email}
          editing={editing}
          onChange={handleChange}
          type="email"
        />
        <Field
          label="Phone"
          name="phone"
          value={form.phone}
          editing={editing}
          onChange={handleChange}
        />
        <Field
          label="Company"
          name="company"
          value={form.company}
          editing={editing}
          onChange={handleChange}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          {editing ? (
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          ) : (
            <p className="text-sm capitalize text-gray-900">
              {customer.status}
            </p>
          )}
        </div>

        {editing && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <MdSave size={16} />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setForm(customer);
                setEditing(false);
                setError("");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <MdClose size={16} />
              Cancel
            </button>
          </div>
        )}
      </div>
      <NotesPanel customerId={id} />
      <TasksPanel customerId={id} role={role} currentUserId={currentUserId} />
      <ActivityTimeline customerId={id} />
    </div>
  );
}

function Field({
  label,
  name,
  value,
  editing,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string;
  editing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {editing ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      ) : (
        <p className="text-sm text-gray-900">{value || "—"}</p>
      )}
    </div>
  );
}
