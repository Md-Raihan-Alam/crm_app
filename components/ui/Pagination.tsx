"use client";

import { MdChevronLeft, MdChevronRight } from "react-icons/md";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MdChevronLeft size={18} />
        Previous
      </button>

      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <MdChevronRight size={18} />
      </button>
    </div>
  );
}
