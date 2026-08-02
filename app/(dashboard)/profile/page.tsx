import { getCurrentUser } from "@/lib/session";
import ProfileForm from "@/components/profile/ProfileForm";
import PasswordForm from "@/components/profile/PasswordForm";
import AccountInfo from "@/components/profile/AccountInfo";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account details.
        </p>
      </div>

      {user && <ProfileForm name={user.name} email={user.email} />}
      {user?.role === "customer" && <AccountInfo />}
      <PasswordForm />
    </div>
  );
}
