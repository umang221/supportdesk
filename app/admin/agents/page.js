import { AppShell } from "@/components/layout/AppShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminAgents } from "@/components/admin/AdminAgents";
import { getCurrentUser } from "@/lib/auth/session";
import { listUsersForAdmin } from "@/server/services/userService";
import { listTeams } from "@/server/services/teamService";
import { listTickets } from "@/server/services/ticketService";
import { normalizeAdminAgent, normalizeAdminTeam } from "@/lib/api/admin-adapter";
import { normalizeTicket } from "@/lib/api/ticket-adapter";

export const metadata = { title: "Agents · Admin · SupportDesk" };

export default async function AdminAgentsPage() {
  const user = await getCurrentUser();
  const [users, teams, { tickets }] = await Promise.all([
    listUsersForAdmin(),
    listTeams(),
    listTickets({ limit: 100 }),
  ]);

  // Forces AdminAgents to remount with this render's data on every real
  // navigation to this page, including browser back/forward — Next's
  // client Router Cache can otherwise restore a previously-mounted
  // instance whose local state (edits, filters) predates this fetch. See
  // AdminAgents.jsx's doc comment for the full reasoning; this is a Server
  // Component page function invoked once per request, not a re-rendering
  // client component, so the purity rule's concern doesn't apply here.
  // eslint-disable-next-line react-hooks/purity
  const renderKey = Date.now();

  return (
    <AppShell activeHref="/admin/agents" navVariant="admin" user={user} sidebarFooter={<UserMenu user={user} />}>
      <div className="mx-auto w-full max-w-5xl p-space-lg">
        <AdminAgents
          key={renderKey}
          agents={users.map(normalizeAdminAgent)}
          teams={teams.map(normalizeAdminTeam)}
          tickets={tickets.map(normalizeTicket)}
        />
      </div>
    </AppShell>
  );
}
