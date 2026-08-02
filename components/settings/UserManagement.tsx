"use client";

import { useEffect, useState, useCallback } from "react";
import { MdAdd } from "react-icons/md";

type UserRecord = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  createdAt: string;
};

type CustomerOption = {
  _id: string;
  name: string;
  userId?: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Used for manual refetches triggered by user actions (e.g. after creating
  // a login). Safe to call setState synchronously here since it's invoked
  // from event handlers, not from an effect.
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, customersRes] = await Promise.all([
        fetch("/api/settings/users"),
        fetch("/api/customers?limit=100"),
      ]);
      const usersData = await usersRes.json();
      const customersData = await customersRes.json();

      if (usersRes.ok) setUsers(usersData.users);
      if (customersRes.ok) setCustomers(customersData.customers);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load. Defined inline (rather than calling fetchAll) so that no
  // setState call happens synchronously within the effect body — every
  // setState call here happens after an await, inside the resolved promise
  // callback, which avoids the cascading-render issue the lint flags.
  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        const [usersRes, customersRes] = await Promise.all([
          fetch("/api/settings/users"),
          fetch("/api/customers?limit=100"),
        ]);
        const usersData = await usersRes.json();
        const customersData = await customersRes.json();

        if (ignore) return;

        if (usersRes.ok) setUsers(usersData.users);
        if (customersRes.ok) setCustomers(customersData.customers);
        if (!usersRes.ok || !customersRes.ok) {
          setError("Failed to load data.");
        }
      } catch {
        if (!ignore) setError("Failed to load data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  // Only customers without an existing linked login can get a new one.
  const unlinkedCustomers = customers.filter((c) => !c.userId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create login.");
        return;
      }

      setForm({ customerId: "", email: "", password: "" });
      setShowForm(false);
      await fetchAll();
    } catch {
      setError("Failed to create login.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Customer Logins
          </h2>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <MdAdd size={16} />
            New Login
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-4 space-y-3 border-t border-gray-100 pt-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Customer
              </label>
              <select
                value={form.customerId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customerId: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a customer...</option>
                {unlinkedCustomers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Login Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Initial Password
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
                minLength={8}
                placeholder="Share this with the customer directly"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Login"}
            </button>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900">All Accounts</h2>
        </div>
        {loading ? (
          <p className="px-4 py-6 text-sm text-gray-400">Loading...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-2 text-gray-800">{u.name}</td>
                  <td className="px-4 py-2 text-gray-600">{u.email}</td>
                  <td className="px-4 py-2 capitalize text-gray-600">
                    {u.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
