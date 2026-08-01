"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MdSearch, MdAdd } from "react-icons/md";
import CustomerTable from "@/components/customers/CustomerTable";
import Pagination from "@/components/ui/Pagination";

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "lead" | "active" | "inactive";
};

export default function CustomersPageClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = useCallback(
    async (searchTerm: string, pageNum: number) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "10",
          ...(searchTerm ? { search: searchTerm } : {}),
        });
        const res = await fetch(`/api/customers?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load customers.");
          return;
        }

        setCustomers(data.customers);
        setTotalPages(data.pagination.totalPages);
      } catch {
        setError("Failed to load customers. Check your connection.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchCustomers(search, 1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, fetchCustomers]);

  useEffect(() => {
    if (page === 1) return;
    const timeout = setTimeout(() => {
      fetchCustomers(search, page);
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customer records.
          </p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <MdAdd size={18} />
          New Customer
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <div className="relative max-w-sm">
            <MdSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">
            Loading...
          </p>
        ) : (
          <CustomerTable customers={customers} />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
