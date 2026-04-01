import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageHeader } from "@/components/shared/page-header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function StudentChangePasswordPage() {
  const session = await getServerSession(authOptions);
  const forced = session?.user?.mustChangePassword ?? false;
  return (
    <div className="space-y-6">
      <PageHeader title="Change Password" />
      <ChangePasswordForm forced={forced} />
    </div>
  );
}
