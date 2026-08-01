import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import NewCustomerForm from "@/components/customers/NewCustomerForm";

export default async function NewCustomerPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return <NewCustomerForm />;
}
