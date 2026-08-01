import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import CustomersPageClient from "@/components/customers/CustomersPageClient";

export default async function CustomersPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return <CustomersPageClient />;
}
