import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import UserManagement from "@/components/settings/UserManagement";
export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage user accounts.</p>
      <UserManagement />
    </div>
  );
}
