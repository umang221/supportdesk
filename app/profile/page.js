import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { StaffProfile } from "@/components/profile/StaffProfile";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Profile · SupportDesk" };

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-2xl p-space-lg">
        <StaffProfile user={user} />
      </div>
    </AppShell>
  );
}
