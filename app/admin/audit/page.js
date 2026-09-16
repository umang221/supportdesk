import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminAudit } from "@/components/admin/AdminAudit";
import { getCurrentUser } from "@/lib/auth/session";
import { listAuditLogs } from "@/server/services/auditService";
import { normalizeAuditEntry } from "@/lib/api/admin-adapter";

export const metadata = { title: "Audit Log · Admin · SupportDesk" };

export default async function AdminAuditPage() {
  const user = await getCurrentUser();
  const { entries, totalPages } = await listAuditLogs({ page: 1 });

  // Forces AdminAudit to remount with this render's data on every real
  // navigation, including browser back/forward — see AdminAgentsPage's
  // identical comment for the full reasoning.
  // eslint-disable-next-line react-hooks/purity
  const renderKey = Date.now();

  return (
    <AppShell activeHref="/admin/audit" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-6xl p-space-lg">
        <AdminAudit key={renderKey} initialEntries={entries.map(normalizeAuditEntry)} initialTotalPages={totalPages} />
      </div>
    </AppShell>
  );
}
