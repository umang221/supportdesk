import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminSlaPolicy } from "@/components/admin/AdminSlaPolicy";
import { getCurrentUser } from "@/lib/auth/session";
import { getEffectiveSlaPolicies } from "@/server/services/slaPolicyService";

export const metadata = { title: "SLA Policy · Admin · SupportDesk" };

export default async function AdminSlaPolicyPage() {
  const user = await getCurrentUser();
  const policies = await getEffectiveSlaPolicies();

  return (
    <AppShell activeHref="/admin/sla-policy" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-4xl p-space-lg">
        <AdminSlaPolicy policies={policies} />
      </div>
    </AppShell>
  );
}
