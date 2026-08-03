"use client";

import Link from "next/link";
import { MdBusiness, MdArrowForward } from "react-icons/md";

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "lead" | "active" | "inactive";
};

const STATUS_STYLES: Record<Customer["status"], string> = {
  lead: "bg-yellow-50 text-yellow-700",
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
};

export default function CustomerTable({
  customers,
}: {
  customers: Customer[];
}) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MdBusiness size={32} className="mb-2 text-gray-300" />
        <p className="text-sm text-gray-500">No customers found.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-gray-200 text-gray-500">
        <tr>
          <th className="px-4 py-3 font-medium">Name</th>
          <th className="px-4 py-3 font-medium">Email</th>
          <th className="px-4 py-3 font-medium">Company</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {customers.map((customer) => (
          <tr key={customer._id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">
              {customer.name}
            </td>
            <td className="px-4 py-3 text-gray-600">{customer.email}</td>
            <td className="px-4 py-3 text-gray-600">
              {customer.company || "—"}
            </td>
            <td className="px-4 py-3">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  STATUS_STYLES[customer.status]
                }`}
              >
                {customer.status}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <Link
                href={`/customers/${customer._id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Manage
                <MdArrowForward size={14} />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
