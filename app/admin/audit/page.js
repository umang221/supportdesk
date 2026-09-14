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

  return (
    <AppShell activeHref="/admin/audit" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-6xl p-space-lg">
        <AdminAudit initialEntries={entries.map(normalizeAuditEntry)} initialTotalPages={totalPages} />
      </div>
    </AppShell>
  );
}
