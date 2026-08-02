import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import CustomerDetailClient from "@/components/customers/CustomerDetailClient";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;

  return <CustomerDetailClient id={id} currentUserId={String(user._id)} role={user.role} />;
}