"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdStickyNote2 } from "react-icons/md";

type Note = {
  _id: string;
  content: string;
  visibleToCustomer: boolean;
  createdAt: string;
  customerId: string;
  customerName?: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch("/api/notes");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load notes.");
          return;
        }
        setNotes(data.notes);
      } catch {
        setError("Failed to load notes.");
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>
      <p className="mt-1 text-sm text-gray-500">
        Notes across all customers you have access to.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">
            Loading...
          </p>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MdStickyNote2 size={32} className="mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No notes yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notes.map((note) => (
              <li key={note._id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-gray-800">{note.content}</p>
                  <span className="whitespace-nowrap text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {note.customerName && (
                  <Link
                    href={`/customers/${note.customerId}`}
                    className="mt-1.5 inline-block text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {note.customerName}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
