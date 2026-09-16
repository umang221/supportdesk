import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminSlaPolicy } from "@/components/admin/AdminSlaPolicy";
import { getCurrentUser } from "@/lib/auth/session";
import { getEffectiveSlaPolicies } from "@/server/services/slaPolicyService";

export const metadata = { title: "SLA Policy · Admin · SupportDesk" };

export default async function AdminSlaPolicyPage() {
  const user = await getCurrentUser();
  const policies = await getEffectiveSlaPolicies();

  // Forces AdminSlaPolicy to remount with this render's data on every real
  // navigation, including browser back/forward — see AdminAgentsPage's
  // identical comment for the full reasoning.
  // eslint-disable-next-line react-hooks/purity
  const renderKey = Date.now();

  return (
    <AppShell activeHref="/admin/sla-policy" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-4xl p-space-lg">
        <AdminSlaPolicy key={renderKey} policies={policies} />
      </div>
    </AppShell>
  );
}
