import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ReportsView from "@/components/reports/ReportsView";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return <ReportsView />;
}
