import { getCurrentUser } from "@/lib/session";
import DashboardStats from "@/components/dashboard/DashboardStats";
export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome back, {user?.name}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Here&apos;s what&apos;s happening in your CRM.
      </p>

      <DashboardStats role={user?.role || "customer"} />
    </div>
  );
}
