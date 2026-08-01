"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdLogout, MdPerson } from "react-icons/md";
import { SafeUser } from "@/lib/session";

export default function Navbar({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MdPerson size={18} />
          <span className="font-medium">{user.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500">
            {user.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
        >
          <MdLogout size={16} />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
