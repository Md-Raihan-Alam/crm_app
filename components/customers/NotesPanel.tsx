"use client";

import { useEffect, useState, useCallback } from "react";
import { MdDelete, MdVisibility, MdVisibilityOff } from "react-icons/md";

type Note = {
  _id: string;
  content: string;
  visibleToCustomer: boolean;
  createdAt: string;
};

export default function NotesPanel({ customerId }: { customerId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [visibleToCustomer, setVisibleToCustomer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/notes`);
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
  }, [customerId]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchNotes();
    };
    fetchData();
  }, [fetchNotes]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, visibleToCustomer }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add note.");
        return;
      }

      setContent("");
      setVisibleToCustomer(false);
      await fetchNotes();
    } catch {
      setError("Failed to add note.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(noteId: string) {
    const confirmed = window.confirm(
      "Delete this note? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/customers/${customerId}/notes/${noteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete note.");
        return;
      }

      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch {
      setError("Failed to delete note.");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Notes</h2>

      <form onSubmit={handleAddNote} className="mt-4 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={visibleToCustomer}
              onChange={(e) => setVisibleToCustomer(e.target.checked)}
              className="rounded border-gray-300"
            />
            Visible to customer
          </label>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Note"}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-gray-400">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex-1">
                <p className="text-sm text-gray-800">{note.content}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                  {note.visibleToCustomer ? (
                    <>
                      <MdVisibility size={14} />
                      Visible to customer
                    </>
                  ) : (
                    <>
                      <MdVisibilityOff size={14} />
                      Internal only
                    </>
                  )}
                  <span>· {new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(note._id)}
                className="ml-3 text-gray-400 hover:text-red-600"
                aria-label="Delete note"
              >
                <MdDelete size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
