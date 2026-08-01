"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdDashboard,
  MdPeople,
  MdChecklist,
  MdStickyNote2,
  MdBarChart,
  MdSettings,
} from "react-icons/md";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <MdDashboard size={20} /> },
  {
    label: "Customers",
    href: "/customers",
    icon: <MdPeople size={20} />,
    adminOnly: true,
  },
  { label: "Tasks", href: "/tasks", icon: <MdChecklist size={20} /> },
  { label: "Notes", href: "/notes", icon: <MdStickyNote2 size={20} /> },
  {
    label: "Reports",
    href: "/reports",
    icon: <MdBarChart size={20} />,
    adminOnly: true,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <MdSettings size={20} />,
    adminOnly: true,
  },
];

export default function Sidebar({ role }: { role: "admin" | "customer" }) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === "admin"
  );

  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white sm:flex">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-semibold text-gray-900">CRM</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
